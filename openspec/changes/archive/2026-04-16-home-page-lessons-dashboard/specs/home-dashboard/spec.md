## ADDED Requirements

### Requirement: Home page fetches all lessons and vocabulary server-side
The system SHALL fetch all lessons and their associated vocabulary items from Supabase in a single joined query on the server, ordered by `lessons.created_at` ascending (tiebreak: `id` ascending).

#### Scenario: Lessons exist in the database
- **WHEN** the user navigates to `/`
- **THEN** all lessons and their vocabulary items SHALL be loaded server-side before the page is rendered, with no client-side loading spinner

#### Scenario: Supabase query fails
- **WHEN** the Supabase fetch throws an error on the server
- **THEN** the error SHALL propagate and result in a Next.js error boundary (no silent empty state)

### Requirement: Lessons are rendered as a stacked list of expandable cards
The system SHALL render one card per lesson. Each card SHALL display a header with **Lesson N** (where N is the 1-based chronological position). Clicking the header SHALL toggle the card between collapsed (header only) and expanded (header + vocabulary rows).

#### Scenario: Card starts collapsed
- **WHEN** the home page first renders
- **THEN** all lesson cards SHALL be in the collapsed state (vocabulary items not visible)

#### Scenario: User expands a card
- **WHEN** the user clicks a lesson card header
- **THEN** that card SHALL expand to show its vocabulary items and all other cards SHALL remain in their current state

#### Scenario: User collapses an expanded card
- **WHEN** the user clicks the header of an already-expanded card
- **THEN** that card SHALL collapse and hide its vocabulary items

### Requirement: Expanded card shows vocabulary items in read-only rows
The system SHALL render each vocabulary item as a row containing the Hebrew word (bold, large text) and the English translation below it (small, gray text). No edit or delete controls SHALL be present.

#### Scenario: Expanded lesson with vocabulary
- **WHEN** a card is expanded and has vocabulary items
- **THEN** each item SHALL be displayed with Hebrew word prominently styled and English translation in muted small text, with no interactive controls

### Requirement: Empty state when no lessons exist
The system SHALL display a friendly message encouraging the user to add their first lesson when the lessons list is empty.

#### Scenario: No lessons in the database
- **WHEN** the user navigates to `/` and no lessons exist
- **THEN** an empty-state prompt SHALL be shown in place of the cards list, with no error or blank space

### Requirement: Add Lesson button navigates to /lesson/new
The system SHALL display an "Add Lesson" button prominently above the lesson cards. Clicking it SHALL navigate to `/lesson/new`.

#### Scenario: User taps Add Lesson
- **WHEN** the user clicks the "Add Lesson" button
- **THEN** the user SHALL be navigated to `/lesson/new`

### Requirement: Generate Practice Session button is visible but disabled
The system SHALL display a "Generate Practice Session" button at the bottom of the page. The button SHALL be disabled and visually indicate a "coming soon" state (e.g., reduced opacity, disabled cursor).

#### Scenario: User sees the Generate Practice Session button
- **WHEN** the user views the home page
- **THEN** the "Generate Practice Session" button SHALL be visible at the bottom, disabled, and styled to communicate it is not yet functional

#### Scenario: User attempts to click Generate Practice Session
- **WHEN** the user clicks the disabled button
- **THEN** no action SHALL occur
