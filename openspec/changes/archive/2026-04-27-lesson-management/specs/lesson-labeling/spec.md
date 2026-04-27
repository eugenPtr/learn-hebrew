## ADDED Requirements

### Requirement: Lessons have an optional user-set title
The `lessons` table SHALL have a nullable `title text` column. When `title` is null, the UI SHALL display a positional fallback label ("Lesson N", where N is the 1-based chronological position). The title is not required at lesson creation time.

#### Scenario: Lesson with no title displays fallback label
- **WHEN** a lesson has no `title` set
- **THEN** it SHALL be displayed as "Lesson N" where N reflects its chronological order by `created_at` across all lessons

#### Scenario: Lesson with a title displays that title
- **WHEN** a lesson has a non-null `title`
- **THEN** its title SHALL be displayed in place of the positional fallback

### Requirement: GET /api/lessons returns a list of lessons with metadata
The system SHALL expose `GET /api/lessons` returning an array of lesson summaries ordered by `created_at` ascending. Each entry SHALL include `id`, `title` (nullable), `word_count` (integer), and `created_at`.

#### Scenario: Lessons exist
- **WHEN** `GET /api/lessons` is called and lessons exist
- **THEN** the response SHALL be a 200 JSON array with one entry per lesson, each containing `id`, `title`, `word_count`, and `created_at`, ordered by `created_at` ascending

#### Scenario: No lessons exist
- **WHEN** `GET /api/lessons` is called and no lessons exist
- **THEN** the response SHALL be a 200 empty array `[]`

### Requirement: PATCH /api/lessons/[id] updates the lesson title
The system SHALL expose `PATCH /api/lessons/[id]` accepting `{ title: string | null }`. A non-empty string sets the title; null or empty string clears it.

#### Scenario: Set a title
- **WHEN** `PATCH /api/lessons/[id]` is called with `{ "title": "Pronouns" }`
- **THEN** the lesson's `title` SHALL be updated to "Pronouns" and the response SHALL be `{ ok: true }`

#### Scenario: Clear a title
- **WHEN** `PATCH /api/lessons/[id]` is called with `{ "title": null }` or `{ "title": "" }`
- **THEN** the lesson's `title` SHALL be set to `null` and the response SHALL be `{ ok: true }`

#### Scenario: Lesson not found
- **WHEN** `PATCH /api/lessons/[id]` is called with an id that does not exist
- **THEN** the response SHALL be `404 Not Found`
