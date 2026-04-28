import { NextRequest, NextResponse } from 'next/server'
import { generateTtsAudio } from '@/lib/tts'

export const maxDuration = 30

export async function POST(req: NextRequest) {
  let text: string
  try {
    const body = await req.json()
    text = body.text
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Missing text field' }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  try {
    const audioUrl = await generateTtsAudio(text)
    return NextResponse.json({ audioUrl })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[api/tts] error:', message)
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
