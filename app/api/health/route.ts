import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const results: Record<string, { ok: boolean; error?: string }> = {}

  // Supabase
  try {
    const { error } = await supabase.from('vocabulary_items').select('id').limit(1)
    results.supabase = error ? { ok: false, error: error.message } : { ok: true }
  } catch (e) {
    results.supabase = { ok: false, error: String(e) }
  }

  // OpenAI
  try {
    const key = process.env.OPENAI_API_KEY
    if (!key || key.startsWith('your_')) {
      results.openai = { ok: false, error: 'OPENAI_API_KEY not set' }
    } else {
      const res = await fetch('https://api.openai.com/v1/models', {
        headers: { Authorization: `Bearer ${key}` },
      })
      results.openai = res.ok ? { ok: true } : { ok: false, error: `HTTP ${res.status}` }
    }
  } catch (e) {
    results.openai = { ok: false, error: String(e) }
  }

  const allOk = Object.values(results).every((r) => r.ok)
  return NextResponse.json(results, { status: allOk ? 200 : 500 })
}
