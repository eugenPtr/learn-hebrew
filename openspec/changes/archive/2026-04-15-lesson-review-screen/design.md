## Context

The review screen sits between `/lesson/new` (extraction) and `/api/lessons` (save). Extracted items arrive via `sessionStorage` (key: `extractedItems`) — see IMPLEMENTATION_NOTES.md for why sessionStorage was chosen over router state. The screen must also fetch existing vocabulary from Supabase to mark duplicates before the user confirms.

`/api/lessons` is not yet built (EUG-13). The confirm button will POST to it; until it exists the save step will 404. That's acceptable — the review screen can be built and tested independently.

## Goals / Non-Goals

**Goals:**
- Read extracted items from `sessionStorage` on mount, clear after reading
- Query Supabase for existing `hebrew` values and mark matching items as known
- Allow the user to delete individual items before saving
- Allow the user to edit hebrew/english text per row via an inline modal
- Show a disabled CTA if the list is empty
- POST to `/api/lessons` on confirm, redirect home on success, show error on failure

**Non-Goals:**
- Reordering items
- Undo after delete or edit

## Decisions

**`'use client'` component — no server component**
Needs `sessionStorage` on mount and interactive delete state. Nothing to SSR. Same rationale as `/lesson/new`.

**Supabase query on the client using the anon key**
Query `vocabulary_items` directly from the client to get existing hebrew values. No server route needed — this is a read-only lookup with no sensitive data. Alternative: a `/api/known` server route — unnecessary indirection for a simple SELECT.

**Known/new distinction is visual only**
The `known` flag is derived client-side by comparing hebrew values. `/api/lessons` enforces the actual deduplication at save time — the UI is informational only. This keeps the review screen decoupled from the save logic.

**Redirect to `/` on success**
Home screen is the natural destination after saving a lesson. The home screen (EUG-22) isn't built yet — the redirect will land on the default Next.js page for now.

**Row editing via inline modal — no separate route**
Tapping a row opens an expanded card overlay (fixed position, blurred background) with controlled `<input>` fields for hebrew and english. Save applies changes to local state only — the edit is not persisted until the user taps "Looks good". X closes without saving. No route change needed; all state is local. Alternative considered: inline expand within the list — rejected because it pushes other rows down and is harder to dismiss cleanly on mobile.

## Risks / Trade-offs

- [sessionStorage empty] If the user navigates directly to `/lesson/review` without going through `/lesson/new`, `sessionStorage` will be empty → Mitigation: redirect to `/lesson/new` if no items found on mount
- [Supabase query failure] If the known-items lookup fails, the review can still proceed — just show all items as new and let `/api/lessons` handle dedup → Mitigation: catch error silently, default `known: false`
- [/api/lessons not yet built] Confirm button will 404 until EUG-13 is done → Acceptable: screens are built incrementally
