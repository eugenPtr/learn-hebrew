## ADDED Requirements

### Requirement: Single unified mistake counter on vocabulary items
The `vocabulary_items` table SHALL have a single `mistakes` column of type `integer`, NOT NULL, with a default value of `0`. The three prior columns (`mistakes_reading`, `mistakes_speaking`, `mistakes_typing`) SHALL NOT exist.

#### Scenario: Schema after migration
- **WHEN** the migration has been applied
- **THEN** `vocabulary_items` has a `mistakes integer NOT NULL DEFAULT 0` column
- **THEN** `vocabulary_items` does NOT have `mistakes_reading`, `mistakes_speaking`, or `mistakes_typing` columns

#### Scenario: Existing rows unaffected
- **WHEN** the migration has been applied
- **THEN** all pre-existing rows in `vocabulary_items` are present with all other columns intact
- **THEN** the `mistakes` value for each pre-existing row is `0`
