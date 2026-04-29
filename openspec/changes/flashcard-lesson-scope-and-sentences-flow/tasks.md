## 1. Shared LessonList Component

- [x] 1.1 Create `components/LessonList.tsx` — renders lessons as `<button>` when `onSelect` prop is provided, as `<Link href="/lesson/[id]">` when absent
- [x] 1.2 Update `components/LessonsDashboard.tsx` to use `LessonList` instead of the inline lesson list

## 2. Flashcard API — Lesson Scoping

- [x] 2.1 Update `GET /api/flashcard` to accept optional `lessonId` query param
- [x] 2.2 When `lessonId` is provided, filter vocabulary items to those belonging to that lesson before running the selection algorithm

## 3. Flashcard Page — Lesson Picker

- [x] 3.1 Update `app/practice/page.tsx`: replace the word-count picking screen with a lesson list; fetch lessons client-side on mount
- [x] 3.2 Clicking a lesson calls `GET /api/flashcard?lessonId=<id>` (no explicit count — returns all lesson vocab, capped at 30 by the API)
- [x] 3.3 Handle empty-lesson error: show message and stay in picking state

## 4. Flashcard Page — End Practice & Summary Actions

- [x] 4.1 Add fixed "End practice" button visible in `running` and `revealed` states; clicking navigates to `/` without posting results
- [x] 4.2 Add "Generate sentences with these words" button to the summary screen; clicking navigates to `/practice/sentences?itemIds=<deduped-ids>`

## 5. Supabase Migration — Per-POS Vector Search RPC

- [x] 5.1 Write migration adding `match_vocabulary_items_by_pos(query_embedding vector(384), match_count_per_pos int)` RPC — window function partitioned by `pos`, excluding `phrase`, returning top N per POS ordered by cosine distance
- [x] 5.2 Apply migration to Supabase and verify the function is callable

## 6. Sentences API — itemIds Mode

- [x] 6.1 Update `POST /api/practice/sentences` to accept `{ itemIds: string[], count?: number }` as an alternative input; return 400 if both or neither of `themeId`/`itemIds` are provided
- [x] 6.2 For itemIds mode: fetch full vocab rows (including embeddings) for anchor IDs; compute average embedding from anchor items
- [x] 6.3 Call `match_vocabulary_items_by_pos` with the centroid embedding; exclude anchor IDs from results
- [x] 6.4 Assemble prompt with "ANCHOR WORDS" and "SUPPLEMENTAL VOCABULARY" sections — supplemental items listed under POS subheadings; anchor section instructs LLM each sentence must include ≥ 1 anchor word
- [x] 6.5 Skip rated-sentences (good/bad examples) in itemIds mode — no theme context available

## 7. Sentences Page — itemIds Auto-Start Flow

- [x] 7.1 Update `app/practice/sentences/page.tsx` to read `?itemIds=` query param via `useSearchParams`
- [x] 7.2 When `itemIds` is present: skip theme picker, auto-call `POST /api/practice/sentences` with the parsed item IDs on mount
- [x] 7.3 In itemIds session: replace thumbs-up/thumbs-down controls with a single "Continue" button (no rating submission)
- [x] 7.4 itemIds session summary: show "Done" button navigating to `/`

## 8. Sentences Page — End Practice Button

- [x] 8.1 Add fixed "End practice" button visible in `running`, `revealed`, and `feedback` states of the sentences page; clicking navigates to `/`
