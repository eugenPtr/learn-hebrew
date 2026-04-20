import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { supabase } from '@/lib/supabase'
import {
  selectItems,
  buildExercisePrompt,
  VocabularyItem,
  ExercisePair,
} from '@/lib/session-builder'

export const maxDuration = 60

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

type ExerciseType = 'reading' | 'listening' | 'translating'

type Exercise = {
  type: ExerciseType
  focusWordId: string
  hebrewSentence: string
  englishSentence: string
  wordsUsed: { itemId: string; usedForm: string }[]
  audioUrl: string
}

// --- Task 1.1 / 1.2: GET handler with param parsing ---

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const lessonIdParam = searchParams.get('lessonId') ?? null
  const wordCountParam = searchParams.get('wordCount')
  const wordCount = wordCountParam ? parseInt(wordCountParam, 10) : 10

  if (wordCountParam && (isNaN(wordCount) || wordCount < 1)) {
    return NextResponse.json({ error: 'Invalid wordCount parameter' }, { status: 400 })
  }

  // --- Task 2.1: Query all vocabulary_items joined with lessons ---

  const { data: vocabRows, error: vocabError } = await supabase
    .from('vocabulary_items')
    .select('id, lesson_id, hebrew, english, number_used, mistakes, last_used_at, last_mistake_at, created_at')

  if (vocabError) {
    console.error('[api/session] failed to fetch vocabulary_items:', vocabError.message)
    return NextResponse.json({ error: `DB error: ${vocabError.message}` }, { status: 500 })
  }

  const { data: lessonRows, error: lessonsError } = await supabase
    .from('lessons')
    .select('id, created_at')
    .order('created_at', { ascending: false })

  if (lessonsError || !lessonRows || lessonRows.length === 0) {
    const msg = lessonsError?.message ?? 'No lessons found'
    console.error('[api/session] failed to fetch lessons:', msg)
    return NextResponse.json({ error: `DB error: ${msg}` }, { status: 500 })
  }

  // --- Task 2.2: Validate provided lessonId ---

  let focusedLessonId: string

  if (lessonIdParam) {
    const exists = lessonRows.some((l: { id: string }) => l.id === lessonIdParam)
    if (!exists) {
      console.error('[api/session] lessonId not found:', lessonIdParam)
      return NextResponse.json({ error: `Lesson not found: ${lessonIdParam}` }, { status: 400 })
    }
    focusedLessonId = lessonIdParam
  } else {
    // --- Task 2.3: Fall back to most recently created lesson ---
    focusedLessonId = lessonRows[0].id
  }

  console.log('[api/session] focusedLessonId:', focusedLessonId, '| wordCount:', wordCount)

  const allItems: VocabularyItem[] = (vocabRows ?? []).map((row: {
    id: string
    lesson_id: string
    hebrew: string
    english: string
    number_used: number
    mistakes: number
    last_used_at: string | null
    last_mistake_at: string | null
    created_at: string
  }) => ({
    id: row.id,
    lessonId: row.lesson_id,
    hebrew: row.hebrew,
    english: row.english,
    numberUsed: row.number_used,
    mistakes: row.mistakes,
    lastUsedAt: row.last_used_at,
    lastMistakeAt: row.last_mistake_at,
    createdAt: row.created_at,
  }))

  // --- Task 3.1: Select items ---

  const { focusedWords, otherWords } = selectItems(allItems, focusedLessonId, wordCount)

  if (focusedWords.length === 0) {
    return NextResponse.json({ error: 'No vocabulary items found for this lesson' }, { status: 400 })
  }

  // --- Task 3.2: Build prompt and call GPT-4o ---

  const prompt = buildExercisePrompt(focusedWords, otherWords)
  console.log('[api/session] sending prompt to GPT-4o for', focusedWords.length, 'words')

  let llmContent: string
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    })
    llmContent = completion.choices[0]?.message?.content ?? ''
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[api/session] GPT-4o error:', message)
    return NextResponse.json({ error: `LLM error: ${message}` }, { status: 502 })
  }

  // --- Task 3.3: Strip markdown fences and parse ExercisePair[] ---

  const stripped = llmContent.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
  let pairs: ExercisePair[]
  try {
    pairs = JSON.parse(stripped)
  } catch {
    console.error('[api/session] failed to parse LLM response:', llmContent)
    return NextResponse.json({ error: 'Failed to parse LLM response as JSON' }, { status: 502 })
  }

  console.log('[api/session] parsed', pairs.length, 'exercise pairs from LLM')

  // --- Task 4.1: Expand each pair into 3 exercise types (each with its own sentence) ---

  const expanded: Omit<Exercise, 'audioUrl'>[] = pairs.flatMap((pair) => [
    { type: 'reading'     as const, focusWordId: pair.focusWordId, ...pair.reading },
    { type: 'listening'   as const, focusWordId: pair.focusWordId, ...pair.listening },
    { type: 'translating' as const, focusWordId: pair.focusWordId, ...pair.translating },
  ])

  // --- Task 4.2: Shuffle — no two consecutive same type or focusWordId ---

  function shuffle<T>(arr: T[]): T[] {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
  }

  // Group by type, shuffle within each group, then interleave round-robin
  const byType: Record<ExerciseType, Omit<Exercise, 'audioUrl'>[]> = {
    reading: shuffle(expanded.filter((e) => e.type === 'reading')),
    listening: shuffle(expanded.filter((e) => e.type === 'listening')),
    translating: shuffle(expanded.filter((e) => e.type === 'translating')),
  }

  const interleaved: Omit<Exercise, 'audioUrl'>[] = []
  const rotation: ExerciseType[] = ['reading', 'listening', 'translating']
  let ri = 0
  while (interleaved.length < expanded.length) {
    const type = rotation[ri % rotation.length]
    const bucket = byType[type]
    if (bucket.length > 0) {
      const candidate = bucket.shift()!
      // Avoid consecutive same focusWordId — defer to end if conflict
      const prev = interleaved[interleaved.length - 1]
      if (prev && prev.focusWordId === candidate.focusWordId && bucket.length > 0) {
        const next = bucket.shift()!
        interleaved.push(next)
        bucket.unshift(candidate) // put back for later
      } else {
        interleaved.push(candidate)
      }
    }
    ri++
    // Safety: if all buckets are empty, break
    if (byType.reading.length === 0 && byType.listening.length === 0 && byType.translating.length === 0) break
  }

  // --- Task 4.3: Call /api/tts sequentially for each exercise ---

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? `http://localhost:${process.env.PORT ?? 3000}`
  const exercises: Exercise[] = []

  for (const exercise of interleaved) {
    let audioUrl: string
    try {
      const ttsRes = await fetch(`${baseUrl}/api/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: exercise.hebrewSentence }),
      })
      if (!ttsRes.ok) {
        const err = await ttsRes.text()
        throw new Error(`TTS returned ${ttsRes.status}: ${err}`)
      }
      const ttsData = await ttsRes.json()
      audioUrl = ttsData.audioUrl
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error('[api/session] TTS error for sentence:', exercise.hebrewSentence, message)
      return NextResponse.json({ error: `TTS error: ${message}` }, { status: 502 })
    }
    exercises.push({ ...exercise, audioUrl })
  }

  // --- Task 5.1: Return complete Exercise[] ---

  console.log('[api/session] returning', exercises.length, 'exercises')
  return NextResponse.json(exercises)
}
