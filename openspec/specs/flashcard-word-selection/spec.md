## MODIFIED Requirements

### Requirement: GET /api/flashcard returns N selected vocabulary items
The system SHALL expose a `GET /api/flashcard?count=N` endpoint that returns an array of vocabulary items selected by the active strategy. `count` defaults to 10 if not provided. The pool of eligible items SHALL include all vocabulary items regardless of `pos`, including items where `pos = 'phrase'`.

#### Scenario: Returns requested count
- **WHEN** `GET /api/flashcard?count=20` is called
- **THEN** the response is `200 OK` with a JSON array of up to 20 vocabulary items

#### Scenario: Returns fewer than count when vocabulary is small
- **WHEN** the vocabulary has fewer items than `count`
- **THEN** all available items are returned without error

#### Scenario: Invalid count returns 400
- **WHEN** `GET /api/flashcard?count=0` or a non-numeric value is provided
- **THEN** the response is `400 Bad Request`

#### Scenario: Default count is 10
- **WHEN** `GET /api/flashcard` is called with no `count` parameter
- **THEN** up to 10 items are returned

#### Scenario: Phrase items appear in flashcard pool
- **WHEN** vocabulary items with `pos = 'phrase'` exist (e.g. "איזה כיף" / "So fun!")
- **THEN** those items are eligible for selection and may be returned by `GET /api/flashcard`
