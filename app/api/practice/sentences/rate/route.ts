import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const RATING_VALUES = ['up', 'down'] as const
type Rating = (typeof RATING_VALUES)[number]

export async function POST(req: NextRequest) {
  let english: string
  let hebrew: string
  let itemIds: string[]
  let themeId: string | null
  let rating: Rating
  let feedback: string | null

  try {
    const body = await req.json()
    if (typeof body?.english !== 'string' || typeof body?.hebrew !== 'string') {
      return NextResponse.json({ error: 'english and hebrew must be strings' }, { status: 400 })
    }
    if (!Array.isArray(body?.itemIds) || !body.itemIds.every((v: unknown) => typeof v === 'string')) {
      return NextResponse.json({ error: 'itemIds must be a string array' }, { status: 400 })
    }
    if (body?.themeId !== null && typeof body?.themeId !== 'string') {
      return NextResponse.json({ error: 'themeId must be a string or null' }, { status: 400 })
    }
    if (!RATING_VALUES.includes(body?.rating)) {
      return NextResponse.json({ error: "rating must be 'up' or 'down'" }, { status: 400 })
    }
    if (body?.feedback !== undefined && body.feedback !== null && typeof body.feedback !== 'string') {
      return NextResponse.json({ error: 'feedback must be a string or null' }, { status: 400 })
    }

    english = body.english.trim()
    hebrew = body.hebrew.trim()
    itemIds = body.itemIds
    themeId = body.themeId
    rating = body.rating
    feedback = body.feedback ? String(body.feedback).trim() || null : null
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!english || !hebrew) {
    return NextResponse.json({ error: 'english and hebrew must be non-empty' }, { status: 400 })
  }

  const { data: inserted, error } = await supabase
    .from('generated_sentences')
    .insert({
      english,
      hebrew,
      item_ids: itemIds,
      theme_id: themeId,
      rating,
      feedback,
    })
    .select('id')
    .single()

  if (error || !inserted) {
    console.error('[api/practice/sentences/rate] insert failed:', error?.message)
    return NextResponse.json(
      { error: `DB error: ${error?.message}` },
      { status: 500 }
    )
  }

  return NextResponse.json({ id: inserted.id })
}
