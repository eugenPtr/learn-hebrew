# Scaling Limitations

Known architectural decisions that work fine for a single user but will become
problems when the app is opened to multiple users. Sourced from every ticket in
the backlog. Nothing here needs fixing now — this is a map of the debt.

---

## 1. No user identity or data isolation
**Source:** EUG-6, EUG-7

The auth model is a single shared APP_SECRET cookie — one password, no user
identity. Every table (`lessons`, `vocabulary_items`, `session_results`) has no
`user_id` column. All data is global. User A and User B share the same
vocabulary bank, the same lesson history, and the same mistake counters.

**Fix when needed:** Add a `user_id` column to all three tables, add Supabase
RLS policies (explicitly deferred in EUG-6), and replace APP_SECRET with proper
auth (Supabase Auth or similar).

---

## 2. Vocabulary de-duplication is global, not per-user
**Source:** EUG-13

When saving a lesson, `/api/lessons` filters out any Hebrew word already in
`vocabulary_items` — across the entire table, not scoped to a user. If two
users ever share the app, the second user to add "שלום" silently gets nothing
inserted. Their lesson row is created but contains no vocabulary.

This is a direct consequence of #1 — the fix is the same (user-scoped rows).

---

## 3. GPT-4o exercise generation is never cached
**Source:** EUG-15, EUG-16

Every call to `/api/session` generates fresh exercise sentences via GPT-4o,
even if the same lesson has been practiced before. There is no cache of
previously generated `ExercisePair` objects. At scale — or even for a single
user practicing the same lesson repeatedly — this means paying full LLM cost
every session.

**Fix when needed:** Cache generated `ExercisePair` objects keyed by
`(lessonId, wordCount)` — in Redis, a DB table, or even a Supabase table.
Invalidate when the lesson's vocabulary changes.

---

## 4. TTS is generated sequentially, one call per exercise
**Source:** EUG-16

At session build time, `/api/session` calls `/api/tts` once per exercise —
30 sequential HTTP calls for a default session. This is intentional to avoid
rate limits, but it means:

- Session startup takes 8–15s even for a single user
- At multiple concurrent users, sequential calls per session multiply quickly
- OpenAI TTS has per-minute token limits that will be hit under load

**Partial mitigation already in place:** EUG-14 uses a sha256 hash of the
sentence as the filename, so identical sentences reuse the cached MP3 in
Supabase Storage and skip the TTS API call. This helps if the LLM regenerates
the same sentences across sessions, but does not help on first generation.

**Fix when needed:** Move TTS generation to a background job (queue) so the
client does not block. Pre-warm caches for known sentences. Consider parallel
TTS calls with exponential backoff rather than strict sequential.

---

## 5. Audio files accumulate in Supabase Storage with no cleanup
**Source:** EUG-16 ("no cleanup required in v1")

Every newly generated Hebrew sentence that hasn't been seen before writes an
MP3 to the `tts-audio` bucket. There is no TTL, no eviction policy, and no
cleanup job. At scale — or even for a single active user over months — this
becomes non-trivial storage cost.

The bucket is also fully public with no access control: any URL is permanently
accessible to anyone who has it.

**Fix when needed:** Add a cleanup job (or Supabase Storage lifecycle rule) to
delete audio files not accessed in N days. Consider scoping bucket access with
signed URLs for sensitive content.

---

## 6. No rate limiting on expensive API routes
**Source:** EUG-11, EUG-16

`/api/extract` (GPT-4o vision) and `/api/session` (GPT-4o + N×TTS calls) have
no per-user or per-IP rate limiting. A single misbehaving client — or a
misconfigured retry loop — can exhaust OpenAI API credits in minutes.

**Fix when needed:** Add rate limiting middleware (e.g. Upstash Redis + `@upstash/ratelimit`) on both routes before opening to multiple users.

---

## 7. Home page fetches the entire vocabulary bank with no pagination
**Source:** EUG-27

The home page loads all lessons and all their vocabulary items in one joined
Supabase query. For a single user with a few dozen lessons this is fine. For
many users or long-running accounts with hundreds of lessons, this is an
unbounded read that will slow the page and increase DB load linearly.

**Fix when needed:** Add pagination or lazy-load (expand-on-click already
exists in the UI — the query should match, fetching items only when a card
is expanded).

---

## 8. Session state is browser-local only
**Source:** EUG-16, EUG-20

The active practice session lives in `localStorage`. This means:

- A user switching devices mid-session loses their progress entirely
- Closing the tab after completing exercises but before hitting "Done" loses
  all result data (mistakes, last_used_at) for that session
- There is no server-side record of an in-progress session

**Fix when needed:** Persist the session to a `sessions` table at start, write
progress incrementally, and reconcile on resume. Or at minimum flush results
to the DB after each exercise rather than batching at the end.

---

## 9. Vocabulary de-duplication has a race condition
**Source:** EUG-13

The de-duplication check in `/api/lessons` is read-then-filter in application
code: fetch all existing Hebrew values, filter the incoming list, then insert.
Under concurrent writes (two users submitting lessons at the same time), both
reads can see the same state before either insert completes, allowing duplicate
rows to slip through.

**Fix when needed:** Add a `UNIQUE` constraint on `vocabulary_items(hebrew)`
(scoped to `user_id` once multi-user is added) and handle the conflict with
`ON CONFLICT DO NOTHING`.

---

## 10. session_results JSONB is opaque to queries
**Source:** EUG-6

Session outcomes are stored as a JSONB blob `[{item_id, exercise_type, correct}]`
in `session_results.results`. This is unindexed and requires scanning every row
to answer questions like "which words has the user most frequently got wrong?"
Any analytics or smarter selection algorithm will have to do full-table JSONB
traversal.

**Fix when needed:** When analytics become a requirement, add a normalised
`session_item_results` table with indexed columns, or add a GIN index on the
JSONB column as a lighter-weight intermediate step.

---

## 11. Counter increments are N individual UPDATE queries per session
**Source:** EUG-21

At session completion, `/api/session/complete` fires one `UPDATE` per
`vocabulary_items` row that appeared in the session. For a default 30-exercise
session touching ~10 focused words plus surrounding vocabulary, this can be
10–25 individual UPDATE statements.

This is fine for a single user. At scale, a burst of simultaneous session
completions will produce many small writes under row-level locks.

**Fix when needed:** Batch the updates into a single `UPDATE ... WHERE id = ANY($ids)`
using a CASE expression, or use a staging table + merge pattern.
