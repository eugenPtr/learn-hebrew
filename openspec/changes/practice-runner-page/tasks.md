## 1. Page scaffold and session loading

- [x] 1.1 Create `app/practice/page.tsx` as a `'use client'` component with loading/error/session states
- [x] 1.2 On mount: check `localStorage.currentSession` — resume if present and not complete
- [x] 1.3 Otherwise fetch `GET /api/session`, write result to `localStorage.currentSession`
- [x] 1.4 Show "Preparing your session…" loading screen during fetch; show error state on failure

## 2. Exercise runner

- [x] 2.1 Render progress bar showing "currentIndex + 1 / total"
- [x] 2.2 Route current exercise to `ReadingExercise`, `ListeningExercise`, or `TranslatingExercise` by `exercise.type`
- [x] 2.3 On `onComplete(correct)`: derive word results from `exercise.wordsUsed`, merge into accumulated results (mistake: true wins), advance index, persist to localStorage

## 3. Summary screen and flush

- [x] 3.1 After last exercise, show summary: total score, breakdown by type
- [x] 3.2 "Done" button: POST deduplicated results to `/api/session/complete`
- [x] 3.3 On success: clear `localStorage.currentSession`, redirect to `/`
- [x] 3.4 On POST failure: show error message, keep localStorage intact
