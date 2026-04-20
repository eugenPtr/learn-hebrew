## Why

After extraction, the user needs to review what was found before committing it to the database. Without this screen there is no opportunity to remove incorrect extractions, and no way to see which words are already known. This is the last step in the lesson ingestion flow before data is persisted.

## What Changes

- Create `app/lesson/review/page.tsx` — reads extracted items from `sessionStorage`, checks existing vocabulary in Supabase, and renders a reviewable list
- Each item shows as new or already known, can be individually deleted
- "Looks good" confirm button POSTs to `/api/lessons` and redirects home on success

## Capabilities

### New Capabilities

- `lesson-review-screen`: The `/lesson/review` page that presents extracted vocabulary for review, highlights known items, allows deletion, and triggers the save flow

### Modified Capabilities

## Impact

- New file: `app/lesson/review/page.tsx`
- Reads from `sessionStorage` key `extractedItems` (set by `/lesson/new`)
- Queries Supabase `vocabulary_items` for existing hebrew values
- POSTs to `/api/lessons` on confirm (EUG-13, not yet built — will be wired when ready)
