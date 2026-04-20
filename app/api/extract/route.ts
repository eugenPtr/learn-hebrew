import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export const maxDuration = 30

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const SYSTEM_PROMPT = `You are a Hebrew language tutor assistant. Your job is to extract Hebrew words and phrases from handwritten lesson notes in the image, then provide correct English translations for each one.

Return ONLY a JSON object in this exact format:
{
  "items": [
    { "hebrew": "שָׁלוֹם", "english": "peace / hello" }
  ]
}

Rules:
- Extract every Hebrew word or phrase visible in the image
- Provide your own correct English translation for each Hebrew item — do NOT copy any English or phonetic text written in the notebook, as it may be wrong or phonetic
- Write Hebrew text without niqqud (no vowel points) — plain consonants only
- If the same Hebrew word or phrase appears more than once in the image, include it only once in the output
- If no Hebrew words are found, return { "items": [] }
- Do not include anything other than the JSON object`

type VocabItem = { hebrew: string; english: string }

function isValidItems(data: unknown): data is { items: VocabItem[] } {
  if (!data || typeof data !== 'object') return false
  const obj = data as Record<string, unknown>
  if (!Array.isArray(obj.items)) return false
  return obj.items.every(
    (item) =>
      item &&
      typeof item === 'object' &&
      typeof (item as Record<string, unknown>).hebrew === 'string' &&
      typeof (item as Record<string, unknown>).english === 'string'
  )
}

export async function POST(req: NextRequest) {
  let image: string
  try {
    const body = await req.json()
    image = body.image
    if (!image || typeof image !== 'string') {
      console.error('[api/extract] missing image field')
      return NextResponse.json({ error: 'Missing image field' }, { status: 400 })
    }
  } catch {
    console.error('[api/extract] invalid request body')
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  console.log('[api/extract] received image, length:', image.length, '— calling OpenAI…')

  let completion
  try {
    completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:image/jpeg;base64,${image}` },
            },
          ],
        },
      ],
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[api/extract] OpenAI error:', message)
    return NextResponse.json({ error: `OpenAI API error: ${message}` }, { status: 502 })
  }

  const raw = completion.choices[0]?.message?.content ?? ''
  console.log('[api/extract] raw model output:', raw)

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    console.error('[api/extract] JSON parse failed, raw:', raw)
    return NextResponse.json({ error: 'Failed to parse model output' }, { status: 422 })
  }

  if (!isValidItems(parsed)) {
    console.error('[api/extract] validation failed, parsed:', parsed)
    return NextResponse.json({ error: 'Failed to parse model output' }, { status: 422 })
  }

  console.log('[api/extract] success, items:', (parsed as { items: VocabItem[] }).items.length)
  return NextResponse.json({ items: parsed.items })
}
