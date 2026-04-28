import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { embedText } from '@/lib/embeddings'

export async function GET() {
  const { data, error } = await supabase
    .from('themes')
    .select('id, name, description, created_at')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[api/themes] GET failed:', error.message)
    return NextResponse.json({ error: `DB error: ${error.message}` }, { status: 500 })
  }

  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  let name: string, description: string
  try {
    const body = await req.json()
    if (typeof body?.name !== 'string') {
      return NextResponse.json({ error: 'name must be a string' }, { status: 400 })
    }
    name = body.name.trim()
    if (!name) {
      return NextResponse.json({ error: 'name must not be empty' }, { status: 400 })
    }
    if (body.description !== undefined && typeof body.description !== 'string') {
      return NextResponse.json({ error: 'description must be a string' }, { status: 400 })
    }
    description = (body.description ?? name).toString().trim() || name
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  // Duplicate name check
  const { data: existing } = await supabase
    .from('themes')
    .select('id')
    .eq('name', name)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'Theme with this name already exists' }, { status: 409 })
  }

  let embedding: number[]
  try {
    embedding = await embedText(description)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[api/themes] embed failed:', message)
    return NextResponse.json({ error: `Embedding failed: ${message}` }, { status: 502 })
  }

  const { data: inserted, error: insertError } = await supabase
    .from('themes')
    .insert({
      name,
      description,
      embedding: embedding as unknown as string,
    })
    .select('id, name, description, created_at')
    .single()

  if (insertError || !inserted) {
    console.error('[api/themes] POST insert failed:', insertError?.message)
    return NextResponse.json(
      { error: `DB error: ${insertError?.message}` },
      { status: 500 }
    )
  }

  return NextResponse.json(inserted, { status: 201 })
}
