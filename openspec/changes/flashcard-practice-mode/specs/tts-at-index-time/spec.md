## ADDED Requirements

### Requirement: vocabulary_items has an audio_url column
The `vocabulary_items` table SHALL have an `audio_url text` column, nullable, with no default. Existing rows have `audio_url = null`.

#### Scenario: Column exists after migration
- **WHEN** the DB migration has been applied
- **THEN** `vocabulary_items` has an `audio_url text` column that accepts null

#### Scenario: Existing rows are unaffected
- **WHEN** the migration has been applied
- **THEN** all pre-existing rows have `audio_url = null`

### Requirement: POST /api/lessons generates TTS for each new vocabulary item
For each net-new vocabulary item (those not skipped as duplicates), `POST /api/lessons` SHALL call `POST /api/tts` with the item's `hebrew` text and store the returned `audioUrl` in the `audio_url` column of the inserted row.

#### Scenario: New items get audio_url populated
- **WHEN** a POST to `/api/lessons` inserts new vocabulary items
- **THEN** each inserted row has `audio_url` set to the public MP3 URL returned by `/api/tts`

#### Scenario: Duplicate items are not re-processed for TTS
- **WHEN** a POST to `/api/lessons` skips an item because its `hebrew` value already exists
- **THEN** no TTS call is made for that item and the existing row is not modified

#### Scenario: TTS failure causes lessons POST to fail
- **WHEN** the `/api/tts` call for a new item returns a non-2xx response
- **THEN** the `POST /api/lessons` response is `502 Bad Gateway` and no rows are inserted for that item

#### Scenario: TTS cache hit does not re-generate audio
- **WHEN** `/api/tts` is called with a Hebrew string that has already been processed
- **THEN** the existing cached MP3 URL is returned without calling the OpenAI TTS API
