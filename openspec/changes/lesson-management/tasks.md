## 1. Schema migration

- [x] 1.1 Run `ALTER TABLE lessons ADD COLUMN title text` on Supabase
- [x] 1.2 Verify column appears in Supabase table editor and existing lessons are unaffected

## 2. Lesson listing and labeling API

- [x] 2.1 Add `GET /api/lessons` — query lessons with word count aggregate, return `[{ id, title, word_count, created_at }]` ordered by `created_at` asc
- [x] 2.2 Add `PATCH /api/lessons/[id]` — accept `{ title: string | null }`, update title, return `{ ok: true }`; 404 if lesson not found; treat empty string as null

## 3. Lesson detail API

- [x] 3.1 Add `GET /api/lessons/[id]` — return lesson with `{ id, title, created_at, vocabulary_items: [{ id, hebrew, english, audio_url }] }`; 404 if not found

## 4. Vocabulary item CRUD API

- [x] 4.1 Add `POST /api/lessons/[id]/words` — normalize Hebrew, run dedup: (a) same lesson → no-op, (b) different lesson → transfer `lesson_id` + update `english`, (c) new → insert + call `/api/tts`; return `{ ok, action, itemId }`
- [x] 4.2 Add `PATCH /api/vocabulary-items/[id]` — if Hebrew changed (normalized): check conflict → ownership transfer (update existing item's lesson_id + english, delete current) or regen TTS; if English-only: update english; 404 if not found
- [x] 4.3 Add `DELETE /api/vocabulary-items/[id]` — delete item; return `{ ok: true }`; 404 if not found

## 5. Update POST /api/lessons dedup behavior

- [x] 5.1 Change dedup logic in `POST /api/lessons`: items whose Hebrew exists in a different lesson → `UPDATE vocabulary_items SET lesson_id = newLessonId, english = incomingEnglish WHERE hebrew = ?`; track as `transferred` count
- [x] 5.2 Update response shape to include `transferred` count alongside `inserted` and `skipped`

## 6. Dashboard: tap-to-navigate cards

- [x] 6.1 Update `app/page.tsx` server query — replace `select('*, vocabulary_items(*)')` with a word count aggregate (use Supabase `count()` or a separate query); pass `[{ id, title, word_count, created_at }]` to dashboard
- [x] 6.2 Rewrite `LessonsDashboard` — remove expand/collapse state; render each lesson as a `<Link href="/lesson/[id]">` card showing title (or "Lesson N" fallback) and word count; remove vocabulary item rendering

## 7. Lesson detail page

- [x] 7.1 Create `app/lesson/[id]/page.tsx` as a `'use client'` component; on mount fetch `GET /api/lessons/[id]`; show loading state; show 404 message with back link if not found
- [x] 7.2 Render editable title: display as text with an edit icon; clicking switches to an `<input>` with Save/Cancel; Save calls `PATCH /api/lessons/[id]`; on success update displayed title; treat empty save as title clear (fallback label shown)
- [x] 7.3 Render vocabulary list: each row shows Hebrew (bold, RTL) and English; display mode has an inline Edit button and a Delete button
- [x] 7.4 Implement inline edit mode for a word row: clicking Edit reveals Hebrew and English `<input>` fields pre-filled with current values; Save and Cancel buttons; Save disabled + spinner while PATCH in flight; Cancel restores display mode; only one row editable at a time
- [x] 7.5 Wire Save on word edit: call `PATCH /api/vocabulary-items/[id]`; on success update row in local list and return to display mode; on error show inline error message
- [x] 7.6 Wire Delete: tap Delete button on a row → call `DELETE /api/vocabulary-items/[id]`; on success remove row from list
- [x] 7.7 Add "Add word" form at the bottom: Hebrew (RTL input) and English text inputs; submit calls `POST /api/lessons/[id]/words`; on success clear form and append new word to list; show inline error on failure; validate that both fields are non-empty before submitting
- [x] 7.8 Add back button (`<Link href="/">`) at top of page
