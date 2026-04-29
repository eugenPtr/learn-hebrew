## ADDED Requirements

### Requirement: POST /api/practice/sentences accepts itemIds input
The `POST /api/practice/sentences` endpoint SHALL accept `{ itemIds: string[], count?: number }` as an alternative to `{ themeId, count }`. When `itemIds` is provided, the system SHALL fetch the full vocabulary rows for those items and generate sentences using the anchor/supplemental structure. `themeId` and `itemIds` are mutually exclusive; providing both SHALL return a 400 error.

#### Scenario: itemIds input starts sentence generation
- **WHEN** `POST /api/practice/sentences` is called with `{ itemIds: ["id1", "id2", ...], count: 5 }`
- **THEN** the system generates 5 sentence exercises anchored to those vocabulary items

#### Scenario: Both themeId and itemIds returns 400
- **WHEN** both `themeId` and `itemIds` are present in the request body
- **THEN** the response is `400 Bad Request`

#### Scenario: itemIds with no matching vocabulary returns 422
- **WHEN** none of the provided `itemIds` resolve to existing vocabulary items
- **THEN** the response is `422 Unprocessable Entity`

### Requirement: itemIds mode uses anchor/supplemental prompt structure
For `itemIds` input, the LLM prompt SHALL:
1. List the anchor items (the exact vocabulary items from `itemIds`) under a section labelled "ANCHOR WORDS — each sentence MUST include at least one of these".
2. Fetch supplemental vocabulary by computing the average embedding of the anchor items, querying `match_vocabulary_items` for the top 35 results, excluding anchor IDs, and grouping the remainder by POS (verbs, nouns, adjectives, other).
3. List supplemental items under a section labelled "SUPPLEMENTAL VOCABULARY — use these for all other words in the sentence; do not invent words the student has not learned".
4. Each generated sentence SHALL include at least one anchor word.

#### Scenario: Each sentence contains at least one anchor word
- **WHEN** sentences are generated from itemIds mode
- **THEN** every sentence's `usedItemIds` array contains at least one ID from the original `itemIds` input

#### Scenario: Supplemental vocab is grouped by POS
- **WHEN** the prompt is assembled for itemIds mode
- **THEN** supplemental words appear under labelled POS groups (verbs, nouns, adjectives) in the prompt

#### Scenario: No supplemental results still produces sentences
- **WHEN** vector search returns no results beyond the anchor items
- **THEN** the system proceeds with anchor items only and generates sentences without supplemental vocab

### Requirement: Sentence practice page — itemIds auto-start flow
When the sentence practice page at `/practice/sentences` is loaded with a `?itemIds=` query parameter, it SHALL skip the theme picker and immediately start sentence generation using those item IDs.

#### Scenario: Page auto-starts when itemIds are in URL
- **WHEN** the user navigates to `/practice/sentences?itemIds=id1,id2,...`
- **THEN** the page skips the theme picker and calls `POST /api/practice/sentences` with the provided item IDs

#### Scenario: No rating controls in itemIds session
- **WHEN** a sentence exercise is completed in an itemIds session
- **THEN** the thumbs-up / thumbs-down rating controls are NOT shown; the student sees only "Continue"

#### Scenario: itemIds session summary
- **WHEN** all sentences in an itemIds session are completed
- **THEN** the summary screen shows a "Done" button that navigates to `/`
