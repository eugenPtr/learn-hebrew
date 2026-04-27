## ADDED Requirements

### Requirement: GET /api/lessons/[id] returns a lesson with its vocabulary items
The system SHALL expose `GET /api/lessons/[id]` returning the lesson's `id`, `title`, `created_at`, and its full `vocabulary_items` array (each with `id`, `hebrew`, `english`, `audio_url`).

#### Scenario: Lesson exists with words
- **WHEN** `GET /api/lessons/[id]` is called for an existing lesson
- **THEN** the response SHALL be 200 JSON with `id`, `title`, `created_at`, and `vocabulary_items` array

#### Scenario: Lesson not found
- **WHEN** `GET /api/lessons/[id]` is called with an id that does not exist
- **THEN** the response SHALL be `404 Not Found`

### Requirement: POST /api/lessons/[id]/words adds a word to a lesson
The system SHALL accept `POST /api/lessons/[id]/words` with `{ hebrew: string, english: string }`. Hebrew text is trimmed and normalized before deduplication. If the Hebrew already exists in the same lesson, no change occurs and `{ ok: true, action: "no-op" }` is returned. If it exists in a different lesson, that item's `lesson_id` and `english` are updated and `{ ok: true, action: "transferred", itemId }` is returned. If it does not exist, a new item is inserted with TTS generated and `{ ok: true, action: "inserted", itemId }` is returned.

#### Scenario: Word is new — inserted with TTS
- **WHEN** `POST /api/lessons/[id]/words` is called with a Hebrew value not present in `vocabulary_items`
- **THEN** a new `vocabulary_items` row is inserted with `lesson_id` set to the current lesson, TTS is generated for the Hebrew text, and `audio_url` is populated

#### Scenario: Word exists in a different lesson — ownership transferred
- **WHEN** `POST /api/lessons/[id]/words` is called with a Hebrew value that exists in another lesson
- **THEN** that item's `lesson_id` SHALL be updated to the current lesson and its `english` updated to the incoming value; no TTS call is made; the response includes `action: "transferred"`

#### Scenario: Word already exists in the same lesson — no-op
- **WHEN** `POST /api/lessons/[id]/words` is called with a Hebrew value already belonging to the current lesson
- **THEN** no database writes occur and the response is `{ ok: true, action: "no-op" }`

#### Scenario: Lesson not found
- **WHEN** `POST /api/lessons/[id]/words` is called with an id that does not exist
- **THEN** the response SHALL be `404 Not Found`

#### Scenario: Invalid body
- **WHEN** `POST /api/lessons/[id]/words` is called with a missing or non-string `hebrew` or `english`
- **THEN** the response SHALL be `400 Bad Request`

### Requirement: PATCH /api/vocabulary-items/[id] edits a word's Hebrew and/or English
The system SHALL accept `PATCH /api/vocabulary-items/[id]` with `{ hebrew?: string, english?: string }`. If `hebrew` is provided and differs from the stored value (normalized), deduplication runs: if the new Hebrew exists in a different item, that item claims the edit (ownership transfer — current item is deleted, the existing item's `lesson_id` and `english` are updated to the current item's lesson and the incoming english value). If the new Hebrew is unique, the current item's `hebrew` is updated and TTS is regenerated. If only `english` changes, it is updated with no TTS call.

#### Scenario: English-only edit
- **WHEN** `PATCH /api/vocabulary-items/[id]` is called with only `english` changed
- **THEN** the item's `english` SHALL be updated and no TTS call SHALL be made

#### Scenario: Hebrew changed, no conflict
- **WHEN** `PATCH /api/vocabulary-items/[id]` is called with a new `hebrew` value not present in any other item
- **THEN** the item's `hebrew` SHALL be updated, TTS SHALL be regenerated, and `audio_url` updated

#### Scenario: Hebrew changed to a value that exists in another item — ownership transfer
- **WHEN** `PATCH /api/vocabulary-items/[id]` is called with a new `hebrew` that already exists in a different vocabulary item
- **THEN** the existing item's `lesson_id` SHALL be updated to the current item's lesson, the existing item's `english` SHALL be updated to the incoming value, the current item SHALL be deleted, and no TTS call is made

#### Scenario: Hebrew changed to the same value (normalized) — no-op on Hebrew
- **WHEN** `PATCH /api/vocabulary-items/[id]` is called with a `hebrew` that normalizes to the same stored value
- **THEN** the Hebrew field and audio SHALL not be updated; only English is updated if provided

#### Scenario: Item not found
- **WHEN** `PATCH /api/vocabulary-items/[id]` is called with an id that does not exist
- **THEN** the response SHALL be `404 Not Found`

### Requirement: DELETE /api/vocabulary-items/[id] removes a word from its lesson
The system SHALL accept `DELETE /api/vocabulary-items/[id]` and remove the vocabulary item. The parent lesson is not affected.

#### Scenario: Item deleted successfully
- **WHEN** `DELETE /api/vocabulary-items/[id]` is called for an existing item
- **THEN** the item SHALL be removed from `vocabulary_items` and the response SHALL be `{ ok: true }`

#### Scenario: Item not found
- **WHEN** `DELETE /api/vocabulary-items/[id]` is called with an id that does not exist
- **THEN** the response SHALL be `404 Not Found`
