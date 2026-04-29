## MODIFIED Requirements

### Requirement: Practice page has three states
The `/practice` page SHALL display one of these states: `picking`, `loading`, `running`, `revealed`, or `summary`. The initial state is `picking`. In the `picking` state the page shows a lesson list. In `loading` it fetches vocabulary. In `running` and `revealed` it shows the active flashcard. In `summary` it shows session results.

#### Scenario: Page loads in picking state
- **WHEN** the user navigates to `/practice`
- **THEN** the page shows the lesson list fetched from `GET /api/lessons`

#### Scenario: Loading state while fetching
- **WHEN** the fetch to `/api/flashcard` is in progress after a lesson is selected
- **THEN** the page shows a loading indicator

#### Scenario: Fetch fails
- **WHEN** `GET /api/flashcard` returns a non-2xx response
- **THEN** the page shows an error message and returns to the `picking` state

### Requirement: Lesson picker replaces word count picker
In the `picking` state, the system SHALL render the shared `LessonList` component with an `onSelect` handler. Selecting a lesson immediately fetches `GET /api/flashcard?lessonId=<id>` and starts the session.

#### Scenario: User selects a lesson
- **WHEN** the user clicks a lesson in the picker
- **THEN** the page fetches `GET /api/flashcard?lessonId=<id>` and transitions to the `running` state

#### Scenario: Lesson with no vocabulary shows error
- **WHEN** the API returns an empty array for the selected lesson
- **THEN** an error message is shown and the user remains on the `picking` state

## ADDED Requirements

### Requirement: Summary screen has a "Generate sentences with these words" button
In the `summary` state, the system SHALL display a "Generate sentences with these words" button alongside the existing "Done" button. Clicking it SHALL navigate to `/practice/sentences?itemIds=id1,id2,...` using the unique item IDs from the completed session.

#### Scenario: Button navigates to sentences practice with session item IDs
- **WHEN** the user clicks "Generate sentences with these words" on the summary screen
- **THEN** the user is navigated to `/practice/sentences` with all unique item IDs from the session as the `itemIds` query parameter

#### Scenario: Button deduplicates item IDs
- **WHEN** the session results contain repeated item IDs (due to re-queued mistake cards)
- **THEN** the `itemIds` query parameter contains each ID only once
