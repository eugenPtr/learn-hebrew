import { supabase } from '@/lib/supabase'

export async function embedText(text: string): Promise<number[]> {
  const { data, error } = await supabase.functions.invoke<{ embedding: number[] }>(
    'embed',
    { body: { text } }
  )

  if (error) {
    throw new Error(`Embedding failed: ${error.message}`)
  }
  if (!data?.embedding || !Array.isArray(data.embedding)) {
    throw new Error('Embedding response missing embedding array')
  }
  return data.embedding
}
