import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

function normalizeHebrew(s: string): string {
  return s.replace(/[֑-ׇ]/g, '').trim()
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

  // Check if this Hebrew already exists
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

  // New word — generate TTS then insert
  const ttsRes = await fetch(`${BASE_URL}/api/tts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: hebrew }),
  })

  if (!ttsRes.ok) {
    const err = await ttsRes.text()
    console.error('[api/lessons/[id]/words] TTS failed:', err)
    return NextResponse.json({ error: `TTS generation failed: ${err}` }, { status: 502 })
  }

  const { audioUrl } = await ttsRes.json()

  const { data: inserted, error: insertError } = await supabase
    .from('vocabulary_items')
    .insert({ lesson_id: lessonId, hebrew, english, audio_url: audioUrl })
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
