## Why

The practice feature needs a single endpoint that builds a complete, audio-ready exercise session. Without it, the `/practice` UI has nothing to fetch. This is the orchestration layer that wires together `session-builder.ts` (EUG-15, done), GPT-4o, TTS, and the DB.

## What Changes

- Add `app/api/session/route.ts` — `GET /api/session?lessonId=<uuid>&wordCount=<n>`
- Orchestrates: DB read → word selection → LLM exercise generation → expand to 3 types → shuffle → TTS per exercise → return full exercise array

## Capabilities

### New Capabilities
- `practice-session-api`: The GET /api/session endpoint that produces a complete shuffled, audio-ready exercise array for the practice UI

### Modified Capabilities
<!-- No existing spec-level behavior changes -->

## Impact

- New file: `app/api/session/route.ts`
- Depends on: `lib/session-builder.ts`, `/api/tts`, Supabase `vocabulary_items` + `lessons` tables, OpenAI GPT-4o
- Consumed by: `/practice` UI (EUG-20)
- Expected latency: 8–15s at session start (LLM ~2–4s + TTS sequential ~5–10s for 30 exercises)
