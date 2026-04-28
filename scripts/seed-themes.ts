import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

const SEED_THEMES = [
  {
    name: 'Time',
    description:
      'time expressions hours minutes days weeks months morning afternoon evening yesterday today tomorrow soon later',
  },
  {
    name: 'Location',
    description:
      'location prepositions spatial above below between next to in front behind inside outside near far',
  },
  {
    name: 'Question Words',
    description:
      'question words interrogative who what when where why how which how much how many',
  },
  {
    name: 'Home',
    description:
      'home apartment house furniture rooms kitchen bedroom bathroom living room balcony',
  },
  {
    name: 'Emotions',
    description:
      'emotions feelings happy sad angry excited scared love hate surprised proud ashamed nervous calm',
  },
  {
    name: 'Opposite Adjectives',
    description:
      'opposite adjective antonym pairs big small hot cold fast slow old new light heavy easy hard',
  },
]

async function embedText(text: string): Promise<number[]> {
  const { data, error } = await supabase.functions.invoke<{ embedding: number[] }>(
    'embed',
    { body: { text } }
  )
  if (error) throw new Error(`Embedding failed: ${error.message}`)
  if (!data?.embedding) throw new Error('Missing embedding in response')
  return data.embedding
}

async function main() {
  console.log(`Seeding ${SEED_THEMES.length} themes…\n`)

  let ok = 0
  let skipped = 0
  let failed = 0

  for (const theme of SEED_THEMES) {
    process.stdout.write(`  ${theme.name} … `)
    try {
      const { data: existing } = await supabase
        .from('themes')
        .select('id')
        .eq('name', theme.name)
        .maybeSingle()

      if (existing) {
        console.log('already exists — skipped')
        skipped++
        continue
      }

      const embedding = await embedText(theme.description)

      const { error: insertError } = await supabase
        .from('themes')
        .insert({
          name: theme.name,
          description: theme.description,
          embedding: embedding as unknown as string, // pgvector accepts JS array
        })

      if (insertError) throw new Error(insertError.message)
      console.log('inserted')
      ok++
    } catch (err) {
      console.log(`FAILED: ${err instanceof Error ? err.message : String(err)}`)
      failed++
    }
  }

  console.log(`\nDone. ${ok} inserted, ${skipped} skipped, ${failed} failed.`)
}

main()
