## ADDED Requirements

### Requirement: Save confirmed lesson to database
The system SHALL accept a POST request to `/api/lessons` with a list of confirmed vocabulary items and persist them to Supabase, deduplicating against the existing vocabulary bank. For each net-new item, TTS audio SHALL be generated via `POST /api/tts` and the returned URL stored in `audio_url` on the inserted row.

#### Scenario: New items saved successfully with audio
- **WHEN** a POST to `/api/lessons` is made with items whose `hebrew` values do not exist in `vocabulary_items`
- **THEN** a new `lessons` row is created, all items are inserted into `vocabulary_items` with the new `lesson_id` and `audio_url` populated, and the response is `{ lessonId, inserted: N, skipped: 0 }`

#### Scenario: Duplicate items are silently skipped
- **WHEN** a POST to `/api/lessons` includes items whose `hebrew` values already exist in `vocabulary_items` (exact match, trimmed)
- **THEN** those items are not re-inserted and no TTS call is made for them; `skipped` in the response reflects the count of dropped items

#### Scenario: All items are duplicates
- **WHEN** every item in the request already exists in `vocabulary_items`
- **THEN** a `lessons` row is still created, no `vocabulary_items` rows are inserted, no TTS calls are made, and the response is `{ lessonId, inserted: 0, skipped: N }`

#### Scenario: Empty items array
- **WHEN** a POST to `/api/lessons` is made with an empty `items` array
- **THEN** a `lessons` row is created and the response is `{ lessonId, inserted: 0, skipped: 0 }`

#### Scenario: Invalid request body
- **WHEN** a POST to `/api/lessons` is made with a missing or malformed `items` field
- **THEN** the response is `400 Bad Request` with a descriptive error message

#### Scenario: TTS failure returns 502
- **WHEN** the `/api/tts` call fails for a new item during lesson save
- **THEN** the response is `502 Bad Gateway` and no vocabulary rows are inserted
