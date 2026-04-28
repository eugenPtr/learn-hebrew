// Supabase Edge Function: embed
// Computes a 384-dim embedding for the given text using the built-in
// gte-small model that runs natively in the Edge runtime.
//
// Request:  POST { text: string }
// Response: 200 { embedding: number[] }   // length 384
//           400 { error: string }

// deno-lint-ignore-file no-explicit-any
declare const Deno: any
const session = new (Deno as any).Supabase.ai.Session('gte-small')

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  let text: unknown
  try {
    const body = await req.json()
    text = body?.text
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (typeof text !== 'string' || text.trim() === '') {
    return new Response(JSON.stringify({ error: 'text must be a non-empty string' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const embedding: number[] = await session.run(text, {
    mean_pool: true,
    normalize: true,
  })

  return new Response(JSON.stringify({ embedding }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
