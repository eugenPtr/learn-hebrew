## Why

The practice session needs audio for every exercise so users can hear correct Hebrew pronunciation. Audio must be pre-generated server-side before the session reaches the client, so playback is instant with no per-click API calls.

## What Changes

- New `POST /api/tts` route that accepts a Hebrew text string, calls OpenAI TTS, uploads the MP3 to Supabase Storage, and returns a public URL
- SHA-256 hash of the text is used as the filename — identical sentences across sessions reuse the same cached file, paying zero TTS cost on repeat
- If the file already exists in storage, generation is skipped entirely and the existing URL is returned immediately
- A public `tts-audio` Supabase Storage bucket is created to hold the MP3 files

## Capabilities

### New Capabilities

- `tts-generation`: POST /api/tts endpoint — accepts `{ text: string }`, returns `{ audioUrl: string }` with hash-based caching via Supabase Storage

### Modified Capabilities

<!-- none -->

## Impact

- New file: `app/api/tts/route.ts`
- Requires `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` for server-side storage uploads (anon key lacks write permissions)
- Requires `tts-audio` bucket created as public in Supabase Storage
- Consumed by EUG-16 (`/api/session`) which calls this for all 30 exercises at session build time
