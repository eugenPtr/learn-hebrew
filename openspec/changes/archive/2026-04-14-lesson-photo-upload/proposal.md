## Why

The app needs an entry point for adding new lessons. Without a photo upload UI, there's no way for the user to feed vocabulary into the system. This is the first screen the user interacts with and the gateway to the entire lesson ingestion flow.

## What Changes

- Create `app/lesson/new/page.tsx` — the photo upload screen
- File input with camera capture support (mobile-first)
- Client-side JPEG conversion via canvas before encoding and POSTing to `/api/extract`
- Loading state while extraction runs
- Navigate to the review screen on success, show error with retry on failure

## Capabilities

### New Capabilities

- `lesson-photo-upload`: The `/lesson/new` page that accepts a photo, converts it to base64 JPEG, POSTs to `/api/extract`, and transitions to the review screen with the extracted items

### Modified Capabilities

## Impact

- New file: `app/lesson/new/page.tsx`
- Calls existing `/api/extract` endpoint
- Passes extracted items to the review screen (EUG-12) via router state
- No new dependencies
