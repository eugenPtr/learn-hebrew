## ADDED Requirements

### Requirement: Load session or resume from localStorage
On mount the page SHALL check `localStorage.currentSession`. If a session exists and is not complete, it SHALL resume from the stored index. Otherwise it SHALL fetch a new session from `GET /api/session` and write it to localStorage.

#### Scenario: Fresh visit fetches new session
- **WHEN** `localStorage.currentSession` is absent
- **THEN** `GET /api/session` is called and the result is written to `localStorage.currentSession`

#### Scenario: Existing incomplete session is resumed
- **WHEN** `localStorage.currentSession` exists and `complete` is false
- **THEN** the session is resumed from `currentIndex` without calling `/api/session`

#### Scenario: Loading screen shown during fetch
- **WHEN** the session is being fetched from `/api/session`
- **THEN** a loading indicator is displayed

### Requirement: Progress bar shows current position
The page SHALL display a progress indicator showing the current exercise number and total (e.g. "12 / 30").

#### Scenario: Progress reflects current index
- **WHEN** the user is on exercise N of M
- **THEN** the progress indicator shows "N / M"

### Requirement: Route to correct exercise component
The page SHALL render the correct component based on `exercise.type`: `ReadingExercise` for `'reading'`, `ListeningExercise` for `'listening'`, `TranslatingExercise` for `'translating'`.

#### Scenario: Reading exercise rendered for type reading
- **WHEN** the current exercise has `type: 'reading'`
- **THEN** `ReadingExercise` is rendered

#### Scenario: Listening exercise rendered for type listening
- **WHEN** the current exercise has `type: 'listening'`
- **THEN** `ListeningExercise` is rendered

#### Scenario: Translating exercise rendered for type translating
- **WHEN** the current exercise has `type: 'translating'`
- **THEN** `TranslatingExercise` is rendered

### Requirement: Accumulate results with mistake-wins merge
After each exercise, the page SHALL update the accumulated results. For each `itemId` in `exercise.wordsUsed`, `mistake` is set to `true` if the exercise was incorrect OR if it was already `true`. `mistake: true` is never overwritten with `false`.

#### Scenario: Incorrect exercise marks focus word as mistake
- **WHEN** `onComplete(false)` is called for an exercise
- **THEN** all `itemId`s in `exercise.wordsUsed` are marked `mistake: true` in accumulated results

#### Scenario: Correct exercise does not overwrite existing mistake
- **WHEN** `onComplete(true)` is called for an exercise whose `focusWordId` was previously marked as a mistake
- **THEN** the `mistake: true` state is preserved

### Requirement: Summary screen after last exercise
After the final exercise the page SHALL show a summary screen with total correct count, total exercises, and a breakdown by exercise type.

#### Scenario: Summary shown after all exercises
- **WHEN** the user completes the last exercise
- **THEN** the summary screen is displayed with a score (e.g. "24 / 30 correct")

### Requirement: Done button flushes results and clears session
The summary screen SHALL have a "Done" button that POSTs deduplicated results to `/api/session/complete`, clears `localStorage.currentSession` on success, and redirects to home.

#### Scenario: Done button posts results and redirects
- **WHEN** the user clicks "Done"
- **THEN** `POST /api/session/complete` is called with deduplicated results
- **THEN** on success, `localStorage.currentSession` is cleared and the user is redirected to `/`

#### Scenario: POST failure shows error without clearing localStorage
- **WHEN** `POST /api/session/complete` fails
- **THEN** an error message is shown and `localStorage.currentSession` is NOT cleared
