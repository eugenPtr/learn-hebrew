## Why

Users often have lessons that span multiple notebook pages, but the current upload flow only accepts one photo at a time and forces the camera on mobile (blocking gallery access). This forces users to create multiple lessons for what is logically one lesson, and makes it impossible to select existing photos.

## What Changes

- Remove `capture="environment"` from the file input so iOS/Android show the native "Take Photo / Choose from Library" picker
- Add `multiple` to the file input to allow selecting several photos at once
- Replace single-file processing with a sequential loop: convert and extract each photo one by one, showing "Processing photo N of M…" progress
- Merge all extracted vocabulary items from all photos into one flat list
- Pass the merged list to the existing review screen via `sessionStorage.extractedItems` — one lesson regardless of how many photos were used
- Non-blocking per-photo error handling: failed or empty photos are skipped, a warning is shown if any failed

## Capabilities

### New Capabilities

_(none — this change modifies existing upload behaviour only)_

### Modified Capabilities

- `lesson-photo-upload`: Requirements change to support multiple photo selection, gallery access on mobile, and merged extraction results

## Impact

- `app/lesson/new/page.tsx` — all changes are contained here
- `/api/extract` — no changes, called once per photo as today
- Review screen — no changes, receives merged items via `sessionStorage` as today
