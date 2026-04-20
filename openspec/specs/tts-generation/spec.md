## Requirements

### Requirement: Accept Hebrew text and return audio URL
The system SHALL expose a `POST /api/tts` endpoint that accepts a JSON body `{ text: string }` and returns `{ audioUrl: string }` pointing to a publicly accessible MP3 file.

#### Scenario: Valid text generates audio URL
- **WHEN** a POST request is made to `/api/tts` with `{ "text": "שלום" }`
- **THEN** the response is `200 OK` with `{ "audioUrl": "https://...supabase.co/storage/v1/object/public/tts-audio/<hash>.mp3" }`

#### Scenario: Missing text field returns 400
- **WHEN** a POST request is made to `/api/tts` with an empty body or missing `text` field
- **THEN** the response is `400 Bad Request` with `{ "error": "Missing text field" }`

### Requirement: Cache audio by SHA-256 hash of text
The system SHALL use `sha256(text)` as the MP3 filename so identical sentences reuse the same cached file across sessions without incurring additional TTS cost.

#### Scenario: Repeated sentence returns existing URL without calling OpenAI
- **WHEN** `/api/tts` is called twice with the same `text` value
- **THEN** the second call returns the same `audioUrl` as the first, and no OpenAI TTS API call is made on the second request

#### Scenario: Different text produces different file
- **WHEN** `/api/tts` is called with two distinct Hebrew strings
- **THEN** each returns a different `audioUrl` pointing to separate MP3 files

### Requirement: Upload MP3 to Supabase Storage tts-audio bucket
The system SHALL upload the OpenAI TTS audio bytes as `audio/mpeg` to the `tts-audio` Supabase Storage bucket at path `{sha256(text)}.mp3` using a service-role client.

#### Scenario: File is stored and publicly accessible
- **WHEN** a new sentence is processed
- **THEN** a GET request to the returned `audioUrl` responds with `200 OK` and `Content-Type: audio/mpeg`

#### Scenario: Existing file is not re-uploaded
- **WHEN** the hash-named file already exists in the `tts-audio` bucket
- **THEN** the upload is skipped and the existing public URL is returned immediately

### Requirement: Use OpenAI TTS model tts-1 with alloy voice
The system SHALL call the OpenAI TTS API with model `tts-1` and voice `alloy` for all audio generation.

#### Scenario: Audio is generated with correct model and voice
- **WHEN** a new sentence is processed
- **THEN** the OpenAI API is called with `model: "tts-1"` and `voice: "alloy"`
