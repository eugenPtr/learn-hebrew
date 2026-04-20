## ADDED Requirements

### Requirement: Save confirmed lesson to database
The system SHALL accept a POST request to `/api/lessons` with a list of confirmed vocabulary items and persist them to Supabase, deduplicating against the existing vocabulary bank.

#### Scenario: New items saved successfully
- **WHEN** a POST to `/api/lessons` is made with items whose `hebrew` values do not exist in `vocabulary_items`
- **THEN** a new `lessons` row is created, all items are inserted into `vocabulary_items` with the new `lesson_id`, and the response is `{ lessonId, inserted: N, skipped: 0 }`

#### Scenario: Duplicate items are silently skipped
- **WHEN** a POST to `/api/lessons` includes items whose `hebrew` values already exist in `vocabulary_items` (exact match, trimmed)
- **THEN** those items are not re-inserted, and `skipped` in the response reflects the count of dropped items

#### Scenario: All items are duplicates
- **WHEN** every item in the request already exists in `vocabulary_items`
- **THEN** a `lessons` row is still created, no `vocabulary_items` rows are inserted, and the response is `{ lessonId, inserted: 0, skipped: N }`

#### Scenario: Empty items array
- **WHEN** a POST to `/api/lessons` is made with an empty `items` array
- **THEN** a `lessons` row is created and the response is `{ lessonId, inserted: 0, skipped: 0 }`

#### Scenario: Invalid request body
- **WHEN** a POST to `/api/lessons` is made with a missing or malformed `items` field
- **THEN** the response is `400 Bad Request` with a descriptive error message
