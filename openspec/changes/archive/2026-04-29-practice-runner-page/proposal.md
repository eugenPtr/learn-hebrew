## Why

All three exercise components exist. The `/practice` page is the runner that wires them together: loads (or resumes) a session, routes to the right component, accumulates results, and flushes to the DB at the end. This is the last piece before M2 is functional end-to-end.

## What Changes

- Add `app/practice/page.tsx` — client page that orchestrates the full practice session flow

## Capabilities

### New Capabilities
- `practice-session-runner`: Load or resume a session from localStorage, render the correct exercise component, track per-word mistake state, show a summary screen, and flush results to `/api/session/complete`

### Modified Capabilities
<!-- No existing spec-level behavior changes -->

## Impact

- New file: `app/practice/page.tsx`
- Depends on: `ReadingExercise`, `ListeningExercise`, `TranslatingExercise` components, `GET /api/session`, `POST /api/session/complete`
- localStorage key: `currentSession`
