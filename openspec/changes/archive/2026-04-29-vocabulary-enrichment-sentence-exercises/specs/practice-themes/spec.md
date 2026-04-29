## ADDED Requirements

### Requirement: themes table stores named practice themes with embeddings
The system SHALL create a `themes` table with columns: `id uuid PK`, `name text UNIQUE NOT NULL`, `description text NOT NULL`, `embedding vector(384) NOT NULL`, `created_at timestamptz`. The `embedding` is computed from `description` using `text-embedding-3-small`.

#### Scenario: Theme is queryable by name
- **WHEN** the themes table is queried by `name`
- **THEN** at most one row is returned

#### Scenario: Embedding is stored on theme creation
- **WHEN** a new theme is created
- **THEN** the `embedding` column is populated before the row is written

### Requirement: Six themes are pre-seeded on migration
The system SHALL seed the following themes via migration or seed script. Each theme has a richer description than its name, used for embedding quality.

| Name | Description seed |
|---|---|
| Time | time expressions hours minutes days weeks months morning afternoon evening yesterday today tomorrow soon later |
| Location | location prepositions spatial above below between next to in front behind inside outside near far |
| Question Words | question words interrogative who what when where why how which how much how many |
| Home | home apartment house furniture rooms kitchen bedroom bathroom living room balcony |
| Emotions | emotions feelings happy sad angry excited scared love hate surprised proud ashamed nervous calm |
| Opposite Adjectives | opposite adjective antonym pairs big small hot cold fast slow old new light heavy easy hard |

#### Scenario: All six themes present after migration
- **WHEN** the database migration completes
- **THEN** `SELECT COUNT(*) FROM themes` returns 6

### Requirement: Student can create a custom theme
The system SHALL expose `POST /api/themes` accepting `{ name: string, description?: string }`. If `description` is omitted, `name` is used as the description. The system computes and stores the embedding before responding.

#### Scenario: Custom theme appears in theme list
- **WHEN** a student posts a new theme with a unique name
- **THEN** `GET /api/themes` includes the new theme in subsequent responses

#### Scenario: Duplicate name is rejected
- **WHEN** a student posts a theme with a name that already exists
- **THEN** the response is `409 Conflict`

#### Scenario: Empty name is rejected
- **WHEN** a student posts a theme with an empty or whitespace-only name
- **THEN** the response is `400 Bad Request`

### Requirement: GET /api/themes returns all themes
The system SHALL expose `GET /api/themes` returning all rows ordered by `created_at ASC`. The `embedding` column SHALL NOT be included in the response payload.

#### Scenario: Returns all themes in creation order
- **WHEN** `GET /api/themes` is called
- **THEN** all themes are returned ordered oldest first, without the `embedding` field
