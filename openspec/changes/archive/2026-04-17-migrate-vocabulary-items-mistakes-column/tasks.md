## 1. Run the migration

- [ ] 1.1 Apply the ALTER TABLE migration to `vocabulary_items` via Supabase MCP

## 2. Verify schema

- [ ] 2.1 Confirm `mistakes_reading`, `mistakes_speaking`, `mistakes_typing` columns no longer exist
- [ ] 2.2 Confirm `mistakes` column exists with type `integer`, default `0`, NOT NULL

## 3. Verify data integrity

- [ ] 3.1 Confirm all pre-existing rows are present with other columns intact and `mistakes = 0`
