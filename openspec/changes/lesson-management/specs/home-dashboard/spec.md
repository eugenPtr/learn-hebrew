## MODIFIED Requirements

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

## REMOVED Requirements

### Requirement: Lessons are rendered as a stacked list of expandable cards
**Reason**: Cards now navigate to the detail page instead of expanding in-place.
**Migration**: No user-facing migration needed; expand behavior is replaced by navigation.

### Requirement: Expanded card shows vocabulary items in read-only rows
**Reason**: Vocabulary is now shown on the lesson detail page at `/lesson/[id]`, not inline in the dashboard.
**Migration**: Users access vocabulary by tapping the lesson card.
