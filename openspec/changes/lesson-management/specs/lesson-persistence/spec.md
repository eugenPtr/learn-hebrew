## MODIFIED Requirements

### Requirement: Save confirmed lesson to database
The system SHALL accept a POST request to `/api/lessons` with a list of confirmed vocabulary items and persist them to Supabase, deduplicating against the existing vocabulary bank by Hebrew text (trimmed, normalized). For each net-new item, TTS audio SHALL be generated via `POST /api/tts` and the returned URL stored in `audio_url` on the inserted row. For items whose Hebrew already exists in another lesson, ownership SHALL be transferred: the existing item's `lesson_id` is updated to the new lesson and its `english` updated to the incoming value; no TTS call is made for these items.

#### Scenario: New items saved successfully with audio
- **WHEN** a POST to `/api/lessons` is made with items whose `hebrew` values do not exist in `vocabulary_items`
- **THEN** a new `lessons` row is created, all items are inserted into `vocabulary_items` with the new `lesson_id` and `audio_url` populated, and the response is `{ lessonId, inserted: N, transferred: 0, skipped: 0 }`

#### Scenario: Duplicate items in another lesson trigger ownership transfer
- **WHEN** a POST to `/api/lessons` includes items whose `hebrew` values already exist in `vocabulary_items` under a different lesson
- **THEN** those existing items' `lesson_id` SHALL be updated to the new lesson, their `english` updated to the incoming value, no TTS call is made, and `transferred` in the response reflects the count of moved items

#### Scenario: Duplicate items in the same lesson are skipped
- **WHEN** a POST to `/api/lessons` includes items whose `hebrew` values already belong to the same new lesson (edge case: re-submitting)
- **THEN** those items are not re-inserted and `skipped` in the response reflects the count

#### Scenario: All items are duplicates from other lessons
- **WHEN** every item in the request already exists in `vocabulary_items` under other lessons
- **THEN** a `lessons` row is still created, all existing items are transferred to it, no TTS calls are made, and the response is `{ lessonId, inserted: 0, transferred: N, skipped: 0 }`

#### Scenario: Empty items array
- **WHEN** a POST to `/api/lessons` is made with an empty `items` array
- **THEN** a `lessons` row is created and the response is `{ lessonId, inserted: 0, transferred: 0, skipped: 0 }`

#### Scenario: Invalid request body
- **WHEN** a POST to `/api/lessons` is made with a missing or malformed `items` field
- **THEN** the response is `400 Bad Request` with a descriptive error message

#### Scenario: TTS failure returns 502
- **WHEN** the `/api/tts` call fails for a net-new item during lesson save
- **THEN** the response is `502 Bad Gateway` and no vocabulary rows are inserted
