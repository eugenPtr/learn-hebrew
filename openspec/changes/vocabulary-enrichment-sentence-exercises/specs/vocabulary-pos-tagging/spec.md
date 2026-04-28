## ADDED Requirements

### Requirement: vocabulary_items stores grammatical metadata
The system SHALL add the following nullable columns to `vocabulary_items`:
- `pos pos_enum` — part of speech: `noun | verb | adjective | adverb | preposition | conjunction | pronoun | phrase | other`
- `gender gender_enum` — `masculine | feminine`; populated for nouns only
- `binyan binyan_enum` — `paal | nifal | piel | pual | hitpael | hifil | hufal`; populated for verbs only; stored as the infinitive form
- `conjugations jsonb` — populated for verbs only; each tense is a 9-element array in fixed pronoun order `[ani, ata, at, hoo, hee, anahnoo, atem, hem, hen]`; shape: `{ "present": ["...", "...", "...", "...", "...", "...", "...", "...", "..."] }`
- `root text` — nullable; the Semitic root letters (e.g. `כתב`, `שוק`); populated for verbs and nouns; NULL for phrases, conjunctions, adverbs

#### Scenario: Noun has pos, gender, and root; no binyan or conjugations
- **WHEN** a vocabulary item is a noun
- **THEN** `pos = 'noun'`, `gender` is set, `root` is set, `binyan` is NULL, `conjugations` is NULL

#### Scenario: Verb has pos, binyan, conjugations, and root; no gender
- **WHEN** a vocabulary item is a verb
- **THEN** `pos = 'verb'`, `binyan` is set, `conjugations` contains at least `"present"` key with a 9-element array, `root` is set, `gender` is NULL

#### Scenario: Phrase has pos only; no root
- **WHEN** a vocabulary item is a phrase
- **THEN** `pos = 'phrase'`, `gender` is NULL, `binyan` is NULL, `conjugations` is NULL, `root` is NULL

### Requirement: AI assigns tags at word extraction time
When a word is inserted via `POST /api/lessons/[id]/words`, the system SHALL call the LLM to assign `pos`, `gender` (if noun), `binyan` (if verb), `root` (if verb or noun), the hebrew infinitive (if the input is a conjugated verb form), and present-tense `conjugations` (if verb). The LLM MUST extract the infinitive from conjugated input and store that as `hebrew`.

#### Scenario: Conjugated verb input is normalised to infinitive
- **WHEN** the extracted hebrew is a conjugated verb form (e.g. "הולך")
- **THEN** the stored `hebrew` field is the infinitive (e.g. "ללכת") and `conjugations.present` is populated

#### Scenario: Noun tagging includes gender
- **WHEN** the LLM identifies the word as a noun
- **THEN** `pos = 'noun'` and `gender` is set to `masculine` or `feminine`

#### Scenario: Root is assigned for verbs and nouns
- **WHEN** the LLM identifies the word as a verb or noun
- **THEN** `root` is set to the Semitic root letters (e.g. `כתב` for כותב, `שוק` for שוק)

#### Scenario: Root is null for phrases and function words
- **WHEN** the word has `pos` of `phrase`, `conjunction`, `adverb`, or `other`
- **THEN** `root` is NULL

#### Scenario: Unknown POS falls back to other
- **WHEN** the LLM cannot confidently assign a POS
- **THEN** `pos = 'other'` and all other metadata fields are NULL

### Requirement: Student can correct AI-assigned tags via lesson detail UI
The lesson detail page SHALL display a POS dropdown, a gender radio (shown only for nouns), and a binyan dropdown (shown only for verbs) pre-populated with AI-assigned values. Changes are persisted via `PATCH /api/vocabulary-items/[id]`.

#### Scenario: POS dropdown is pre-populated
- **WHEN** a student opens a lesson detail page for a word with AI-assigned tags
- **THEN** the POS dropdown shows the AI-assigned value selected

#### Scenario: Gender field shown only for nouns
- **WHEN** `pos = 'noun'`
- **THEN** the gender radio buttons are visible

#### Scenario: Gender field hidden for non-nouns
- **WHEN** `pos` is not `noun`
- **THEN** the gender radio buttons are not rendered

#### Scenario: Binyan field shown only for verbs
- **WHEN** `pos = 'verb'`
- **THEN** the binyan dropdown is visible

#### Scenario: Tag change is persisted
- **WHEN** a student changes a POS, gender, or binyan value in the UI
- **THEN** a `PATCH /api/vocabulary-items/[id]` request is sent and the updated value is stored
