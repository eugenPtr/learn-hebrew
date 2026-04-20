## Why

The review screen (EUG-12) collects confirmed vocabulary items and needs a backend endpoint to persist them. Without this route, confirmed lesson data is lost after the review step — there's no way to grow the vocabulary bank.

## What Changes

- New `POST /api/lessons` route that receives confirmed `{ hebrew, english }` pairs, deduplicates against the existing vocabulary bank, and persists only net-new items
- Returns `{ lessonId, inserted, skipped }` so the client knows exactly what was saved

## Capabilities

### New Capabilities

- `lesson-persistence`: Accepts a confirmed lesson payload, creates a `lessons` row, deduplicates against existing `vocabulary_items` by exact `hebrew` match, and inserts only new items with `lesson_id` set

### Modified Capabilities

<!-- none -->

## Impact

- New file: `app/api/lessons/route.ts`
- Reads and writes to Supabase tables: `lessons`, `vocabulary_items`
- No new dependencies required (Supabase client already configured)
- No breaking changes — this is a new endpoint
