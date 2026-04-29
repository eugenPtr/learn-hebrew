/**
 * Backfill embeddings for all vocabulary_items that have embedding IS NULL.
 * Calls the Supabase `embed` edge function for each item's English translation.
 *
 * Usage:  npx tsx scripts/backfill-embeddings.ts
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SECRET_KEY!

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in environment')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function embedText(text: string): Promise<number[]> {
  const { data, error } = await supabase.functions.invoke<{ embedding: number[] }>('embed', {
    body: { text },
  })
  if (error) throw new Error(`Embed function error: ${error.message}`)
  if (!data?.embedding || !Array.isArray(data.embedding)) {
    throw new Error('Invalid embedding response')
  }
  return data.embedding
}

async function main() {
  const { data: rows, error } = await supabase
    .from('vocabulary_items')
    .select('id, english')
    .is('embedding', null)

  if (error) {
    console.error('Failed to fetch items:', error.message)
    process.exit(1)
  }

  console.log(`Found ${rows.length} items without embeddings`)

  let done = 0
  let failed = 0

  for (const row of rows) {
    try {
      const embedding = await embedText(row.english)
      const { error: updateError } = await supabase
        .from('vocabulary_items')
        .update({ embedding: embedding as unknown as string })
        .eq('id', row.id)

      if (updateError) throw new Error(updateError.message)

      done++
      if (done % 10 === 0) console.log(`  ${done}/${rows.length} done…`)
    } catch (err) {
      failed++
      console.error(`  FAILED [${row.id}] "${row.english}":`, err instanceof Error ? err.message : err)
    }
  }

  console.log(`\nDone. ${done} succeeded, ${failed} failed.`)
}

main()
