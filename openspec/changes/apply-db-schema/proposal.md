## Why

The Hebrew Learning App needs a persistent data layer before any feature can be built. The three core tables — `lessons`, `vocabulary_items`, and `session_results` — are the foundation everything else depends on; nothing else can be implemented until they exist and are verified.

## What Changes

- Create `lessons` table: groups vocabulary into lesson sets
- Create `vocabulary_items` table: stores Hebrew/English pairs with per-exercise mistake counters and recency tracking
- Create `session_results` table: persists exercise session outcomes as JSONB
- Verify schema by inserting and reading back a test row

## Capabilities

### New Capabilities

- `db-schema`: The three-table Supabase schema (`lessons`, `vocabulary_items`, `session_results`) that underpins all app data storage and retrieval

### Modified Capabilities

## Impact

- Supabase project: new tables added via SQL migration
- No application code changes — this is schema-only
- All future features (lesson management, vocabulary practice, session tracking) depend on these tables existing
