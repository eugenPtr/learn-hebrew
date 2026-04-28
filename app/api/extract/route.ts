import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export const maxDuration = 30

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const SYSTEM_PROMPT = `You are a Hebrew language tutor assistant. Your job is to extract Hebrew vocabulary from handwritten lesson notes in the image, then provide correct English translations for each item.

Return ONLY a JSON object in this exact format:
{
  "items": [
    { "hebrew": "שלום", "english": "peace / hello" }
  ]
}

Rules:
- Extract EVERY Hebrew word, phrase, and inflected form visible in the image — err on the side of extracting MORE items, not fewer.
- CRITICAL: If the image contains a conjugation table or paradigm (e.g. a preposition declined with pronoun suffixes, or a verb conjugated across persons), extract EACH individual form as its own separate item. Do not collapse a table into just its root/base word. For example, if you see a table for של (of), you must extract שלי, שלך, שלה, שלו, שלנו, שלכם, שלכן, שלהם, שלהן as separate items — not just של.
- Common paradigm patterns to watch for: preposition+pronoun-suffix tables (של, על, ל, את, עם, אל, מ, ב, עד, …), verb conjugation grids, pronoun lists.
- Also extract the base/root word itself (e.g. של, על, ל) if it is written as a heading or standalone word.
- Extract complete phrases and idioms (e.g. אין עליך, של מי הספר) as single items.
- Provide your own correct English translation for each item — do NOT copy English or phonetic text written in the notebook.
- Write Hebrew without niqqud (no vowel points) — plain consonants only.
- If the same Hebrew form appears more than once, include it only once.
- If no Hebrew is found, return { "items": [] }.
- Do not include anything other than the JSON object.`

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
