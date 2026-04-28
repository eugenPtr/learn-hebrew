import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { supabase } from '@/lib/supabase'

export const maxDuration = 30

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const DEFAULT_COUNT = 5
const MAX_COUNT = 10
const TOP_VOCAB = 20
const RECENT_FEEDBACK = 10

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

export async function POST(req: NextRequest) {
  let themeId: string
  let count: number
  try {
    const body = await req.json()
    if (typeof body?.themeId !== 'string') {
      return NextResponse.json({ error: 'themeId must be a string' }, { status: 400 })
    }
    themeId = body.themeId
    count = typeof body.count === 'number' ? Math.min(MAX_COUNT, Math.max(1, body.count)) : DEFAULT_COUNT
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

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

  let completion
  try {
    completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
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

  // Filter usedItemIds to only those that were in the vocab list (defensive)
  const validIds = new Set(vocabRows.map((r) => r.id))
  const sentences = parsed.sentences.map((s) => ({
    english: s.english,
    hebrew: s.hebrew,
    usedItemIds: s.usedItemIds.filter((id) => validIds.has(id)),
  }))

  return NextResponse.json({ sentences })
}
