## Context

The practice session builder (EUG-16) needs to attach a playable audio URL to each of its 30 exercises before returning them to the client. Audio generation must happen server-side at session build time so the browser can play files directly from Supabase Storage CDN with no additional API calls in the hot path.

The existing codebase uses OpenAI (SDK v6) and Supabase JS v2. The `lib/supabase.ts` client uses the anon key, which is insufficient for storage writes. A server-only Supabase client using `SUPABASE_SECRET_KEY` must be used for uploads.

## Goals / Non-Goals

**Goals:**
- Single POST endpoint that generates and caches Hebrew TTS audio
- Hash-based deduplication so identical sentences never pay TTS cost twice
- Returns a public, directly playable Supabase Storage URL

**Non-Goals:**
- Streaming audio or chunked delivery
- Voice selection per request (voice is fixed to `alloy`)
- Client-side TTS — this is server-only

## Decisions

**Decision: SHA-256 hash as filename**
Using `sha256(text)` as the MP3 filename provides deterministic, collision-resistant cache keys at zero storage overhead. Alternative (random UUID per call) would regenerate audio for identical sentences every session. The hash approach amortises TTS cost across all future sessions.

**Decision: Check existence via `storage.list()` before generating**
Calling `supabase.storage.from('tts-audio').list('', { search: filename })` before hitting OpenAI lets us short-circuit without any TTS cost. Alternative (upload with `upsert: false`, catch the 409) works but conflates the "already exists" path with error handling, making the code harder to read.

**Decision: Secret key for uploads, separate client instance**
Supabase Storage requires elevated permissions for writes. Rather than relaxing bucket policies to allow anon inserts, we use `SUPABASE_SECRET_KEY` in a server-only Supabase client. The existing `lib/supabase.ts` anon client is untouched.

**Decision: `Promise.all` fan-out in the caller (EUG-16), not here**
This endpoint handles one text at a time. Parallelisation across 30 exercises is the session builder's responsibility. Keeping this route single-purpose makes it independently testable and reusable.

## Risks / Trade-offs

- **Cold start latency**: First call for a given sentence waits on both OpenAI TTS (~1–3s) and Supabase upload. Subsequent calls are instant. Mitigation: EUG-16 runs all 30 TTS calls in parallel with `Promise.all`.
- **`tts-audio` bucket must be public**: Public bucket means anyone with the URL can play the file. Acceptable for this personal-use app; would need signed URLs for a multi-tenant product.
- **Secret key in server environment only**: `SUPABASE_SECRET_KEY` must never be exposed to the client. The route is `app/api/tts/route.ts` (server-side only) — this is safe as long as the key is not prefixed `NEXT_PUBLIC_`.
