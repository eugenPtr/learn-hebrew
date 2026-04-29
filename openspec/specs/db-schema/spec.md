## ADDED Requirements

### Requirement: lessons table exists
The system SHALL have a `lessons` table in Supabase with columns `id` (uuid, primary key, default gen_random_uuid()) and `created_at` (timestamptz, default now()).

#### Scenario: Table is present after migration
- **WHEN** the SQL migration has been applied
- **THEN** the `lessons` table SHALL exist in the Supabase Table Editor with the correct columns

### Requirement: vocabulary_items table exists
The system SHALL have a `vocabulary_items` table in Supabase with columns: `id` (uuid PK), `lesson_id` (uuid FK → lessons.id), `hebrew` (text NOT NULL), `english` (text NOT NULL), `number_used` (integer NOT NULL default 0), `mistakes_reading` (integer NOT NULL default 0), `mistakes_speaking` (integer NOT NULL default 0), `mistakes_typing` (integer NOT NULL default 0), `last_used_at` (timestamptz), `last_mistake_at` (timestamptz), `created_at` (timestamptz default now()).

#### Scenario: Test row inserts and reads back correctly
- **WHEN** a row is inserted into `vocabulary_items` with `hebrew` and `english` values
- **THEN** the row SHALL be retrievable with all counter columns at their default values (0 / NULL)

#### Scenario: Counter increment is atomic
- **WHEN** a session completes and updates `mistakes_reading = mistakes_reading + 1`
- **THEN** the counter SHALL reflect the incremented value on the next read

### Requirement: session_results table exists
The system SHALL have a `session_results` table in Supabase with columns: `id` (uuid PK), `completed_at` (timestamptz default now()), `results` (jsonb NOT NULL).

#### Scenario: Session result row with JSONB results
- **WHEN** a row is inserted into `session_results` with a `results` array of `{item_id, exercise_type, correct}` objects
- **THEN** the row SHALL be retrievable and the `results` JSONB SHALL match what was inserted
