## Context

The flashcard practice page currently presents a word-count picker (10 / 20 / 30) and draws from the entire vocabulary pool. There is no way to scope a session to a specific lesson. After a flashcard session, the only action is "Done" → home. The sentences practice only accepts a `themeId` and generates sentences via an embedding similarity search against all user vocabulary.

## Goals / Non-Goals

**Goals:**
- Let users pick a lesson before starting flashcards; scope the session to that lesson's vocabulary.
- Add a "Generate sentences with these words" button on flashcard summary that immediately starts sentence practice anchored to the session's items.
- Extend `POST /api/practice/sentences` to accept `itemIds` directly, generating sentences where each one uses ≥ 1 anchor item and all other words come from the user's known vocabulary.
- Add a persistent "End practice" button in all active phases of both practices.
- Extract a shared `LessonList` presentational component reused across the home dashboard and the flashcard picker.

**Non-Goals:**
- Applying the anchor/supplemental prompt improvement to the theme-based sentences flow.
- Any changes to lesson editing, creation, or the lesson detail page.
- Persisting or rating sentences generated from `itemIds` mode (no theme context to key against).

## Decisions

### 1. LessonList as a presentational component
Extract `LessonList` from `LessonsDashboard` with an `onSelect?: (lesson: LessonSummary) => void` prop. When `onSelect` is provided the items render as `<button>` elements; when absent they render as `<Link href="/lesson/[id]">` elements. This avoids duplicating the list UI while keeping each context's behavior independent.

**Alternative considered:** Pass `href` or `onClick` per item via a union type. Rejected — more complex API for the same result.

### 2. Lesson selection auto-starts the session (no second count screen)
Clicking a lesson on the flashcard picker immediately starts the session using all of that lesson's vocabulary items (the API receives `lessonId` with no explicit `count` and returns all items for the lesson, capped at 30). Showing a second count-picker screen after lesson selection adds a step with little value — the lesson's word count is already visible in the list.

**Alternative considered:** Keep the count picker as a second step after lesson selection. Rejected — two-step picking is unnecessary complexity.

### 3. itemIds passed via URL search params
The flashcard summary navigates to `/practice/sentences?itemIds=id1,id2,...`. The sentences page reads `useSearchParams()` and, when `itemIds` is present, skips the theme picker and auto-starts generation. This is more robust than router state (survives refresh, works with browser back/forward).

**Alternative considered:** POST directly to the sentences page via a form or global state. Rejected — URL params are idiomatic Next.js and simpler.

### 4. Supplemental vocabulary via per-POS window function search (new RPC)
For `itemIds` mode in the sentences API:
1. Fetch full vocab rows for the anchor item IDs (including their embeddings).
2. Compute the centroid: `avg_embedding[i] = mean(anchor_embeddings[:][i])`.
3. Call a new `match_vocabulary_items_by_pos(avg_embedding, match_count_per_pos)` RPC that returns the top N most similar items **per POS category** in a single query, excluding `phrase`.
4. Exclude anchor IDs from results on the API side.
5. The results arrive already partitioned by POS — pass them to the LLM with per-POS subheadings.

The new RPC uses a window function:
```sql
with ranked as (
  select
    v.*,
    1 - (v.embedding <=> query_embedding) as similarity,
    row_number() over (
      partition by v.pos
      order by v.embedding <=> query_embedding
    ) as rn
  from vocabulary_items v
  where v.embedding is not null
    and v.pos != 'phrase'
)
select id, hebrew, english, pos, gender, binyan, conjugations, root, similarity
from ranked
where rn <= match_count_per_pos;
```

This produces a balanced supplemental pool — e.g. top 8 nouns, top 8 verbs, top 8 adjectives, etc. — semantically related to the anchor centroid, in a single round trip.

**Alternative A considered:** Filter by POS in the existing RPC and call it once per POS (8 parallel calls). Rejected — 8 round trips vs 1; requires hardcoding POS categories on the API side; new POS values would need a code change to be included.

**Alternative B considered:** Pass all non-anchor vocabulary grouped by POS. Rejected — unbounded prompt size for large vocabulary sets; less thematic coherence.

### 5. No feedback/rating loop for itemIds-mode sentences
The existing rating system keys good/bad examples by `theme_id`. For `itemIds` mode there is no theme, so feedback rows cannot be retrieved on future sessions in a useful way. The rating buttons are omitted; the practice ends at summary without storing rated sentences.

**Alternative considered:** Rate sentences and key them by a hash of the item IDs. Rejected — over-engineered for the first iteration; the value of feedback accumulation requires multiple sessions on the same set, which is unlikely.

### 6. "End practice" button — fixed position, routes to /
The button is rendered at a fixed position (top-right) so it is always accessible regardless of scroll position or keyboard visibility. It routes directly to `/` without a confirmation dialog, matching the low-stakes nature of ending a practice session early.

## Risks / Trade-offs

- **Vector search latency in itemIds mode** — computing and querying the centroid adds one extra DB call compared to the theme flow. Mitigated by the fact that the theme flow already waits for an OpenAI call; the vector search is negligible in comparison. The window function scans all vocabulary_items once — fast for vocabulary sets in the hundreds to low thousands.
- **New RPC requires a Supabase migration** — `match_vocabulary_items_by_pos` must be deployed before the API code that calls it. The migration is additive (no table changes, no existing RPC modified).
- **URL length with many itemIds** — sessions with 30 items produce a URL with 30 UUIDs (≈ 1 KB). This is within browser and server limits.
- **LessonList component coupling** — the home dashboard is a server component and LessonList needs to work in both server and client contexts. Keep `LessonList` free of any client hooks; the flashcard page (client) passes an `onSelect` handler down, the dashboard (server) omits it.
