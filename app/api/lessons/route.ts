import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

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

  // Task 3.2 — Insert net-new vocabulary items if any remain
  if (newItems.length > 0) {
    const vocabPayload = newItems.map((item) => ({
      lesson_id: lessonId,
      hebrew: item.hebrew.trim(),
      english: item.english,
    }))

    const { error: vocabError } = await supabase.from('vocabulary_items').insert(vocabPayload)

    // Task 4.2 — Catch vocab insert failure without leaving response hanging
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
