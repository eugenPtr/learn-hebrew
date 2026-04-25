import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

type VocabItem = { hebrew: string; english: string }

function isValidItems(data: unknown): data is { items: VocabItem[] } {
  if (!data || typeof data !== 'object') return false
  const obj = data as Record<string, unknown>
  if (!Array.isArray(obj.items)) return false
  return obj.items.every(
    (item) =>
      item &&
      typeof item === 'object' &&
      typeof (item as Record<string, unknown>).hebrew === 'string' &&
      typeof (item as Record<string, unknown>).english === 'string'
  )
}

export async function POST(req: NextRequest) {
  // Task 1.2 — Parse and validate request body
  let items: VocabItem[]
  try {
    const body = await req.json()
    if (!isValidItems(body)) {
      console.error('[api/lessons] invalid request body — items missing or malformed')
      return NextResponse.json(
        { error: 'Invalid request body: items must be an array of { hebrew, english }' },
        { status: 400 }
      )
    }
    items = body.items
  } catch {
    console.error('[api/lessons] failed to parse request body')
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  // Deduplicate within the incoming batch by hebrew (last occurrence wins)
  const seen = new Map<string, VocabItem>()
  for (const item of items) seen.set(item.hebrew.trim(), item)
  items = [...seen.values()]

  // Task 2.1 — Fetch all existing hebrew values in a single query
  const { data: existingRows, error: fetchError } = await supabase
    .from('vocabulary_items')
    .select('hebrew')

  if (fetchError) {
    console.error('[api/lessons] failed to fetch existing vocabulary_items:', fetchError.message)
    return NextResponse.json(
      { error: `Failed to fetch existing vocabulary: ${fetchError.message}` },
      { status: 500 }
    )
  }

  // Task 2.2 — Filter incoming items against existing set (exact match, trimmed)
  const existingHebrew = new Set(
    (existingRows ?? []).map((row: { hebrew: string }) => row.hebrew.trim())
  )

  const newItems = items.filter((item) => !existingHebrew.has(item.hebrew.trim()))
  // Task 2.3 — Track skipped count
  const skipped = items.length - newItems.length

  // Task 3.1 — Insert new lessons row and capture its id
  const { data: lessonRows, error: lessonError } = await supabase
    .from('lessons')
    .insert({})
    .select('id')

  if (lessonError || !lessonRows || lessonRows.length === 0) {
    const msg = lessonError?.message ?? 'No row returned'
    console.error('[api/lessons] failed to insert lesson row:', msg)
    return NextResponse.json({ error: `Failed to create lesson: ${msg}` }, { status: 500 })
  }

  const lessonId: string = lessonRows[0].id

  // Insert net-new vocabulary items with TTS audio
  if (newItems.length > 0) {
    // Generate TTS for each new item before inserting
    const audioUrls: string[] = []
    for (const item of newItems) {
      const ttsRes = await fetch(`${BASE_URL}/api/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: item.hebrew.trim() }),
      })
      if (!ttsRes.ok) {
        const err = await ttsRes.text()
        console.error('[api/lessons] TTS failed for item:', item.hebrew, err)
        return NextResponse.json({ error: `TTS generation failed: ${err}` }, { status: 502 })
      }
      const ttsData = await ttsRes.json()
      audioUrls.push(ttsData.audioUrl)
    }

    const vocabPayload = newItems.map((item, i) => ({
      lesson_id: lessonId,
      hebrew: item.hebrew.trim(),
      english: item.english,
      audio_url: audioUrls[i],
    }))

    const { error: vocabError } = await supabase.from('vocabulary_items').insert(vocabPayload)

    if (vocabError) {
      console.error('[api/lessons] failed to insert vocabulary_items:', vocabError.message)
      return NextResponse.json(
        { error: `Failed to insert vocabulary items: ${vocabError.message}` },
        { status: 500 }
      )
    }
  }

  // Task 3.3 — Return success response
  console.log(
    `[api/lessons] lesson ${lessonId} created — inserted: ${newItems.length}, skipped: ${skipped}`
  )
  return NextResponse.json({ lessonId, inserted: newItems.length, skipped })
}
