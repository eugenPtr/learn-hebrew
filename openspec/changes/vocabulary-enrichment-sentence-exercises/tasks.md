## 1. Database Migration

- [x] 1.1 Create enums migration: `pos_enum`, `gender_enum`, `binyan_enum`
- [x] 1.2 Add columns to `vocabulary_items`: `pos`, `gender`, `binyan`, `conjugations jsonb`, `root text`, `embedding vector(384)`
- [x] 1.3 Create `themes` table with `id`, `name`, `description`, `embedding vector(384)`, `created_at`
- [x] 1.4 Create `generated_sentences` table with all columns; `rating NOT NULL CHECK (rating IN ('up','down'))`; `theme_id FK ON DELETE SET NULL`
- [x] 1.5 Create `ivfflat` index on `vocabulary_items.embedding` using cosine ops
- [x] 1.6 Create `ivfflat` index on `themes.embedding` using cosine ops

## 2. Theme Seeding

- [x] 2.1 Write seed script or migration that inserts the 6 initial themes with description strings
- [x] 2.2 Compute and store embeddings for all 6 seeded themes via the Supabase `embed` Edge Function

## 3. Embedding Infrastructure

- [x] 3.1 Create Supabase Edge Function `supabase/functions/embed/index.ts`: accepts `{ text: string }`, runs `Supabase.ai.Session('gte-small')`, returns `{ embedding: number[] }` (384 dims)
- [x] 3.2 Add `lib/embeddings.ts` helper: `embedText(text: string): Promise<number[]>` — calls the Edge Function via `supabase.functions.invoke('embed', ...)`

## 4. Word Extraction API — AI Tagging

- [x] 4.1 Extend `POST /api/lessons/[id]/words` LLM call to return `pos`, `gender`, `binyan`, `root` (for verbs/nouns), `hebrew_infinitive` (if conjugated input), `conjugations.present` as a 9-element array in fixed order `[ani, ata, at, hoo, hee, anahnoo, atem, hem, hen]`
- [x] 4.2 Define `PRONOUN_ORDER = ['ani','ata','at','hoo','hee','anahnoo','atem','hem','hen']` constant in `lib/hebrew.ts`; use it in all exercise UI and prompt templates
- [x] 4.2 If LLM returns `hebrew_infinitive`, use it as the stored `hebrew` value instead of the raw input
- [x] 4.3 Embed the `english` gloss and store in `embedding` column on insert
- [x] 4.4 Regenerate embedding in `PATCH /api/vocabulary-items/[id]` when `english` field changes

## 5. Vocabulary Item PATCH API

- [x] 5.1 Extend `PATCH /api/vocabulary-items/[id]` to accept `pos`, `gender`, `binyan` fields
- [x] 5.2 Validate `pos` against `pos_enum` values; return `400` for invalid values
- [x] 5.3 Validate `gender` and `binyan` against their respective enums

## 6. Themes API

- [x] 6.1 Create `GET /api/themes`: return all themes ordered by `created_at ASC`, omit `embedding` from response
- [x] 6.2 Create `POST /api/themes`: accept `{ name, description? }`, compute embedding, insert; return `409` on duplicate name, `400` on empty name

## 7. Sentence Generation API

- [x] 7.1 Create `POST /api/practice/sentences`: accept `{ themeId, count? }`; load theme embedding; vector search top-20 vocabulary items; load recent feedback; call LLM; return `[{ english, hebrew, usedItemIds }]`
- [x] 7.2 Write LLM prompt template: vocabulary list, good examples section, bad examples section, Tel Aviv colloquial register instruction
- [x] 7.3 Create `POST /api/practice/sentences/rate`: accept `{ english, hebrew, itemIds, themeId, rating, feedback? }`; insert into `generated_sentences`; return new row id

## 8. Lesson Detail UI — Tag Editing

- [x] 8.1 Add POS dropdown to each word card on the lesson detail page; pre-populated from `pos` column
- [x] 8.2 Show gender radio buttons conditionally when `pos = 'noun'`
- [x] 8.3 Show binyan dropdown conditionally when `pos = 'verb'`
- [x] 8.4 Wire changes to `PATCH /api/vocabulary-items/[id]` with optimistic UI update

## 9. Sentence Practice Page

- [x] 9.1 Create `/app/practice/sentences/page.tsx`: fetch themes from `GET /api/themes`; render one button per theme
- [x] 9.2 On theme selection: call `POST /api/practice/sentences`; transition to loading state; handle errors
- [x] 9.3 Implement exercise flow: display English prompt, Hebrew text input (with Hebrew keyboard), submit to reveal correct answer
- [x] 9.4 After reveal: show thumbs-up and thumbs-down buttons
- [x] 9.5 On thumbs-up: call `POST /api/practice/sentences/rate` with `rating='up'`; advance to next sentence
- [x] 9.6 On thumbs-down: show optional feedback text input; on confirm call rate endpoint with `rating='down'`; advance
- [x] 9.7 Session-complete screen after all sentences rated; button to return to theme picker
- [x] 9.8 Add "Sentences" entry point on home dashboard or practice landing page

## 10. Flashcard Pool Update

- [x] 10.1 Verify `GET /api/flashcard` query selects all `vocabulary_items` rows regardless of `pos` (no filter added); confirm phrases appear in pool
