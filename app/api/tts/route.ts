import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export const maxDuration = 30

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

const BUCKET = 'tts-audio'

export async function POST(req: NextRequest) {
  let text: string
  try {
    const body = await req.json()
    text = body.text
    if (!text || typeof text !== 'string') {
      console.error('[api/tts] missing text field')
      return NextResponse.json({ error: 'Missing text field' }, { status: 400 })
    }
  } catch {
    console.error('[api/tts] invalid request body')
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const filename = `${createHash('sha256').update(text).digest('hex')}.mp3`
  console.log('[api/tts] text:', text, '— filename:', filename)

  // Check cache — skip TTS if the file already exists
  const { data: existing } = await supabase.storage.from(BUCKET).list('', { search: filename })
  if (existing && existing.length > 0) {
    const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(filename)
    console.log('[api/tts] cache hit, returning existing URL')
    return NextResponse.json({ audioUrl: publicUrl })
  }

  // Generate audio via OpenAI TTS
  let audioBuffer: Buffer
  try {
    const response = await openai.audio.speech.create({
      model: 'tts-1',
      voice: 'alloy',
      input: text,
    })
    audioBuffer = Buffer.from(await response.arrayBuffer())
    console.log('[api/tts] generated audio, bytes:', audioBuffer.length)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[api/tts] OpenAI TTS error:', message)
    return NextResponse.json({ error: `OpenAI TTS error: ${message}` }, { status: 502 })
  }

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(filename, audioBuffer, { contentType: 'audio/mpeg' })

  if (uploadError) {
    console.error('[api/tts] upload error:', uploadError.message)
    return NextResponse.json({ error: `Storage upload error: ${uploadError.message}` }, { status: 502 })
  }

  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(filename)
  console.log('[api/tts] uploaded, public URL:', publicUrl)
  return NextResponse.json({ audioUrl: publicUrl })
}
