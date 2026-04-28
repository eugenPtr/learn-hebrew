import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { generateTtsAudio } from '@/lib/tts'

type VocabItem = {
  hebrew: string
  english: string
  pos?: string | null
  gender?: string | null
  binyan?: string | null
  root?: string | null
  conjugations?: { present: string[] } | null
}

function normalizeHebrew(s: string): string {
  return s.replace(/[֑-ׇ]/g, '').trim()
}

function isValidItems(data: unknown): data is { title?: string | null; items: VocabItem[] } {
  if (!data || typeof data !== 'object') return false
  const obj = data as Record<string, unknown>
  if (!Array.isArray(obj.items)) return false
  if ('title' in obj && obj.title !== null && typeof obj.title !== 'string') return false
  return obj.items.every(
    (item) =>
      item &&
      typeof item === 'object' &&
      typeof (item as Record<string, unknown>).hebrew === 'string' &&
      typeof (item as Record<string, unknown>).english === 'string'
  )
}

export async function GET() {
  const { data, error } = await supabase
    .from('lessons')
    .select('id, title, created_at, vocabulary_items(id)')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[api/lessons] GET failed:', error.message)
    return NextResponse.json({ error: `DB error: ${error.message}` }, { status: 500 })
  }

  const lessons = (data ?? []).map((lesson) => ({
    id: lesson.id as string,
    title: (lesson.title as string | null) ?? null,
    created_at: lesson.created_at as string,
    word_count: Array.isArray(lesson.vocabulary_items) ? lesson.vocabulary_items.length : 0,
  }))

  return NextResponse.json(lessons)
}

export async function POST(req: NextRequest) {
  let items: VocabItem[]
  let title: string | null = null
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
    title = (body.title as string | null | undefined) ?? null
  } catch {
    console.error('[api/lessons] failed to parse request body')
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  // Deduplicate within the incoming batch by hebrew (last occurrence wins)
  const seen = new Map<string, VocabItem>()
  for (const item of items) seen.set(normalizeHebrew(item.hebrew), item)
  items = [...seen.values()]

  // Fetch all existing vocabulary items to check for conflicts
  const { data: existingRows, error: fetchError } = await supabase
    .from('vocabulary_items')
    .select('id, hebrew, lesson_id')

  if (fetchError) {
    console.error('[api/lessons] failed to fetch existing vocabulary_items:', fetchError.message)
    return NextResponse.json(
      { error: `Failed to fetch existing vocabulary: ${fetchError.message}` },
      { status: 500 }
    )
  }

  const existingByHebrew = new Map(
    (existingRows ?? []).map((row) => [normalizeHebrew(row.hebrew as string), row as { id: string; hebrew: string; lesson_id: string }])
  )

  // Create new lesson row first
  const { data: lessonRows, error: lessonError } = await supabase
    .from('lessons')
    .insert({ title: title || null })
    .select('id')

  if (lessonError || !lessonRows || lessonRows.length === 0) {
    const msg = lessonError?.message ?? 'No row returned'
    console.error('[api/lessons] failed to insert lesson row:', msg)
    return NextResponse.json({ error: `Failed to create lesson: ${msg}` }, { status: 500 })
  }

  const lessonId: string = lessonRows[0].id

  const newItems: VocabItem[] = []
  const transferItems: VocabItem[] = []

  for (const item of items) {
    const key = normalizeHebrew(item.hebrew)
    const existing = existingByHebrew.get(key)
    if (existing) {
      transferItems.push(item)
    } else {
      newItems.push(item)
    }
  }

  // Transfer ownership of existing items to new lesson
  if (transferItems.length > 0) {
    for (const item of transferItems) {
      const key = normalizeHebrew(item.hebrew)
      const existing = existingByHebrew.get(key)!
      const { error: transferError } = await supabase
        .from('vocabulary_items')
        .update({ lesson_id: lessonId, english: item.english })
        .eq('id', existing.id)

      if (transferError) {
        console.error('[api/lessons] failed to transfer vocab item:', transferError.message)
        return NextResponse.json(
          { error: `Failed to transfer vocabulary item: ${transferError.message}` },
          { status: 500 }
        )
      }
    }
  }

  // Insert net-new vocabulary items with TTS audio
  if (newItems.length > 0) {
    const audioUrls: string[] = []
    for (const item of newItems) {
      try {
        const audioUrl = await generateTtsAudio(normalizeHebrew(item.hebrew))
        audioUrls.push(audioUrl)
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        console.error('[api/lessons] TTS failed for item:', item.hebrew, message)
        return NextResponse.json({ error: `TTS generation failed: ${message}` }, { status: 502 })
      }
    }

    const vocabPayload = newItems.map((item, i) => ({
      lesson_id: lessonId,
      hebrew: normalizeHebrew(item.hebrew),
      english: item.english,
      audio_url: audioUrls[i],
      pos: item.pos ?? null,
      gender: item.gender ?? null,
      binyan: item.binyan ?? null,
      root: item.root ?? null,
      conjugations: item.conjugations ?? null,
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

  console.log(
    `[api/lessons] lesson ${lessonId} created — inserted: ${newItems.length}, transferred: ${transferItems.length}, skipped: 0`
  )
  return NextResponse.json({
    lessonId,
    inserted: newItems.length,
    transferred: transferItems.length,
    skipped: 0,
  })
}
