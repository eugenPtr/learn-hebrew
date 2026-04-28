## Why

The current app stores vocabulary as flat word/translation pairs with no grammatical metadata or semantic structure. This limits exercises to isolated flashcards and makes it impossible to generate contextual sentences, target specific themes, or build conjugation drills — all of which are needed for meaningful conversational Hebrew practice set in Tel Aviv daily life.

## What Changes

- Add grammatical metadata to `vocabulary_items`: part-of-speech, gender (nouns), binyan (verbs), conjugation table (verbs)
- Add semantic embeddings to `vocabulary_items` (english gloss → vector) to enable theme-based word retrieval
- AI assigns POS/gender/binyan/conjugations at word extraction time; student-facing UI allows review and correction
- Introduce a `themes` table: named practice themes with descriptions and pre-computed embeddings (e.g. "Time", "Location", "Opposite Adjectives"); users can add custom themes
- Introduce a `generated_sentences` table: LLM-generated sentence exercises rated by the student; stored only on thumbs-up or thumbs-down; feedback is injected into future generation prompts
- Add a **Sentences** practice mode: student picks a theme → system retrieves relevant words via vector similarity → LLM generates 5 sentence exercises → student translates English → Hebrew → rates each sentence
- Existing **Flashcards** mode continues unchanged but now surfaces phrases (`pos = 'phrase'`) alongside regular words

## Capabilities

### New Capabilities

- `vocabulary-pos-tagging`: AI-assigned part-of-speech, gender, binyan, and conjugation data on vocabulary items; UI for student review and correction
- `vocabulary-embeddings`: English-gloss embeddings on vocabulary items and theme descriptions enabling semantic vector search
- `practice-themes`: User-extensible theme table; each theme has a description and pre-computed embedding; used to retrieve relevant vocabulary for sentence exercises
- `sentence-exercises`: Theme-based sentence practice mode — vector retrieval + LLM generation + feedback loop stored in `generated_sentences`

### Modified Capabilities

- `flashcard-word-selection`: Flashcard pool now includes `pos = 'phrase'` items alongside regular words

## Impact

- **Database**: new columns on `vocabulary_items` (pos, gender, binyan, conjugations jsonb, embedding vector(384)); new tables `themes` and `generated_sentences`; requires pgvector extension
- **Word extraction API** (`/api/lessons/[id]/words`): LLM call added to assign POS tags and generate embeddings at insert time; if input is a conjugated verb, infinitive is extracted and stored
- **New APIs**: `/api/themes` (CRUD), `/api/practice/sentences` (generate), `/api/practice/sentences/rate` (store rated sentence)
- **New UI**: sentence practice page with theme picker, exercise flow, and thumbs-up/down rating with feedback text
- **Dependencies**: pgvector (already in Supabase), Supabase Edge Function running `gte-small` via `Supabase.ai.Session` (384 dims, free tier, no external API)
