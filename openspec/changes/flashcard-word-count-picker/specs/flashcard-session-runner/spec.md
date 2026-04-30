## MODIFIED Requirements

### Requirement: Practice page has three states
The `/practice` page SHALL display one of these states: `lesson-picking`, `count-picking`, `loading`, `running`, `revealed`, or `summary`. The initial state is `lesson-picking` (after lessons are fetched). In `lesson-picking` the page shows the lesson list. In `count-picking` it shows the count selector for the chosen lesson. In `loading` it fetches vocabulary. In `running` and `revealed` it shows the active flashcard. In `summary` it shows session results.

#### Scenario: Page loads in lesson-picking state
- **WHEN** the user navigates to `/practice`
- **THEN** the page fetches `GET /api/lessons` and then shows the lesson list with word counts

#### Scenario: Selecting a lesson moves to count-picking
- **WHEN** the user taps a lesson in the lesson list
- **THEN** the page transitions to the `count-picking` state for that lesson

#### Scenario: Loading state while fetching
- **WHEN** the fetch to `/api/flashcard` is in progress after a count is selected
- **THEN** the page shows a loading indicator

#### Scenario: Fetch fails
- **WHEN** `GET /api/flashcard` returns a non-2xx response
- **THEN** the page shows an error message and returns to the `count-picking` state for the same lesson

### Requirement: Lesson picker shows word count per lesson
In the `lesson-picking` state, the system SHALL display each lesson's word count alongside its title so users can anticipate which count options will be available before selecting.

#### Scenario: Lesson list renders word count
- **WHEN** the lesson-picking screen is shown
- **THEN** each lesson entry displays its word count (e.g. "14 words")
