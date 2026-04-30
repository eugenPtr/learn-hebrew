## Why

After picking a lesson for flashcard practice, users have no control over how many words to drill — the session always uses all words in the lesson (capped at 30). A word-count picker after lesson selection lets users scope the session to what they have time for, while disabled buttons make it immediately clear when a lesson is too small for a given count.

## What Changes

- **Lesson list shows word count** — each lesson entry in the flashcard picker displays its word count so users can make an informed choice before tapping.
- **New count-picking screen** — after selecting a lesson, a second screen shows the lesson name, total word count, and four options: 10, 20, 30, All(N). Options exceeding the lesson's word count are disabled. A back arrow returns to lesson selection.
- **API honors `count` with `lessonId`** — `GET /api/flashcard` currently ignores `count` when `lessonId` is provided; it must now apply the count cap when both params are present.
- **"All(N)" option** — always enabled; passes the full lesson word count as the count to the API.

## Capabilities

### New Capabilities

- `flashcard-count-picker`: Screen shown after lesson selection presenting count options (10 / 20 / 30 / All(N)) with disabled states for counts exceeding the lesson's word count, and a back arrow to return to lesson selection.

### Modified Capabilities

- `flashcard-session-runner`: Picking flow gains a second step (count selection after lesson selection); lesson list entries now show word count. API behavior change: count param respected when lessonId is present.

## Impact

- **Modified**: `app/practice/page.tsx` — new `count-picking` phase in state machine; lesson list renders word count; `startSession` receives count argument.
- **Modified**: `app/api/flashcard/route.ts` — one-line fix to honor `count` when `lessonId` is present instead of always using `MAX_LESSON_COUNT`.
- **No new files, no new dependencies, no DB changes.**
