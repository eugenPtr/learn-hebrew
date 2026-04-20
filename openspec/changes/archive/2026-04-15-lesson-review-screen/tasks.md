## 1. Page scaffold

- [x] 1.1 Create `app/lesson/review/page.tsx` as a `'use client'` component
- [x] 1.2 On mount, read and parse `sessionStorage.getItem('extractedItems')`, clear the key immediately
- [x] 1.3 If no items found, redirect to `/lesson/new`

## 2. Known items check

- [x] 2.1 Query Supabase `vocabulary_items` for all existing `hebrew` values
- [x] 2.2 Mark each extracted item as `known: true` if its `hebrew` matches an existing row
- [x] 2.3 Handle Supabase query failure silently — default all items to `known: false`

## 3. Review list UI

- [x] 3.1 Render each item as a row with `dir="rtl"` hebrew text, english translation, and a delete button
- [x] 3.2 Known items render with a dimmed style and "Already known" badge
- [x] 3.3 Delete button removes the item from local state only (no network call)

## 3.5 Row editing modal

- [x] 3.5.1 Add `editingIndex: number | null` state; clicking a row (not the delete button) sets it
- [x] 3.5.2 Add `editHebrew` / `editEnglish` controlled input state pre-filled on open
- [x] 3.5.3 Render a fixed full-screen overlay with `backdrop-blur` when `editingIndex !== null`
- [x] 3.5.4 Render an expanded card with RTL hebrew input, english input, Save and X buttons
- [x] 3.5.5 Save: apply edits to items state, close modal; X: close without saving
- [x] 3.5.6 Hebrew text in the list renders as `text-gray-700`

## 4. Confirm flow

- [x] 4.1 Render "Looks good" CTA — disabled when item list is empty
- [x] 4.2 On confirm: POST `{ items }` to `/api/lessons`, show saving state, disable button
- [x] 4.3 On success: redirect to `/`
- [x] 4.4 On failure: show inline error message, re-enable confirm button

## 5. Verification

- [ ] 5.1 Navigate directly to `/lesson/review` — confirm redirect to `/lesson/new`
- [ ] 5.2 Complete full flow from photo upload — confirm items appear with correct known/new labels
- [ ] 5.3 Delete all items — confirm CTA disables
- [ ] 5.4 Confirm with items — confirm POST is made to `/api/lessons`
