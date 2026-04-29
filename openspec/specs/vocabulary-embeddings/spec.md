## ADDED Requirements

### Requirement: vocabulary_items stores a 1536-dim embedding vector
The system SHALL add an `embedding vector(384)` column to `vocabulary_items`. The embedding is computed from the English gloss using the Supabase `gte-small` model via a Supabase Edge Function (`supabase/functions/embed`). A `ivfflat` index on `embedding` using cosine distance SHALL be created for efficient similarity search.

#### Scenario: Embedding is stored on word insert
- **WHEN** a new vocabulary item is inserted via `POST /api/lessons/[id]/words`
- **THEN** `embedding` is populated before the row is written to the database

#### Scenario: Embedding is regenerated when English changes
- **WHEN** a `PATCH /api/vocabulary-items/[id]` changes the `english` field
- **THEN** a new embedding is computed and stored

### Requirement: Vector similarity search retrieves words relevant to a theme
The system SHALL support retrieving vocabulary items ordered by cosine similarity to a query embedding. This is used by the sentence exercise generation flow to find words relevant to the selected theme.

#### Scenario: Nearest items to a theme embedding are returned
- **WHEN** a theme's embedding is used as a query vector
- **THEN** vocabulary items are returned ordered by cosine distance ascending (most similar first)

#### Scenario: Limit is respected
- **WHEN** a similarity search is requested with `LIMIT 20`
- **THEN** at most 20 items are returned regardless of vocabulary size
