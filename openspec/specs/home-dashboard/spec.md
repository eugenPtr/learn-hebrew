### Requirement: Home page fetches all lessons with title and word count server-side
The system SHALL fetch all lessons from Supabase on the server, ordered by `created_at` ascending (tiebreak: `id` ascending), including each lesson's `id`, `title`, `created_at`, and a `word_count` aggregate. Vocabulary items SHALL NOT be joined in this query; they are loaded separately by the detail page.

#### Scenario: Lessons exist in the database
- **WHEN** the user navigates to `/`
- **THEN** all lessons SHALL be loaded server-side with their title and word count, with no client-side loading spinner

#### Scenario: Supabase query fails
- **WHEN** the Supabase fetch throws an error on the server
- **THEN** the error SHALL propagate and result in a Next.js error boundary (no silent empty state)

### Requirement: Lessons are rendered as a stacked list of navigable cards
The system SHALL render one card per lesson. Each card SHALL display the lesson's title (or "Lesson N" fallback where N is the 1-based chronological position) and its word count. Tapping a card SHALL navigate to `/lesson/[id]`. Cards SHALL NOT expand in-place.

#### Scenario: User taps a lesson card
- **WHEN** the user taps a lesson card on the dashboard
- **THEN** the user SHALL be navigated to `/lesson/[id]` for that lesson

#### Scenario: Lesson with no title shows fallback
- **WHEN** a lesson card has no title set
- **THEN** it SHALL display the positional label "Lesson N" and its word count

#### Scenario: Lesson with a title shows that title
- **WHEN** a lesson card has a title set
- **THEN** it SHALL display the title and its word count

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
