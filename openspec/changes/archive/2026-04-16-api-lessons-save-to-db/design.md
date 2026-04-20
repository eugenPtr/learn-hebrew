## Context

The review screen sends a confirmed list of `{ hebrew, english }` pairs to the backend. The backend must persist this as a new lesson while avoiding duplicate vocabulary entries — the vocabulary bank is cumulative and grows across all lessons.

The Supabase client is already configured in the project. Tables `lessons` and `vocabulary_items` exist with the schema in place.

## Goals / Non-Goals

**Goals:**
- Accept a POST with confirmed vocabulary items
- Deduplicate against the existing bank by exact `hebrew` match
- Always create a `lessons` row (even if all items are duplicates)
- Insert only net-new items into `vocabulary_items`
- Return `{ lessonId, inserted, skipped }` to the client

**Non-Goals:**
- TTS audio generation (handled at session build time in EUG-16)
- Updating existing vocabulary items
- Authentication / multi-user support (single-user app)
- Pagination or batching of large payloads

## Decisions

### Deduplication via single query, not per-item

**Decision:** Fetch all existing `hebrew` values in one query before any inserts, then filter in-memory.

**Rationale:** Avoids N round-trips to Supabase (one per item). The vocabulary bank is small (hundreds of items), so loading all `hebrew` values is cheap. Simpler than an `ON CONFLICT DO NOTHING` upsert which would still need a unique constraint.

**Alternative considered:** `INSERT ... ON CONFLICT (hebrew) DO NOTHING` — requires a unique index on `vocabulary_items.hebrew`. Acceptable, but adds schema coupling. Kept out for v1 to avoid a migration at this stage.

### Always create the `lessons` row

**Decision:** Create the `lessons` row even when all submitted items are duplicates.

**Rationale:** Preserves a record that the user reviewed and confirmed a lesson, even if nothing new was added. Useful for audit/history.

### Sequential inserts (no bulk insert library)

**Decision:** Use Supabase `.insert()` with an array payload — one call for `lessons`, one call for the filtered `vocabulary_items` batch.

**Rationale:** Supabase JS client supports batch insert natively. No extra dependencies needed.

## Risks / Trade-offs

- **Race condition on deduplication** → If two concurrent requests insert the same `hebrew` value, both could pass the in-memory filter and cause a duplicate. Mitigation: acceptable for a single-user app; add a unique constraint in a future migration if needed.
- **No transaction** → If the `vocabulary_items` insert fails after the `lessons` row is created, the lesson row is orphaned. Mitigation: the orphaned lesson row is harmless; no user-facing impact. Supabase transactions via RPC can be added later if needed.
