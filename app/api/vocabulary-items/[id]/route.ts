import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { embedText } from '@/lib/embeddings'
import { normalizeHebrew } from '@/lib/hebrew'
import { generateTtsAudio } from '@/lib/tts'

const POS_VALUES = [
  'noun', 'verb', 'adjective', 'adverb',
  'preposition', 'conjunction', 'pronoun', 'phrase', 'other',
] as const
type Pos = (typeof POS_VALUES)[number]

const GENDER_VALUES = ['masculine', 'feminine'] as const
type Gender = (typeof GENDER_VALUES)[number]

const BINYAN_VALUES = [
  'paal', 'nifal', 'piel', 'pual', 'hitpael', 'hifil', 'hufal',
] as const
type Binyan = (typeof BINYAN_VALUES)[number]

type Patch = {
  hebrew?: string
  english?: string
  pos?: Pos | null
  gender?: Gender | null
  binyan?: Binyan | null
  root?: string | null
  conjugations?: { present: string[] } | null
}

function parsePatch(body: unknown): { patch: Patch } | { error: string } {
  if (!body || typeof body !== 'object') return { error: 'Invalid request body' }
  const b = body as Record<string, unknown>
  const patch: Patch = {}

  if (b.hebrew !== undefined) {
    if (typeof b.hebrew !== 'string') return { error: 'hebrew must be a string' }
    patch.hebrew = normalizeHebrew(b.hebrew)
  }
  if (b.english !== undefined) {
    if (typeof b.english !== 'string') return { error: 'english must be a string' }
    patch.english = b.english.trim()
  }
  if (b.pos !== undefined) {
    if (b.pos !== null && !POS_VALUES.includes(b.pos as Pos)) {
      return { error: `pos must be one of: ${POS_VALUES.join(', ')}` }
    }
    patch.pos = b.pos as Pos | null
  }
  if (b.gender !== undefined) {
    if (b.gender !== null && !GENDER_VALUES.includes(b.gender as Gender)) {
      return { error: `gender must be one of: ${GENDER_VALUES.join(', ')}` }
    }
    patch.gender = b.gender as Gender | null
  }
  if (b.binyan !== undefined) {
    if (b.binyan !== null && !BINYAN_VALUES.includes(b.binyan as Binyan)) {
      return { error: `binyan must be one of: ${BINYAN_VALUES.join(', ')}` }
    }
    patch.binyan = b.binyan as Binyan | null
  }
  if (b.root !== undefined) {
    if (b.root !== null && typeof b.root !== 'string') return { error: 'root must be a string or null' }
    patch.root = b.root as string | null
  }
  if (b.conjugations !== undefined) {
    if (b.conjugations !== null) {
      const c = b.conjugations as Record<string, unknown>
      if (!Array.isArray(c?.present) || !c.present.every((v) => typeof v === 'string')) {
        return { error: 'conjugations must be { present: string[] } or null' }
      }
    }
    patch.conjugations = b.conjugations as { present: string[] } | null
  }

  return { patch }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  let parsed: { patch: Patch } | { error: string }
  try {
    parsed = parsePatch(await req.json())
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
  if ('error' in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 })
  }
  const { patch } = parsed

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
    patch.hebrew !== undefined && normalizeHebrew(current.hebrew as string) !== patch.hebrew
  const englishChanged =
    patch.english !== undefined && (current.english as string) !== patch.english
  const englishToSet = patch.english ?? (current.english as string)

  // Common metadata updates (pos / gender / binyan)
  const metaUpdate: Record<string, unknown> = {}
  if (patch.pos !== undefined) metaUpdate.pos = patch.pos
  if (patch.gender !== undefined) metaUpdate.gender = patch.gender
  if (patch.binyan !== undefined) metaUpdate.binyan = patch.binyan
  if (patch.root !== undefined) metaUpdate.root = patch.root
  if (patch.conjugations !== undefined) metaUpdate.conjugations = patch.conjugations

  if (!hebrewChanged) {
    // No hebrew change — apply english + metadata in one update; re-embed if english changed
    const update: Record<string, unknown> = { ...metaUpdate }
    if (patch.english !== undefined) update.english = englishToSet

    if (englishChanged) {
      try {
        update.embedding = (await embedText(englishToSet)) as unknown as string
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        console.error('[api/vocabulary-items/[id]] embed failed:', message)
        return NextResponse.json({ error: `Embedding failed: ${message}` }, { status: 502 })
      }
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ ok: true })
    }

    const { error } = await supabase
      .from('vocabulary_items')
      .update(update)
      .eq('id', id)

    if (error) {
      console.error('[api/vocabulary-items/[id]] PATCH update failed:', error.message)
      return NextResponse.json({ error: `DB error: ${error.message}` }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  }

  // Hebrew is changing — check for conflict with another item
  const { data: conflict } = await supabase
    .from('vocabulary_items')
    .select('id, lesson_id')
    .eq('hebrew', patch.hebrew)
    .neq('id', id)
    .maybeSingle()

  if (conflict) {
    // Ownership transfer: move the conflicting item to this item's lesson, delete current
    const transferUpdate: Record<string, unknown> = {
      lesson_id: current.lesson_id,
      english: englishToSet,
      ...metaUpdate,
    }
    if (englishChanged) {
      try {
        transferUpdate.embedding = (await embedText(englishToSet)) as unknown as string
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        console.error('[api/vocabulary-items/[id]] embed failed:', message)
        return NextResponse.json({ error: `Embedding failed: ${message}` }, { status: 502 })
      }
    }

    const { error: transferError } = await supabase
      .from('vocabulary_items')
      .update(transferUpdate)
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

  // No conflict — update hebrew, regen TTS, re-embed if english changed
  let audioUrl: string
  try {
    audioUrl = await generateTtsAudio(patch.hebrew!)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[api/vocabulary-items/[id]] TTS regen failed:', message)
    return NextResponse.json({ error: `TTS generation failed: ${message}` }, { status: 502 })
  }

  const update: Record<string, unknown> = {
    hebrew: patch.hebrew,
    english: englishToSet,
    audio_url: audioUrl,
    ...metaUpdate,
  }
  if (englishChanged) {
    try {
      update.embedding = (await embedText(englishToSet)) as unknown as string
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error('[api/vocabulary-items/[id]] embed failed:', message)
      return NextResponse.json({ error: `Embedding failed: ${message}` }, { status: 502 })
    }
  }

  const { error: updateError } = await supabase
    .from('vocabulary_items')
    .update(update)
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
