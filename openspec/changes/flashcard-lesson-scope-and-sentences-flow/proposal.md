## Why

Flashcard practice currently draws from the entire vocabulary pool with no way to focus on a specific lesson, and there is no direct path from flashcards to sentence practice using the same words. Users have no exit from an active practice session without finishing it.

## What Changes

- **New shared `LessonList` component** extracted from `LessonsDashboard`, reused in the flashcard picker screen with a click handler instead of navigation links.
- **Flashcard lesson picker** replaces the "10 / 20 / 30 words" screen with a lesson selection list; word selection is then scoped to that lesson.
- **Lesson-scoped flashcard API** — `GET /api/flashcard` gains an optional `lessonId` query param that filters vocabulary items to the selected lesson.
- **"Generate sentences with these words" button** on the flashcard summary screen launches sentence practice using the session's vocabulary item IDs as anchors.
- **Sentences API `itemIds` input mode** — `POST /api/practice/sentences` accepts `{ itemIds, count }` in addition to the existing `{ themeId, count }`. Anchor items are guaranteed to appear in sentences; supplemental vocabulary is sourced from a vector search over the anchor centroid, then organized by POS so GPT stays within the student's known vocabulary.
- **"End practice" button** — always-visible button in all active phases of both flashcard and sentence practices, routing to `/`.

## Capabilities

### New Capabilities

- `lesson-scoped-flashcards`: Lesson selection before flashcard session; API filtering of vocabulary items by lesson.
- `sentences-from-session`: Triggering sentence practice with specific vocabulary item IDs as anchors; anchor + supplemental POS-grouped prompt structure in the sentences API.
- `end-practice-control`: Persistent exit button visible during all active phases of flashcard and sentence practices.

### Modified Capabilities

- `flashcard-session-runner`: Picking screen changes from count selection to lesson selection; summary screen gains "Generate sentences" action.
- `sentence-exercises`: API gains a new input mode (`itemIds`); prompt structure gains explicit anchor/supplemental separation.
- `home-dashboard`: `LessonsDashboard` delegates list rendering to the new shared `LessonList` component.

## Impact

- **New file**: `components/LessonList.tsx`
- **Modified**: `components/LessonsDashboard.tsx`, `app/practice/page.tsx`, `app/practice/sentences/page.tsx`
- **Modified APIs**: `app/api/flashcard/route.ts`, `app/api/practice/sentences/route.ts`
- **Supabase**: `match_vocabulary_items` RPC already exists and is reused for supplemental vector search; no schema changes required.
- **No new dependencies.**
