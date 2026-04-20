## Why

The `vocabulary_items` table tracks mistake counts via three columns tied to exercise types (`mistakes_reading`, `mistakes_speaking`, `mistakes_typing`) that no longer exist. The new exercise model uses a single unified mistake signal, so the split columns are dead weight that misrepresent the schema.

This migration unblocks all M2 feature work.

## What Changes

- **BREAKING**: Drop `mistakes_reading`, `mistakes_speaking`, `mistakes_typing` from `vocabulary_items`
- Add `mistakes integer NOT NULL DEFAULT 0` to `vocabulary_items`

## Capabilities

### New Capabilities
- `vocabulary-mistake-tracking`: Single unified `mistakes` counter on vocabulary items replacing the three split columns

### Modified Capabilities
<!-- No existing spec-level behavior changes -->

## Impact

- `vocabulary_items` table schema (Supabase)
- Any code reading or writing the three old columns will need updating
