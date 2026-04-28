import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { supabase } from '@/lib/supabase'
import { embedText } from '@/lib/embeddings'
import { normalizeHebrew, PRONOUN_ORDER } from '@/lib/hebrew'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const POS_VALUES = [
  'noun', 'verb', 'adjective', 'adverb',
  'preposition', 'conjunction', 'pronoun', 'phrase', 'other',
] as const
type Pos = (typeof POS_VALUES)[number]

const GENDER_VALUES = ['masculine', 'feminine'] as const
type Gender = (typeof GENDER_VALUES)[number]

const BINYAN_VALUES = [
  'paal', 'nifal', 'piel', 'pual', 'hitpael', 'hifil', 'hufal',
] as const
type Binyan = (typeof BINYAN_VALUES)[number]

type Tagging = {
  pos: Pos
  gender: Gender | null
  binyan: Binyan | null
  root: string | null
  hebrew_infinitive: string | null
  conjugations: { present: string[] } | null
}

const TAG_SYSTEM_PROMPT = `You are a Hebrew linguist. For the given Hebrew word or phrase and its English gloss, return a JSON object with grammatical metadata.

Return ONLY a JSON object in this exact format:
{
  "pos": "noun" | "verb" | "adjective" | "adverb" | "preposition" | "conjunction" | "pronoun" | "phrase" | "other",
  "gender": "masculine" | "feminine" | null,
  "binyan": "paal" | "nifal" | "piel" | "pual" | "hitpael" | "hifil" | "hufal" | null,
  "root": "<Hebrew root letters, no niqqud, e.g. כתב>" | null,
  "hebrew_infinitive": "<infinitive form if input is a conjugated verb, otherwise null>",
  "conjugations": { "present": ["...", "...", "...", "...", "...", "...", "...", "...", "..."] } | null
}

Rules:
- "pos": always required. Use "phrase" for multi-word idioms, greetings, exclamations.
- "gender": set ONLY when pos is "noun" (masculine or feminine). null otherwise.
- "binyan": set ONLY when pos is "verb". null otherwise.
- "root": set for verbs and nouns (the Semitic root letters, e.g. "כתב" for כותב). null for phrases, conjunctions, adverbs, etc.
- "hebrew_infinitive": For verbs, ALWAYS provide the canonical infinitive form in Hebrew letters (e.g. "ללכת", "לכתוב"). For irregular verbs where the infinitive equals the base form (e.g. יכול), return that form. null for non-verbs.
- "conjugations.present": MANDATORY for all verbs — a 9-element array in fixed pronoun order [ani, ata, at, hoo, hee, anahnoo, atem, hem, hen]. Each element must be ONLY the conjugated verb form in Hebrew letters, WITHOUT the pronoun and WITHOUT any Latin/phonetic text. No niqqud. Example for לכתוב: ["כותב","כותב","כותבת","כותב","כותבת","כותבים","כותבים","כותבים","כותבות"]. CRITICAL: if pos is "verb", conjugations must never be null. null ONLY for non-verbs.
- All Hebrew text in the response must be in Hebrew letters without niqqud (no vowel points). Never use Latin transliteration.
- If you cannot confidently classify the word, set pos to "other" and all other fields to null.`

function isTagging(data: unknown): data is Tagging {
  if (!data || typeof data !== 'object') return false
  const obj = data as Record<string, unknown>
  if (!POS_VALUES.includes(obj.pos as Pos)) return false
  if (obj.gender !== null && !GENDER_VALUES.includes(obj.gender as Gender)) return false
  if (obj.binyan !== null && !BINYAN_VALUES.includes(obj.binyan as Binyan)) return false
  if (obj.root !== null && typeof obj.root !== 'string') return false
  if (obj.hebrew_infinitive !== null && typeof obj.hebrew_infinitive !== 'string') return false
  if (obj.conjugations !== null) {
    const c = obj.conjugations as Record<string, unknown>
    if (!Array.isArray(c.present) || c.present.length !== PRONOUN_ORDER.length) return false
    if (!c.present.every((v) => typeof v === 'string')) return false
  }
  return true
}

async function callTag(hebrew: string, english: string): Promise<Tagging | null> {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: TAG_SYSTEM_PROMPT },
      { role: 'user', content: `Hebrew: ${hebrew}\nEnglish: ${english}` },
    ],
  })
  const raw = completion.choices[0]?.message?.content ?? '{}'
  const parsed = JSON.parse(raw)
  if (!isTagging(parsed)) {
    console.error('[api/lessons/[id]/words] tagging validation failed, raw:', raw)
    return null
  }
  return parsed
}

async function tagWord(hebrew: string, english: string): Promise<Tagging> {
  const fallback: Tagging = {
    pos: 'other', gender: null, binyan: null, root: null, hebrew_infinitive: null, conjugations: null,
  }

  const tagging = await callTag(hebrew, english)
  if (!tagging) return fallback

  // Retry once if it's a verb missing conjugations
  if (tagging.pos === 'verb' && !tagging.conjugations) {
    const retry = await callTag(hebrew, english)
    if (retry?.conjugations) return retry
  }

  return tagging
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: lessonId } = await params

  let hebrew: string, english: string
  try {
    const body = await req.json()
    if (typeof body?.hebrew !== 'string' || typeof body?.english !== 'string') {
      return NextResponse.json(
        { error: 'hebrew and english must be strings' },
        { status: 400 }
      )
    }
    hebrew = normalizeHebrew(body.hebrew)
    english = body.english.trim()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!hebrew || !english) {
    return NextResponse.json({ error: 'hebrew and english must be non-empty' }, { status: 400 })
  }

  // Check lesson exists
  const { data: lesson, error: lessonError } = await supabase
    .from('lessons')
    .select('id')
    .eq('id', lessonId)
    .single()

  if (lessonError || !lesson) {
    return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
  }

  // Tag with LLM. If the LLM returns an infinitive, that becomes the canonical hebrew form.
  let tagging: Tagging
  try {
    tagging = await tagWord(hebrew, english)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[api/lessons/[id]/words] tagging failed:', message)
    return NextResponse.json({ error: `Tagging failed: ${message}` }, { status: 502 })
  }

  if (tagging.hebrew_infinitive) {
    hebrew = normalizeHebrew(tagging.hebrew_infinitive)
  }

  // Check if this Hebrew already exists (post-infinitive normalization)
  const { data: existing } = await supabase
    .from('vocabulary_items')
    .select('id, lesson_id')
    .eq('hebrew', hebrew)
    .maybeSingle()

  if (existing) {
    if (existing.lesson_id === lessonId) {
      return NextResponse.json({ ok: true, action: 'no-op', itemId: existing.id })
    }

    // Transfer ownership to this lesson
    const { error: transferError } = await supabase
      .from('vocabulary_items')
      .update({ lesson_id: lessonId, english })
      .eq('id', existing.id)

    if (transferError) {
      console.error('[api/lessons/[id]/words] transfer failed:', transferError.message)
      return NextResponse.json({ error: `DB error: ${transferError.message}` }, { status: 500 })
    }

    return NextResponse.json({ ok: true, action: 'transferred', itemId: existing.id })
  }

  // New word — generate TTS + embedding in parallel
  let audioUrl: string
  let embedding: number[]
  try {
    const [ttsRes, emb] = await Promise.all([
      fetch(`${BASE_URL}/api/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: hebrew }),
      }),
      embedText(english),
    ])

    if (!ttsRes.ok) {
      const err = await ttsRes.text()
      console.error('[api/lessons/[id]/words] TTS failed:', err)
      return NextResponse.json({ error: `TTS generation failed: ${err}` }, { status: 502 })
    }

    audioUrl = (await ttsRes.json()).audioUrl
    embedding = emb
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[api/lessons/[id]/words] TTS/embed failed:', message)
    return NextResponse.json({ error: `TTS/embed failed: ${message}` }, { status: 502 })
  }

  const { data: inserted, error: insertError } = await supabase
    .from('vocabulary_items')
    .insert({
      lesson_id: lessonId,
      hebrew,
      english,
      audio_url: audioUrl,
      pos: tagging.pos,
      gender: tagging.gender,
      binyan: tagging.binyan,
      root: tagging.root,
      conjugations: tagging.conjugations,
      embedding: embedding as unknown as string,
    })
    .select('id')
    .single()

  if (insertError || !inserted) {
    console.error('[api/lessons/[id]/words] insert failed:', insertError?.message)
    return NextResponse.json(
      { error: `Failed to insert word: ${insertError?.message}` },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true, action: 'inserted', itemId: inserted.id })
}
