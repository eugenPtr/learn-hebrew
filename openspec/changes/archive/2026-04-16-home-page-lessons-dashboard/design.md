## Context

The app has a working lesson ingestion flow (`/lesson/new` → `/lesson/review`) but the home page is still the default Next.js placeholder. The `lessons` and `vocabulary_items` tables exist in Supabase with a foreign-key relationship (`vocabulary_items.lesson_id → lessons.id`). The review page is a client component that fetches lazily; the home page should instead fetch server-side for a fast first paint.

## Goals / Non-Goals

**Goals:**
- Replace `app/page.tsx` with a server-rendered lessons dashboard
- Display all lessons as expandable cards ordered chronologically
- Provide "Add Lesson" navigation and a disabled "Generate Practice Session" placeholder
- Match the visual style of the review page (`max-w-lg mx-auto p-6`, same Tailwind conventions)

**Non-Goals:**
- Practice session functionality (future ticket)
- Pagination or infinite scroll (lesson count is small in M1)
- Authentication / per-user filtering (not yet in scope)
- Editing or deleting lessons from this page

## Decisions

### Server component for data fetching, client component for interactivity

**Decision:** `app/page.tsx` is an `async` server component that fetches all lesson+vocabulary data, then renders a `<LessonsDashboard>` client component (in `components/`) that owns expand/collapse state.

**Why:** Server components give a fast, no-flicker first paint and avoid a useEffect/loading-spinner pattern for a page that is always data-dependent. Expand/collapse state is purely local UI — no reason to lift it server-side. This pattern mirrors Next.js App Router best practices.

**Alternative considered:** Full client component with `useEffect` fetch (same as review page). Rejected because home page data is always required on load, so server-side fetch is strictly better here.

### Single joined query with `select('*, vocabulary_items(*)')`

**Decision:** Fetch lessons with embedded vocabulary items in one Supabase call using the foreign-key relationship.

**Why:** Avoids N+1 queries. Supabase PostgREST supports nested selects via FK; the result is already grouped by lesson. Ordering by `lessons.created_at` ascending gives chronological lesson numbering without client-side sorting.

**Alternative considered:** Two separate queries (all lessons, then all vocab filtered by lesson IDs). Rejected as unnecessary complexity.

### Lesson number derived from sort order, not stored

**Decision:** "Lesson N" is the 1-based index of each lesson after ordering by `created_at` ascending. There is no `number` column on the `lessons` table.

**Why:** The table lacks a sequence column and adding one is out of scope. Index-based numbering is consistent and requires no schema change.

## Risks / Trade-offs

- [Expand/collapse is local state] → No risk; state does not need to survive navigation. Acceptable.
- [Lesson numbering by created_at] → If two lessons are inserted with the same timestamp, order is non-deterministic. Mitigation: order by `id` as a tiebreaker (UUIDs are monotonically ordered by Supabase's default `gen_random_uuid()` if on Postgres 14+, but `created_at` + `id` tiebreak is safe).
- [No loading state on home page] → If Supabase is slow, the server render blocks. Acceptable for M1 scale; can add Suspense + streaming later.
