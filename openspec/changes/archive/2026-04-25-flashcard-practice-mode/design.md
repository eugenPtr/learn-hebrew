## Context

The current practice session calls an LLM (o3-mini + gpt-4o-mini) to generate Hebrew sentences, then calls TTS sequentially for each exercise. This takes 10–15 seconds and produces sentence-based reading/listening/translating exercises. The new mode replaces this entirely with a flashcard loop over raw vocabulary items — no LLM at session time, audio pre-generated at indexing time.

The existing `vocabulary_items` table already has `last_used_at`, `last_mistake_at`, and `number_used` columns which provide all the signal needed for spaced repetition selection.

## Goals / Non-Goals

**Goals:**
- Instant session start (no LLM wait)
- Flashcard loop: show English, type Hebrew, check, re-queue mistakes
- Spaced repetition: words with recent mistakes surface in subsequent sessions for 3 days
- Pluggable selection algorithm for experimentation
- TTS audio pre-generated at indexing time and stored in DB
- On-screen Hebrew keyboard on desktop

**Non-Goals:**
- Keeping the sentence-based reading/listening/translating exercises
- Mid-session DB writes
- Multi-language support beyond Hebrew
- Recovering incomplete sessions after tab close

## Decisions

**Replace entirely, not coexist**
The sentence-based session is retired. The `/practice` page and `GET /api/session` are replaced. `lib/session-builder.ts` is deleted. Keeping both adds routing complexity and user confusion for no gain in this stage of the app.

**Spaced repetition via `last_mistake_at`, no schedule table**
A `review_schedule` table would be cleaner in the abstract but adds schema complexity. The `last_mistake_at` column already exists. The selection algorithm applies a simple rule: if `last_mistake_at` is within the last 3 days, that word is prioritized. Writing `last_mistake_at = now()` at session end is sufficient — the 3-day window handles "show it again soon" without explicit scheduling. The window width is a constant in the strategy function, easy to tune.

**Pluggable strategy in `lib/flashcard-selection.ts`**
Selection logic is a pure function `(items: VocabularyItem[], count: number) => VocabularyItem[]`. Strategies are named objects; an `activeStrategy` export controls which one runs. Swapping strategies requires changing one line. New strategies can be added without touching the API route.

```
Default strategy:
  1. Filter: last_mistake_at >= now() - 3 days  → recent mistake items
  2. Sort remaining by last_used_at ASC NULLS FIRST → stalest / never-used
  3. Merge: recent mistakes first, fill to count from sorted remainder
  4. Shuffle result
```

**TTS at indexing time, not session time**
`POST /api/lessons` calls `/api/tts` for each net-new vocabulary item and stores `audio_url` on the inserted row. The `/api/tts` endpoint is already content-addressed (SHA-256 hash), so re-indexing the same word is a cache hit with no cost. Vocabulary items created before this change will have `audio_url = null`; the flashcard UI falls back to no audio for those items.

**Answer checking: nikud-stripped normalized exact match**
Strip Unicode combining characters in the range U+0591–U+05C7 (Hebrew nikud/cantillation) from both the user input and the stored `hebrew` value, then trim whitespace and compare. This handles the common case where the DB stores nikud but the user types without. No fuzzy matching — alternate spellings are a data quality issue, not a UI issue.

**Re-queue position: random slot at least 3 positions from current**
When a card is re-queued, it is inserted at a random index in `[currentIndex + 3, deck.length]`. This ensures the user sees at least 3 other cards before the mistake reappears. If the deck has fewer than 3 remaining cards, the re-queued card goes to the end.

**Single `/practice` page with three client states**
`picking → running → summary`. No separate routes. The URL stays `/practice` throughout. State is held in React; localStorage is not used (sessions are short, recovery not a goal). Word list from `GET /api/flashcard?count=N` is fetched when transitioning from `picking` to `running`.

**On-screen keyboard: desktop detection via touch capability**
`'ontouchstart' in window` — render keyboard only when false. No UA sniffing. The keyboard appends characters to the active text input via a controlled React state; it does not manipulate the DOM directly.

## Risks / Trade-offs

- **Vocabulary items with null audio_url** (pre-existing rows) → UI renders without the play button; silent degradation. A one-time backfill script can populate these later.
- **`last_mistake_at` is a single timestamp** — repeated mistakes on different days all collapse to the most recent. This means if you got something wrong 5 days ago and again today, only today is recorded. The 3-day window still works correctly; this is not a problem in practice.
- **No session resume** — if the user closes the tab mid-session, progress is lost. This is intentional; sessions are short.
- **Answer check false negatives** — morphological variants (plural, gender inflection) will fail exact match. This is acceptable for v1; the IDK path handles it gracefully.

## Migration Plan

1. Apply DB migration: add `audio_url text` column to `vocabulary_items`
2. Deploy new code (API routes + page)
3. Old `/api/session` route is removed in the same deploy — no clients depend on it except the old practice page, which is also replaced
4. Existing vocabulary items have `audio_url = null` — this is safe, the UI handles it
5. No rollback complexity: the old session route can be restored from git if needed
