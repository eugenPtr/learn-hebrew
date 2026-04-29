import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { supabase } from '@/lib/supabase'

export const maxDuration = 30

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const DEFAULT_COUNT = 5
const MAX_COUNT = 10
const TOP_VOCAB = 20
const RECENT_FEEDBACK = 10
const SUPPLEMENTAL_PER_POS = 8

type VocabRow = {
  id: string
  hebrew: string
  english: string
  pos: string | null
  gender: string | null
  binyan: string | null
  conjugations: { present?: string[] } | null
  root: string | null
}

type VocabRowWithEmbedding = VocabRow & {
  embedding: number[] | null
}

type RatedSentence = {
  english: string
  hebrew: string
  rating: 'up' | 'down'
  feedback: string | null
}

type GeneratedSentence = {
  english: string
  hebrew: string
  usedItemIds: string[]
}

const SYSTEM_PROMPT = `You generate Hebrew sentence translation exercises for a student living in Tel Aviv.

You will be given:
- A vocabulary list (id, Hebrew, English, part of speech) the student knows.
- Optional GOOD EXAMPLES — sentences the student rated thumbs-up. Mimic their style.
- Optional BAD EXAMPLES — sentences the student rated thumbs-down, with feedback. Avoid these patterns.

Generate the requested number of sentences. Each sentence must:
- Sound natural to a person living in Tel Aviv: colloquial, present-day Israeli Hebrew. Not formal, not bureaucratic, not literary.
- Use one or more words from the vocabulary list. List the IDs you used in "usedItemIds".
- Be short to medium length (5–15 words is ideal).
- Hebrew without niqqud (no vowel points).

Return ONLY a JSON object in this exact format:
{
  "sentences": [
    { "english": "...", "hebrew": "...", "usedItemIds": ["uuid", "uuid"] }
  ]
}`

const SYSTEM_PROMPT_ITEM_IDS = `You generate Hebrew sentence translation exercises for a student living in Tel Aviv.

You will be given:
- ANCHOR WORDS — specific vocabulary items the student just practiced. Each sentence must use at least one anchor word.
- SUPPLEMENTAL VOCABULARY — additional words the student knows, grouped by part of speech. Use these to fill in sentences naturally.

Generate the requested number of sentences. Each sentence must:
- Include at least one word from the ANCHOR WORDS section. List all IDs you used in "usedItemIds".
- Sound natural to a person living in Tel Aviv: colloquial, present-day Israeli Hebrew. Not formal, not bureaucratic, not literary.
- Be short to medium length (5–15 words is ideal).
- Hebrew without niqqud (no vowel points).

Return ONLY a JSON object in this exact format:
{
  "sentences": [
    { "english": "...", "hebrew": "...", "usedItemIds": ["uuid", "uuid"] }
  ]
}`

function isGenerated(data: unknown): data is { sentences: GeneratedSentence[] } {
  if (!data || typeof data !== 'object') return false
  const sentences = (data as Record<string, unknown>).sentences
  if (!Array.isArray(sentences)) return false
  return sentences.every(
    (s) =>
      s &&
      typeof s === 'object' &&
      typeof (s as Record<string, unknown>).english === 'string' &&
      typeof (s as Record<string, unknown>).hebrew === 'string' &&
      Array.isArray((s as Record<string, unknown>).usedItemIds) &&
      ((s as Record<string, unknown>).usedItemIds as unknown[]).every((v) => typeof v === 'string')
  )
}

function formatVocab(rows: VocabRow[]): string {
  return rows
    .map((r) => {
      const tag = r.pos ?? '?'
      const extras: string[] = []
      if (r.gender) extras.push(r.gender)
      if (r.binyan) extras.push(`binyan ${r.binyan}`)
      const ex = extras.length > 0 ? ` (${extras.join(', ')})` : ''
      return `- [${r.id}] ${r.hebrew} — ${r.english} [${tag}${ex}]`
    })
    .join('\n')
}

function formatExamples(label: string, examples: RatedSentence[]): string {
  if (examples.length === 0) return ''
  const lines = examples.map((s, i) => {
    const fb = s.feedback ? `\n  Feedback: ${s.feedback}` : ''
    return `${i + 1}. ${s.english}\n   ${s.hebrew}${fb}`
  })
  return `\n\n${label}:\n${lines.join('\n')}`
}

function formatSupplementalByPos(rows: VocabRow[]): string {
  const byPos = new Map<string, VocabRow[]>()
  for (const r of rows) {
    const pos = r.pos ?? 'other'
    const group = byPos.get(pos) ?? []
    group.push(r)
    byPos.set(pos, group)
  }
  const sections: string[] = []
  for (const [pos, items] of byPos) {
    sections.push(`${pos.toUpperCase()}:\n${formatVocab(items)}`)
  }
  return sections.join('\n\n')
}

export async function POST(req: NextRequest) {
  let themeId: string | undefined
  let itemIds: string[] | undefined
  let count: number
  try {
    const body = await req.json()
    const hasTheme = typeof body?.themeId === 'string'
    const hasItems = Array.isArray(body?.itemIds) && body.itemIds.length > 0

    if (hasTheme && hasItems) {
      return NextResponse.json({ error: 'Provide either themeId or itemIds, not both' }, { status: 400 })
    }
    if (!hasTheme && !hasItems) {
      return NextResponse.json({ error: 'Provide either themeId or itemIds' }, { status: 400 })
    }

    if (hasTheme) themeId = body.themeId
    if (hasItems) itemIds = body.itemIds as string[]
    count = typeof body.count === 'number' ? Math.min(MAX_COUNT, Math.max(1, body.count)) : DEFAULT_COUNT
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (itemIds) {
    return handleItemIdsMode(itemIds, count)
  }
  return handleThemeMode(themeId!, count)
}

async function handleThemeMode(themeId: string, count: number): Promise<NextResponse> {
  // Load theme + embedding
  const { data: theme, error: themeError } = await supabase
    .from('themes')
    .select('id, name, description, embedding')
    .eq('id', themeId)
    .maybeSingle()

  if (themeError) {
    console.error('[api/practice/sentences] theme fetch failed:', themeError.message)
    return NextResponse.json({ error: `DB error: ${themeError.message}` }, { status: 500 })
  }
  if (!theme) {
    return NextResponse.json({ error: 'Theme not found' }, { status: 404 })
  }

  // Vector-search top-N relevant vocabulary items
  const { data: vocab, error: vocabError } = await supabase.rpc('match_vocabulary_items', {
    query_embedding: theme.embedding,
    match_count: TOP_VOCAB,
  })

  if (vocabError) {
    console.error('[api/practice/sentences] vocab search failed:', vocabError.message)
    return NextResponse.json({ error: `DB error: ${vocabError.message}` }, { status: 500 })
  }

  const vocabRows: VocabRow[] = (vocab ?? []) as VocabRow[]
  if (vocabRows.length === 0) {
    return NextResponse.json(
      { error: 'No vocabulary items available — add some words to your lessons first' },
      { status: 422 }
    )
  }

  // Load recent rated sentences for this theme
  const { data: rated } = await supabase
    .from('generated_sentences')
    .select('english, hebrew, rating, feedback')
    .eq('theme_id', themeId)
    .order('created_at', { ascending: false })
    .limit(RECENT_FEEDBACK)

  const ratedRows = (rated ?? []) as RatedSentence[]
  const goodExamples = ratedRows.filter((r) => r.rating === 'up')
  const badExamples = ratedRows.filter((r) => r.rating === 'down')

  const userPrompt = [
    `Theme: ${theme.name} — ${theme.description}`,
    `Generate ${count} sentence exercises.`,
    '',
    'Vocabulary list:',
    formatVocab(vocabRows),
    formatExamples('GOOD EXAMPLES (mimic this style)', goodExamples),
    formatExamples('BAD EXAMPLES (avoid these patterns)', badExamples),
  ].join('\n')

  return generateSentences(SYSTEM_PROMPT, userPrompt, vocabRows)
}

async function handleItemIdsMode(itemIds: string[], count: number): Promise<NextResponse> {
  // Fetch anchor vocab rows with embeddings
  const { data: anchorData, error: anchorError } = await supabase
    .from('vocabulary_items')
    .select('id, hebrew, english, pos, gender, binyan, conjugations, root, embedding')
    .in('id', itemIds)

  if (anchorError) {
    console.error('[api/practice/sentences] anchor fetch failed:', anchorError.message)
    return NextResponse.json({ error: `DB error: ${anchorError.message}` }, { status: 500 })
  }

  const anchorRows: VocabRowWithEmbedding[] = (anchorData ?? []) as VocabRowWithEmbedding[]
  if (anchorRows.length === 0) {
    return NextResponse.json({ error: 'No vocabulary items found for the given IDs' }, { status: 422 })
  }

  // Compute centroid embedding from anchor items that have embeddings
  const embeddable = anchorRows.filter((r) => r.embedding && r.embedding.length > 0)
  let supplementalRows: VocabRow[] = []

  if (embeddable.length > 0) {
    const dim = embeddable[0].embedding!.length
    const centroid = new Array<number>(dim).fill(0)
    for (const row of embeddable) {
      for (let i = 0; i < dim; i++) centroid[i] += row.embedding![i]
    }
    for (let i = 0; i < dim; i++) centroid[i] /= embeddable.length

    // Call per-POS vector search with centroid
    const { data: supplemental, error: suppError } = await supabase.rpc('match_vocabulary_items_by_pos', {
      query_embedding: centroid,
      match_count_per_pos: SUPPLEMENTAL_PER_POS,
    })

    if (suppError) {
      console.error('[api/practice/sentences] supplemental search failed:', suppError.message)
      // Non-fatal — proceed with anchors only
    } else {
      const anchorIdSet = new Set(anchorRows.map((r) => r.id))
      supplementalRows = ((supplemental ?? []) as VocabRow[]).filter((r) => !anchorIdSet.has(r.id))
    }
  }

  const anchorVocab: VocabRow[] = anchorRows.map(({ embedding: _e, ...rest }) => rest)

  const userPrompt = [
    `Generate ${count} sentence exercises.`,
    '',
    'ANCHOR WORDS (each sentence must include at least one of these):',
    formatVocab(anchorVocab),
    ...(supplementalRows.length > 0
      ? ['', 'SUPPLEMENTAL VOCABULARY (use these to fill sentences naturally):', formatSupplementalByPos(supplementalRows)]
      : []),
  ].join('\n')

  const allVocab = [...anchorVocab, ...supplementalRows]
  return generateSentences(SYSTEM_PROMPT_ITEM_IDS, userPrompt, allVocab)
}

async function generateSentences(systemPrompt: string, userPrompt: string, validVocab: VocabRow[]): Promise<NextResponse> {
  let completion
  try {
    completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[api/practice/sentences] OpenAI error:', message)
    return NextResponse.json({ error: `OpenAI API error: ${message}` }, { status: 502 })
  }

  const raw = completion.choices[0]?.message?.content ?? '{}'
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    console.error('[api/practice/sentences] JSON parse failed, raw:', raw)
    return NextResponse.json({ error: 'Failed to parse model output' }, { status: 422 })
  }
  if (!isGenerated(parsed)) {
    console.error('[api/practice/sentences] validation failed, parsed:', parsed)
    return NextResponse.json({ error: 'Invalid sentence shape from model' }, { status: 422 })
  }

  const validIds = new Set(validVocab.map((r) => r.id))
  const sentences = parsed.sentences.map((s) => ({
    english: s.english,
    hebrew: s.hebrew,
    usedItemIds: s.usedItemIds.filter((id) => validIds.has(id)),
  }))

  return NextResponse.json({ sentences })
}
