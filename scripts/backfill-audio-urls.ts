import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'
import OpenAI from 'openai'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const BUCKET = 'tts-audio'

async function generateAudioUrl(text: string): Promise<string> {
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

  if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`)

  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(filename)
  return publicUrl
}

async function main() {
  const { data: items, error } = await supabase
    .from('vocabulary_items')
    .select('id, hebrew')
    .is('audio_url', null)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Failed to fetch items:', error.message)
    process.exit(1)
  }

  if (!items || items.length === 0) {
    console.log('No items with missing audio_url — nothing to do.')
    return
  }

  console.log(`Found ${items.length} items to backfill.`)

  let ok = 0
  let failed = 0

  for (const item of items) {
    process.stdout.write(`  [${ok + failed + 1}/${items.length}] "${item.hebrew}" … `)
    try {
      const audioUrl = await generateAudioUrl(item.hebrew)
      const { error: updateError } = await supabase
        .from('vocabulary_items')
        .update({ audio_url: audioUrl })
        .eq('id', item.id)
      if (updateError) throw new Error(updateError.message)
      console.log('ok')
      ok++
    } catch (err) {
      console.log(`FAILED: ${err instanceof Error ? err.message : String(err)}`)
      failed++
    }
  }

  console.log(`\nDone. ${ok} succeeded, ${failed} failed.`)
}

main()
