## Why

Lessons currently have no labels and no way to edit their contents after creation — they're opaque, immutable upload artifacts. As the app moves toward categorizing vocabulary into named sets (Pronouns, Pa'al verbs, Greetings, etc.), users need to name lessons, curate their word lists, and correct mistakes without re-uploading.

## What Changes

- Add a `title` column to the `lessons` table
- Introduce a lesson detail page (`/lesson/[id]`) with editable title and inline word editing (add / edit / delete)
- Replace the dashboard's expand-accordion with tap-to-navigate; show lesson title + word count on each card
- **BREAKING (lesson-persistence dedup)**: When adding or editing a word whose Hebrew already exists in another lesson, transfer ownership of that existing item to the current lesson instead of silently skipping. Practice history travels with the moved item.
- TTS audio is regenerated only when the Hebrew text of a word changes, not on English-only edits

## Capabilities

### New Capabilities

- `lesson-labeling`: Lessons have an optional user-set title. The title is editable at any time from the detail page. Falls back to "Lesson N" (chronological) when unset.
- `lesson-word-editing`: Add, remove, and inline-edit vocabulary items within a lesson. Adding or editing to a Hebrew value that already exists globally transfers ownership of that item to the current lesson.
- `lesson-detail-page`: A new page at `/lesson/[id]` renders the lesson's editable title and full word list. Tapping a word row opens an inline editor (Hebrew + English inputs). A back button returns to the dashboard.

### Modified Capabilities

- `lesson-persistence`: Dedup behavior changes — a word whose Hebrew already exists is no longer skipped; its `lesson_id` is updated to the current lesson and its English is updated if different. This applies at lesson creation, word addition, and word edit.
- `home-dashboard`: Cards no longer expand in-place. Tapping a card navigates to `/lesson/[id]`. Each card shows the lesson's title (or fallback "Lesson N") and word count.

## Impact

- **Schema**: `ALTER TABLE lessons ADD COLUMN title text`
- **New API endpoints**: `GET /api/lessons/[id]`, `PATCH /api/lessons/[id]`, `POST /api/lessons/[id]/words`, `PATCH /api/vocabulary-items/[id]`, `DELETE /api/vocabulary-items/[id]`
- **Modified**: `POST /api/lessons` — dedup behavior change (ownership transfer)
- **New page**: `app/lesson/[id]/page.tsx`
- **Modified**: `components/LessonsDashboard.tsx` — tap-to-navigate, show title + count
- **Modified**: `app/page.tsx` — adjust query (title field, word count, no longer need full vocab join for dashboard)
