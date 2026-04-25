## Context

All upload logic lives in `app/lesson/new/page.tsx`. The current flow is: one file selected → HEIC-convert if needed → canvas to JPEG → POST to `/api/extract` → navigate to review. The component is self-contained with no shared state.

Two problems: `capture="environment"` bypasses the OS photo picker on mobile (forces camera), and the input is single-select.

## Goals / Non-Goals

**Goals:**
- Allow multiple photos to be selected in one action (camera or gallery)
- Process each photo sequentially through the existing `/api/extract` pipeline
- Merge all results into one flat vocabulary list → one lesson
- Surface partial failures without blocking the user from saving what was found

**Non-Goals:**
- Parallel processing of photos (adds complexity, no meaningful UX benefit)
- Reordering or previewing selected photos before processing
- Changes to `/api/extract`, the review screen, or the save flow

## Decisions

**Remove `capture="environment"` entirely**
On iOS and Android, omitting `capture` causes the OS to show a sheet with both "Take Photo" and "Choose from Library". This is the standard pattern and requires zero extra UI. Alternative (two separate buttons) was rejected as unnecessary complexity.

**Sequential processing**
Process photos one at a time in a `for` loop. This keeps the loading state simple (one progress string, one error accumulator), avoids concurrent OpenAI calls, and makes per-photo error handling straightforward. With typical lesson sizes (2–5 photos) the latency difference vs. parallel is under a second.

**Single merged result → existing review screen**
All `items` arrays are concatenated into one flat list and written to `sessionStorage.extractedItems`. No deduplication — the user can clean up on the review screen. This requires zero changes outside `page.tsx`.

**Non-blocking per-photo errors**
Failed or empty photos increment a `failedCount` counter but do not abort processing. After all photos finish: if the merged list is empty → existing "nothing found" state; if some failed but some succeeded → show results plus a warning banner ("X of N photos processed successfully").

## Risks / Trade-offs

- [Longer total processing time for many photos] → Sequential is slower than parallel, but for the expected 2–5 photo range this is acceptable (~2–5s per photo).
- [Duplicate vocabulary across photos] → Items may repeat if the same word appears in multiple photos. Left to the user to resolve on the review screen.

## Migration Plan

Single file change (`app/lesson/new/page.tsx`). No API changes, no database changes, no other files touched. Rollback = revert the file.
