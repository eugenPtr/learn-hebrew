## ADDED Requirements

### Requirement: Flashcard picker shows lesson list
The flashcard picking screen SHALL display all lessons as selectable items using the shared `LessonList` component. Each item SHALL show the lesson title (or "Lesson N" fallback) and word count. Selecting a lesson immediately starts the session.

#### Scenario: Picker loads with lesson list
- **WHEN** the user navigates to `/practice`
- **THEN** the page fetches all lessons and renders them as a list of selectable items

#### Scenario: User selects a lesson
- **WHEN** the user clicks a lesson in the picker
- **THEN** the page fetches `GET /api/flashcard?lessonId=<id>` and transitions to the running state

#### Scenario: Empty lesson list
- **WHEN** no lessons exist in the database
- **THEN** a message is shown prompting the user to add a lesson first, and no session can be started

### Requirement: GET /api/flashcard accepts optional lessonId
The `GET /api/flashcard` endpoint SHALL accept an optional `lessonId` query parameter. When provided, vocabulary items SHALL be filtered to those belonging to that lesson before applying the selection algorithm. When absent, the existing behavior (all vocabulary items) is preserved.

#### Scenario: lessonId provided returns lesson-scoped items
- **WHEN** `GET /api/flashcard?lessonId=<id>` is called
- **THEN** only vocabulary items whose `lesson_id` matches are candidates for selection

#### Scenario: lessonId absent uses all vocabulary
- **WHEN** `GET /api/flashcard` is called without `lessonId`
- **THEN** all vocabulary items are candidates (existing behavior unchanged)

#### Scenario: lessonId references a lesson with no vocabulary
- **WHEN** `GET /api/flashcard?lessonId=<id>` is called for a lesson with zero vocabulary items
- **THEN** the response is an empty array and the UI shows an error message

#### Scenario: lessonId references an unknown lesson
- **WHEN** `GET /api/flashcard?lessonId=<id>` is called with an ID that does not exist
- **THEN** the response is an empty array (the filter produces no results)

### Requirement: Shared LessonList component
The system SHALL provide a `LessonList` component that renders a list of lesson items. When an `onSelect` callback prop is provided, each item SHALL render as a `<button>` invoking `onSelect(lesson)`. When `onSelect` is absent, each item SHALL render as a `<Link href="/lesson/[id]">`.

#### Scenario: Used in flashcard picker (onSelect provided)
- **WHEN** `LessonList` is rendered with an `onSelect` prop
- **THEN** each lesson renders as a clickable button that invokes `onSelect` with the lesson data

#### Scenario: Used in home dashboard (onSelect absent)
- **WHEN** `LessonList` is rendered without an `onSelect` prop
- **THEN** each lesson renders as a navigation link to `/lesson/[id]`
