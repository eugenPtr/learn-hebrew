## Context

The practice runner is a client component that manages the full session lifecycle: load/resume → exercise loop → summary → flush. All state lives in React + localStorage. No mid-session DB writes.

## Goals / Non-Goals

**Goals:**
- Load session from `GET /api/session` on first visit, or resume from `localStorage.currentSession` if present and not complete
- Show a "Preparing your session…" loading screen during fetch (expected 8–15s)
- Progress bar showing current position (e.g. "12 / 30")
- Route to `ReadingExercise`, `ListeningExercise`, or `TranslatingExercise` based on `exercise.type`
- Accumulate per-word mistake state across exercises; merge by `itemId` with `mistake: true` winning
- Summary screen after last exercise: total score, breakdown by type
- "Done" button: deduplicates results, POSTs to `/api/session/complete`, clears localStorage, redirects to home

**Non-Goals:**
- Mid-session DB writes
- Recovering un-submitted results after tab close
- Showing word-level highlighting (future enhancement)

## Decisions

**localStorage shape:**
```ts
type StoredSession = {
  exercises: Exercise[]       // full array from /api/session
  currentIndex: number        // which exercise is active
  results: Record<string, boolean>  // itemId → mistake (true = mistake ever)
  complete: boolean
}
```

**Exercise component `onComplete(correct: boolean)` → word results** — Our exercise components return a single `correct` boolean. The runner derives word-level results from `exercise.wordsUsed`: if `correct === false`, all `wordsUsed` items are marked as mistakes; if `correct === true`, none are. This is a v1 approximation — good enough for the scoring signal.

**Merge strategy** — `mistake: true` wins. Once a word is marked as a mistake in any exercise, it stays a mistake regardless of later correct answers.

**`'use client'`** — All session state, localStorage access, and dynamic rendering require a client component. The page exports a default client component directly (no server wrapper needed).

**Redirect after submit** — Use `router.push('/')` after successful POST to `/api/session/complete`.

## Risks / Trade-offs

- **Session fetch fails** → Show error state with a retry button.
- **`/api/session/complete` POST fails** → Show error, keep localStorage intact so the user can retry.
- **Page is a pure client component** → No SSR for this route. Acceptable — it's a dynamic, interactive page.
