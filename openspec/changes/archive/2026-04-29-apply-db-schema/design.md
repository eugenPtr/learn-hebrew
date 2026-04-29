## Context

The Hebrew Learning App has no database tables yet. Supabase is the chosen backend. All three tables are independent of any application code — they must exist before any feature can be built or tested. The schema is already fully specified in EUG-6 and requires no iteration.

## Goals / Non-Goals

**Goals:**
- Apply the SQL for `lessons`, `vocabulary_items`, and `session_results` to the Supabase project
- Verify the tables exist and accept data correctly
- Establish the counter-increment pattern used at end of session

**Non-Goals:**
- Application code (API clients, hooks, components) — out of scope for this change
- Row-level security policies — deferred to a later security hardening change
- Seed data beyond a single verification row

## Decisions

**Counters on the item row, not in a separate event log**
Performance metrics (`number_used`, `mistakes_reading`, `mistakes_speaking`, `mistakes_typing`) are stored directly on `vocabulary_items` rather than as an append-only event log. This keeps session writes to a single `UPDATE` per item and queries trivial (no aggregation). The trade-off is that raw event history is lost, but the app's selection algorithm only needs aggregate signal, not replay capability.

**Split mistake counters by exercise type**
Three separate columns (`mistakes_reading`, `mistakes_speaking`, `mistakes_typing`) rather than one total. Rationale: failing speaking but passing reading indicates a production problem, not a comprehension problem — a future selection algorithm will need this distinction to prioritize effectively.

**`last_used_at` and `last_mistake_at` recency columns**
Stored on the row to avoid scanning history for spaced-repetition recency signals. No alternative considered — this is the minimal approach given the counter-only model.

**JSONB for `session_results.results`**
Session outcomes are stored as `[{item_id, exercise_type, correct: bool}]` JSONB. This avoids a fourth junction table while keeping the session record self-contained. Query flexibility on individual results is not required at this stage.

**Migration via Supabase SQL editor (not a migration file)**
This is a greenfield schema with no existing data. A raw SQL apply is sufficient. Formal migration tooling (e.g., `supabase db push`) is not yet set up and would add unnecessary ceremony for a first-time apply.

## Risks / Trade-offs

- [No RLS] Tables are accessible to any authenticated user → Mitigation: acceptable for development; RLS will be added before production
- [Counter drift] Concurrent session commits could produce lost updates on counters → Mitigation: use `UPDATE ... SET mistakes_reading = mistakes_reading + 1` (atomic increment); avoid read-modify-write in application code
- [JSONB opacity] `session_results.results` is not queryable column-by-column → Mitigation: acceptable at this stage; if analytics are needed later, a view or junction table can be added without schema changes
