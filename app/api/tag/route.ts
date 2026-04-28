import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { normalizeHebrew, PRONOUN_ORDER } from '@/lib/hebrew'
import { POS_VALUES, GENDER_VALUES, BINYAN_VALUES } from '@/lib/wordTypes'
import type { Pos, Gender, Binyan } from '@/lib/wordTypes'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

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
- "conjugations.present": ONLY for verbs — a 9-element array in fixed pronoun order [ani, ata, at, hoo, hee, anahnoo, atem, hem, hen]. Each element must be ONLY the conjugated verb form in Hebrew letters, WITHOUT the pronoun and WITHOUT any Latin/phonetic text. No niqqud. Example for לכתוב: ["כותב","כותב","כותבת","כותב","כותבת","כותבים","כותבים","כותבים","כותבות"]. null for non-verbs.
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

export async function POST(req: NextRequest) {
  let hebrew: string, english: string
  try {
    const body = await req.json()
    if (typeof body?.hebrew !== 'string' || typeof body?.english !== 'string') {
      return NextResponse.json({ error: 'hebrew and english must be strings' }, { status: 400 })
    }
    hebrew = normalizeHebrew(body.hebrew)
    english = body.english.trim()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

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
    return NextResponse.json({
      pos: 'other', gender: null, binyan: null, root: null, conjugations: null, hebrew,
    })
  }

  const canonical = parsed.hebrew_infinitive ? normalizeHebrew(parsed.hebrew_infinitive) : hebrew

  return NextResponse.json({
    hebrew: canonical,
    pos: parsed.pos,
    gender: parsed.gender,
    binyan: parsed.binyan,
    root: parsed.root,
    conjugations: parsed.conjugations,
  })
}
