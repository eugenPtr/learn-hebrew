import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

const BUCKET = 'tts-audio'

export async function generateTtsAudio(text: string): Promise<string> {
  const filename = `${createHash('sha256').update(text).digest('hex')}.mp3`

  const { data: existing } = await supabase.storage.from(BUCKET).list('', { search: filename })
  if (existing && existing.length > 0) {
    const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(filename)
    return publicUrl
  }

  const response = await openai.audio.speech.create({
    model: 'tts-1',
    voice: 'alloy',
    input: text,
  })
  const audioBuffer = Buffer.from(await response.arrayBuffer())

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(filename, audioBuffer, { contentType: 'audio/mpeg' })

  if (uploadError) throw new Error(`Storage upload error: ${uploadError.message}`)

  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(filename)
  return publicUrl
}
