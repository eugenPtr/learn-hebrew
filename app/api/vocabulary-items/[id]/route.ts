import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

function normalizeHebrew(s: string): string {
  return s.replace(/[֑-ׇ]/g, '').trim()
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  let incomingHebrew: string | undefined
  let incomingEnglish: string | undefined
  try {
    const body = await req.json()
    if (body.hebrew !== undefined) {
      if (typeof body.hebrew !== 'string') {
        return NextResponse.json({ error: 'hebrew must be a string' }, { status: 400 })
      }
      incomingHebrew = normalizeHebrew(body.hebrew)
    }
    if (body.english !== undefined) {
      if (typeof body.english !== 'string') {
        return NextResponse.json({ error: 'english must be a string' }, { status: 400 })
      }
      incomingEnglish = body.english.trim()
    }
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  // Fetch current item
  const { data: current, error: fetchError } = await supabase
    .from('vocabulary_items')
    .select('id, hebrew, english, lesson_id, audio_url')
    .eq('id', id)
    .single()

  if (fetchError || !current) {
    return NextResponse.json({ error: 'Item not found' }, { status: 404 })
  }

  const hebrewChanged =
    incomingHebrew !== undefined && normalizeHebrew(current.hebrew as string) !== incomingHebrew
  const englishToSet = incomingEnglish ?? (current.english as string)

  if (!hebrewChanged) {
    // English-only edit (or no-op)
    if (incomingEnglish !== undefined) {
      const { error } = await supabase
        .from('vocabulary_items')
        .update({ english: englishToSet })
        .eq('id', id)

      if (error) {
        console.error('[api/vocabulary-items/[id]] PATCH english failed:', error.message)
        return NextResponse.json({ error: `DB error: ${error.message}` }, { status: 500 })
      }
    }
    return NextResponse.json({ ok: true })
  }

  // Hebrew is changing — check for conflict with another item
  const { data: conflict } = await supabase
    .from('vocabulary_items')
    .select('id, lesson_id')
    .eq('hebrew', incomingHebrew)
    .neq('id', id)
    .maybeSingle()

  if (conflict) {
    // Ownership transfer: move the conflicting item to this item's lesson, delete current
    const { error: transferError } = await supabase
      .from('vocabulary_items')
      .update({ lesson_id: current.lesson_id, english: englishToSet })
      .eq('id', conflict.id)

    if (transferError) {
      console.error('[api/vocabulary-items/[id]] PATCH transfer failed:', transferError.message)
      return NextResponse.json({ error: `DB error: ${transferError.message}` }, { status: 500 })
    }

    const { error: deleteError } = await supabase
      .from('vocabulary_items')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('[api/vocabulary-items/[id]] PATCH delete-old failed:', deleteError.message)
      return NextResponse.json({ error: `DB error: ${deleteError.message}` }, { status: 500 })
    }

    return NextResponse.json({ ok: true, action: 'transferred', itemId: conflict.id })
  }

  // No conflict — update hebrew, regen TTS
  const ttsRes = await fetch(`${BASE_URL}/api/tts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: incomingHebrew }),
  })

  if (!ttsRes.ok) {
    const err = await ttsRes.text()
    console.error('[api/vocabulary-items/[id]] TTS regen failed:', err)
    return NextResponse.json({ error: `TTS generation failed: ${err}` }, { status: 502 })
  }

  const { audioUrl } = await ttsRes.json()

  const { error: updateError } = await supabase
    .from('vocabulary_items')
    .update({ hebrew: incomingHebrew, english: englishToSet, audio_url: audioUrl })
    .eq('id', id)

  if (updateError) {
    console.error('[api/vocabulary-items/[id]] PATCH update failed:', updateError.message)
    return NextResponse.json({ error: `DB error: ${updateError.message}` }, { status: 500 })
  }

  return NextResponse.json({ ok: true, action: 'updated' })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const { error, count } = await supabase
    .from('vocabulary_items')
    .delete({ count: 'exact' })
    .eq('id', id)

  if (error) {
    console.error('[api/vocabulary-items/[id]] DELETE failed:', error.message)
    return NextResponse.json({ error: `DB error: ${error.message}` }, { status: 500 })
  }

  if (count === 0) {
    return NextResponse.json({ error: 'Item not found' }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}
