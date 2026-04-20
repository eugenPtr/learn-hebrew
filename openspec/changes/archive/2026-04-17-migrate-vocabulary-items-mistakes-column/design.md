## Context

`vocabulary_items` has three dead columns (`mistakes_reading`, `mistakes_speaking`, `mistakes_typing`) from a prior exercise model. The new model needs a single `mistakes` counter. The migration is a straightforward `ALTER TABLE` — drop the old columns, add the new one.

## Goals / Non-Goals

**Goals:**
- Remove the three split mistake columns from `vocabulary_items`
- Add a single `mistakes integer NOT NULL DEFAULT 0` column
- Ensure existing rows are unaffected

**Non-Goals:**
- Migrating historical mistake data (the old columns tracked deprecated exercise types; the data is not meaningful to carry forward)
- Updating application code (handled in subsequent M2 tasks)

## Decisions

**Single migration statement over multiple steps** — The `ALTER TABLE` drops all three columns and adds the new one atomically. Simpler and safer than splitting into separate statements.

**Default 0, NOT NULL** — All vocabulary items start with zero mistakes in the new model. The constraint prevents nulls from leaking in.

**No data migration** — The old columns tracked exercise types that no longer exist. Summing them into `mistakes` would produce misleading values. Starting fresh at 0 is correct.

## Risks / Trade-offs

- **Irreversible** → No rollback once applied in production. Verify against staging or dev before applying to production.
- **App code references old columns** → Any query still referencing `mistakes_reading/speaking/typing` will error after migration. Audit before applying.

## Migration Plan

1. Apply SQL via Supabase MCP (or SQL editor)
2. Verify schema in Table Editor
3. Verify existing rows intact with `mistakes = 0`
