## Context

`GET /api/session` is the session factory. It reads all vocabulary items and lessons from Supabase, calls `selectItems` + `buildExercisePrompt` from `lib/session-builder.ts`, sends the prompt to GPT-4o, expands each `ExercisePair` into 3 exercise types, shuffles, calls `/api/tts` for each exercise sequentially, and returns the full array to the client.

The client stores the session in `localStorage` (key: `currentSession`) for resume-on-refresh. There is no server-side session state.

## Goals / Non-Goals

**Goals:**
- Implement the 8-step pipeline described in the ticket
- Return a fully-formed `Exercise[]` with `audioUrl` on each item
- Support optional `lessonId` and `wordCount` query params (both default gracefully)
- Show correct default: 10 focused words × 3 types = 30 exercises

**Non-Goals:**
- Server-side session caching (always generate fresh)
- Parallel TTS calls (sequential to avoid rate limits)
- Result storage (handled by `/api/session/complete`, EUG-21)

## Decisions

**Sequential TTS** — Parallel requests risk OpenAI rate limits. Sequential is slower (~5–10s) but safe. This is acceptable given the loading screen.

**Fall back to most-recently-created lesson** — If `lessonId` is absent, query `max(lessons.created_at)`. Simple and matches the expected UX where the last lesson is always the focus.

**Strip markdown fences from GPT-4o response** — GPT-4o wraps JSON in ` ```json ``` ` fences. Strip with a regex before `JSON.parse`. (Confirmed in EUG-15 verification.)

**Shuffle constraint: no two consecutive same type or same focusWordId** — Simple interleave: sort by type in rotation (reading → listening → translating → reading…), then within each group randomise order. This guarantees no two consecutive same type and minimises same-focusWordId adjacency.

**Internal TTS call via fetch to `/api/tts`** — Reuses the existing cached TTS route rather than duplicating OpenAI TTS logic.

## Risks / Trade-offs

- **GPT-4o returns malformed JSON** → Mitigation: wrap `JSON.parse` in try/catch, return 500 with descriptive error.
- **TTS fails for one exercise** → Mitigation: fail the whole request — partial sessions are harder to handle client-side than a clean retry.
- **Latency** → 8–15s is expected. Client must show a loading screen (EUG-20's responsibility).
- **`lessonId` not found** → Return 400 with clear message.
