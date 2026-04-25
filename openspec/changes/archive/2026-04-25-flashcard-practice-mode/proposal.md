## Why

The existing practice session is slow (10–15s LLM wait), complex, and sentence-focused — not ideal for daily vocabulary drilling. Replacing it with a flashcard loop over raw vocabulary items gives instant session start, direct word retention practice, and a foundation for spaced repetition via `last_mistake_at`.

## What Changes

- **BREAKING** Remove `GET /api/session` (LLM-generated sentence session) and retire `lib/session-builder.ts`
- Replace `app/practice/page.tsx` with a flashcard runner (word count picker → flashcard loop → summary)
- Add `POST /api/lessons` step: generate TTS for each new word at indexing time, store `audio_url` on `vocabulary_items`
- Add `GET /api/flashcard` — returns N words selected by the pluggable strategy
- Add `POST /api/flashcard` — writes `last_used_at`, `number_used`, and `last_mistake_at` for session results
- Add `audio_url` column to `vocabulary_items` table
- Add `lib/flashcard-selection.ts` — pluggable word selection strategy functions

## Capabilities

### New Capabilities

- `flashcard-session-runner`: The `/practice` page with three states — `picking` (10/20/30 word count selector), `running` (flashcard loop with in-memory deck), and `summary` (session results). Cards marked correct are removed from the deck; mistakes/IDK are re-queued at a random position ≥3 away. Session results are flushed to the API on completion.
- `flashcard-word-selection`: Pluggable strategy for selecting N words from the vocabulary. Default strategy: words with `last_mistake_at` within the last 3 days first, then remaining slots filled by `last_used_at ASC NULLS FIRST`. Lives in `lib/flashcard-selection.ts`.
- `tts-at-index-time`: `POST /api/lessons` calls `/api/tts` for each new vocabulary item and stores the returned URL in `vocabulary_items.audio_url`. Reuses existing content-addressed TTS cache — no re-generation for existing words.
- `hebrew-onscreen-keyboard`: On-screen Hebrew keyboard rendered in the flashcard view when `!('ontouchstart' in window)`. 27-key grid (22 base letters + 5 final forms). Injects characters into the active text input.

### Modified Capabilities

- `vocabulary-mistake-tracking`: End-of-session POST now writes `last_mistake_at = now()` for all words where a mistake was made (in addition to existing `last_used_at` and `number_used` updates). This field drives the spaced repetition selection without a separate schedule table.
- `tts-generation`: TTS is now triggered at lesson indexing time (not session build time). The `/api/tts` endpoint is unchanged; the call site moves.
- `lesson-persistence`: `POST /api/lessons` gains a TTS step — after inserting new vocabulary items, it calls `/api/tts` for each and updates `audio_url`.

## Impact

- DB: `vocabulary_items` needs `audio_url text` column added
- Removed: `app/api/session/route.ts`, `lib/session-builder.ts`
- New: `app/api/flashcard/route.ts`, `lib/flashcard-selection.ts`
- Modified: `app/practice/page.tsx`, `app/api/lessons/route.ts`
- Frontend: the "Start Practice" button on the home page navigates to `/practice` (unchanged); the page now shows a word-count picker before starting
