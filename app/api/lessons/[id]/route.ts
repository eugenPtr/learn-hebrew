import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const { data: lesson, error } = await supabase
    .from('lessons')
    .select('id, title, created_at, vocabulary_items(id, hebrew, english, audio_url)')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
    }
    console.error('[api/lessons/[id]] GET failed:', error.message)
    return NextResponse.json({ error: `DB error: ${error.message}` }, { status: 500 })
  }

  return NextResponse.json(lesson)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  let title: string | null
  try {
    const body = await req.json()
    if (!('title' in body)) {
      return NextResponse.json({ error: 'title field is required' }, { status: 400 })
    }
    title = typeof body.title === 'string' && body.title.trim() !== '' ? body.title.trim() : null
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { data: updated, error } = await supabase
    .from('lessons')
    .update({ title })
    .eq('id', id)
    .select('id')

  if (error) {
    console.error('[api/lessons/[id]] PATCH failed:', error.message)
    return NextResponse.json({ error: `DB error: ${error.message}` }, { status: 500 })
  }

  if (!updated || updated.length === 0) {
    return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}
