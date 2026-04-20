## 1. Supabase Setup

- [x] 1.1 Create `tts-audio` bucket in Supabase Storage as public via Supabase MCP
- [x] 1.2 Add `SUPABASE_SECRET_KEY` to `.env.local` (fetch from Supabase MCP)

## 2. Route Implementation

- [x] 2.1 Create `app/api/tts/route.ts` with a server-only Supabase client using `SUPABASE_SECRET_KEY`
- [x] 2.2 Parse and validate `{ text: string }` from request body; return 400 if missing
- [x] 2.3 Compute `sha256(text)` using Node.js `crypto.createHash` to derive filename `{hash}.mp3`
- [x] 2.4 Check if `{hash}.mp3` already exists in `tts-audio` via `supabase.storage.from('tts-audio').list('', { search: filename })`; if found, return `{ audioUrl }` immediately
- [x] 2.5 Call OpenAI TTS (`tts-1`, `alloy`) with `text`; convert response to `Buffer`
- [x] 2.6 Upload buffer to `tts-audio` at path `{hash}.mp3` with `contentType: 'audio/mpeg'`
- [x] 2.7 Get public URL via `supabase.storage.from('tts-audio').getPublicUrl(filename)` and return `{ audioUrl }`

## 3. Verification

- [x] 3.1 POST a Hebrew sentence to `/api/tts` and confirm a valid `audioUrl` is returned
- [x] 3.2 Confirm the MP3 exists in Supabase Storage at the hash-based path
- [x] 3.3 Confirm the URL plays correctly in the browser (paste URL, audio loads)
- [x] 3.4 POST the same sentence again and confirm no new file is created (cache hit)
