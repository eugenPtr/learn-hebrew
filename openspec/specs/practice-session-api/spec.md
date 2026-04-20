## ADDED Requirements

### Requirement: GET /api/session returns a complete exercise array
The endpoint SHALL accept optional query params `lessonId` (UUID) and `wordCount` (integer, default 10) and return a JSON array of `Exercise` objects, one per focused word per exercise type (default: 30 exercises for 10 words × 3 types).

#### Scenario: Default request returns 30 exercises
- **WHEN** `GET /api/session` is called with no query params
- **THEN** the response is `200 OK` with a JSON array of 30 `Exercise` objects (10 focused words × 3 types)

#### Scenario: wordCount param is respected
- **WHEN** `GET /api/session?wordCount=5` is called
- **THEN** the response contains 15 exercises (5 words × 3 types)

#### Scenario: lessonId param targets the correct lesson
- **WHEN** `GET /api/session?lessonId=<uuid>` is called with a valid lesson ID
- **THEN** all `focusWordId` values in the response belong to vocabulary items from that lesson

#### Scenario: Missing lessonId falls back to most recently created lesson
- **WHEN** `GET /api/session` is called with no `lessonId`
- **THEN** the focused lesson is the one with the most recent `created_at` in the `lessons` table

### Requirement: Each Exercise has the correct shape
Every element in the returned array SHALL conform to the `Exercise` type with all required fields present.

#### Scenario: Exercise fields are present and non-empty
- **WHEN** the response array is received
- **THEN** each element has `type` (one of `reading`, `listening`, `translating`), `focusWordId` (string), `hebrewSentence` (non-empty string), `englishSentence` (non-empty string), `wordsUsed` (non-empty array), and `audioUrl` (non-empty string)

### Requirement: Exercises are shuffled with no two consecutive same type or focusWordId
The returned array SHALL be ordered such that no two adjacent exercises share the same `type` or `focusWordId`.

#### Scenario: No consecutive same type
- **WHEN** the response array is received
- **THEN** for every pair of adjacent exercises, `exercises[i].type !== exercises[i+1].type`

#### Scenario: No consecutive same focusWordId
- **WHEN** the response array is received
- **THEN** for every pair of adjacent exercises, `exercises[i].focusWordId !== exercises[i+1].focusWordId`

### Requirement: Each exercise has a working audioUrl
Every `Exercise` SHALL have an `audioUrl` pointing to a publicly accessible MP3 of the Hebrew sentence, generated via `/api/tts`.

#### Scenario: audioUrl is a valid Supabase storage URL
- **WHEN** the response array is received
- **THEN** each `audioUrl` is a non-empty string matching the Supabase storage public URL pattern

### Requirement: Invalid lessonId returns 400
If a `lessonId` is provided but does not exist in the `lessons` table, the endpoint SHALL return `400 Bad Request`.

#### Scenario: Unknown lessonId
- **WHEN** `GET /api/session?lessonId=00000000-0000-0000-0000-000000000000` is called
- **THEN** the response is `400 Bad Request` with a descriptive error message
