## Context

Lessons are created by photo upload and have been immutable since creation. The `lessons` table has only `id` and `created_at`; there is no title. Vocabulary items are globally deduplicated by Hebrew text at ingestion time — a word whose Hebrew already exists is skipped. The dashboard renders expand-accordion cards labeled "Lesson 1", "Lesson 2", etc., and fetches all vocabulary items joined to every lesson on every page load.

The app is moving toward lessons as named taxonomic categories (Pronouns, Pa'al verbs, Greetings). This requires labeling, post-creation editing, and a richer deduplication policy.

## Goals / Non-Goals

**Goals:**
- Users can set and edit a lesson's title at any time
- Users can add, remove, and inline-edit vocabulary items in a lesson
- Dashboard cards navigate to a lesson detail page instead of expanding
- Global word uniqueness (by Hebrew) is preserved; conflicts cause ownership transfer

**Non-Goals:**
- Merging two lessons into one
- Bulk word operations (select-all, bulk delete)
- Re-uploading photos to append words to an existing lesson
- Edit history or undo

## Decisions

**Nullable `title` column, no default**
`ALTER TABLE lessons ADD COLUMN title text` — nullable, no default. UI falls back to "Lesson N" when null. No data migration needed for existing lessons; they display as before until labeled.

**Ownership transfer on Hebrew conflict, not skip**
When adding or editing a word whose Hebrew already exists in a different vocabulary item:
1. Update that existing item's `lesson_id` to the current lesson
2. Update its `english` to the incoming value (if different)
3. If the caller was editing a different item (not inserting), delete the caller's original item — the existing item with its practice history is the canonical record
4. No TTS regeneration needed (Hebrew text hasn't changed)

Rationale: uniqueness by Hebrew is the intended long-term model. Blocking or silent skip would leave users confused about why a word "didn't save." Ownership transfer is the semantically correct resolution.

**Separate `vocabulary-items` API, not nested under lesson**
`PATCH /api/vocabulary-items/[id]` and `DELETE /api/vocabulary-items/[id]` are top-level routes. Vocabulary items have their own identity that survives across lesson moves. Lesson-nested routes (`/api/lessons/[id]/words/[wid]`) would imply they're always accessed through a specific lesson, which is false during ownership transfer.

**TTS regeneration only on Hebrew change**
On `PATCH /api/vocabulary-items/[id]`, compare the incoming `hebrew` (normalized) against the stored value. If different and no ownership transfer occurred, call `/api/tts` and update `audio_url`. English-only edits do not touch audio.

**Inline edit UX with explicit Save**
Tapping a word row reveals Hebrew + English `<input>` fields in place. An explicit "Save" button (not blur-to-save) commits the change. "Cancel" restores the previous values. Rationale: blur-to-save triggers TTS calls unintentionally when the user clicks elsewhere to look something up.

**Dashboard query: word count only, no vocab join**
The dashboard now shows title + word count per card, not a vocabulary preview. The server query changes from `select('*, vocabulary_items(*)')` to a count aggregate. The full vocabulary list is fetched only on the detail page.

**Detail page is a client component**
`/lesson/[id]` fetches the lesson and its words via the API on mount (client-side). This avoids re-architecting the page as a server component and keeps the inline-edit interaction fully client-controlled.

## Risks / Trade-offs

- **Ownership transfer surprises** — Editing a word in Lesson A to match a word in Lesson B silently removes it from Lesson B. Mitigation: this is the documented intended model; no immediate UX mitigation needed for v1.
- **TTS latency on save** — Editing Hebrew adds a round-trip for TTS generation before save completes. Mitigation: disable the Save button and show a spinner while the PATCH is in flight.
- **Practice history lost on item delete** — When ownership transfer deletes the caller's original item, that item's `number_used`/`last_mistake_at` are gone. Mitigation: the surviving item (the one whose `lesson_id` was updated) retains its own history, which is the more meaningful record.

## Migration Plan

1. Run `ALTER TABLE lessons ADD COLUMN title text` on Supabase
2. Deploy — no app changes required for this migration to be safe; existing code ignores unknown columns
3. Ship application changes

Rollback: `ALTER TABLE lessons DROP COLUMN title` — safe as long as no application code depends on it yet.
