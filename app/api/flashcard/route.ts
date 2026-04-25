import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { activeStrategy, VocabularyItem } from '@/lib/flashcard-selection'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const countParam = searchParams.get('count')
  const count = countParam !== null ? parseInt(countParam, 10) : 10

  if (isNaN(count) || count <= 0) {
    return NextResponse.json({ error: 'count must be a positive integer' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('vocabulary_items')
    .select('id, hebrew, english, audio_url, last_used_at, last_mistake_at')

  if (error) {
    console.error('[api/flashcard] GET failed:', error.message)
    return NextResponse.json({ error: `DB error: ${error.message}` }, { status: 500 })
  }

  const items: VocabularyItem[] = (data ?? []).map((row) => ({
    id: row.id,
    hebrew: row.hebrew,
    english: row.english,
    audio_url: row.audio_url ?? null,
    last_used_at: row.last_used_at ?? null,
    last_mistake_at: row.last_mistake_at ?? null,
  }))

  const selected = activeStrategy.select(items, count)
  return NextResponse.json(selected)
}

export async function POST(req: NextRequest) {
  let results: Array<{ itemId: string; mistakeMade: boolean }>
  try {
    const body = await req.json()
    if (!Array.isArray(body?.results)) {
      return NextResponse.json({ error: 'results must be an array' }, { status: 400 })
    }
    results = body.results
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (results.length === 0) {
    return NextResponse.json({ ok: true })
  }

  const now = new Date().toISOString()

  // Update all items: increment number_used, set last_used_at
  const allIds = results.map((r) => r.itemId)
  const { error: usedError } = await supabase
    .from('vocabulary_items')
    .update({ last_used_at: now })
    .in('id', allIds)

  if (usedError) {
    console.error('[api/flashcard] POST last_used_at update failed:', usedError.message)
    return NextResponse.json({ error: `DB error: ${usedError.message}` }, { status: 500 })
  }

  const { error: incError } = await supabase.rpc('increment_number_used', { item_ids: allIds })
  if (incError) {
    console.error('[api/flashcard] increment_number_used rpc failed:', incError.message)
    return NextResponse.json({ error: `DB error: ${incError.message}` }, { status: 500 })
  }

  // Update last_mistake_at only for items with mistakes
  const mistakeIds = results.filter((r) => r.mistakeMade).map((r) => r.itemId)
  if (mistakeIds.length > 0) {
    const { error: mistakeError } = await supabase
      .from('vocabulary_items')
      .update({ last_mistake_at: now })
      .in('id', mistakeIds)

    if (mistakeError) {
      console.error('[api/flashcard] POST last_mistake_at update failed:', mistakeError.message)
      return NextResponse.json({ error: `DB error: ${mistakeError.message}` }, { status: 500 })
    }
  }

  return NextResponse.json({ ok: true })
}
