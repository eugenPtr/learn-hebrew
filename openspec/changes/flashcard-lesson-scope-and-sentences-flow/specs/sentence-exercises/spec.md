## ADDED Requirements

### Requirement: POST /api/practice/sentences accepts itemIds as an alternative to themeId
The `POST /api/practice/sentences` endpoint SHALL accept `{ itemIds: string[], count?: number }` in addition to the existing `{ themeId: string, count?: number }`. Exactly one of `themeId` or `itemIds` MUST be provided; providing both or neither SHALL return `400 Bad Request`.

#### Scenario: itemIds generates sentences anchored to those items
- **WHEN** `POST /api/practice/sentences` is called with `{ itemIds: ["id1", "id2"], count: 5 }`
- **THEN** the response contains 5 sentence objects, each using at least one of the provided items

#### Scenario: Both fields provided returns 400
- **WHEN** both `themeId` and `itemIds` are present in the request body
- **THEN** the response is `400 Bad Request`

#### Scenario: Neither field provided returns 400
- **WHEN** neither `themeId` nor `itemIds` is present
- **THEN** the response is `400 Bad Request`

### Requirement: itemIds mode prompt separates anchor and supplemental vocabulary
When processing an `itemIds` request, the LLM system prompt SHALL include two labelled vocabulary sections:
- **ANCHOR WORDS** — the exact items from `itemIds`; the prompt SHALL instruct the LLM that each sentence MUST include at least one anchor word.
- **SUPPLEMENTAL VOCABULARY** — items retrieved via vector search from the anchor centroid, grouped by POS (verbs, nouns, adjectives, other); the prompt SHALL instruct the LLM to prefer these over inventing unknown words.

#### Scenario: Prompt instructs LLM to anchor each sentence
- **WHEN** the LLM prompt is assembled in itemIds mode
- **THEN** it contains an explicit instruction that every generated sentence must include at least one anchor word

#### Scenario: Supplemental section groups words by POS
- **WHEN** supplemental vocabulary is added to the prompt
- **THEN** words are listed under POS subheadings (verbs, nouns, adjectives, other)

### Requirement: Sentence practice page skips theme picker when itemIds are in the URL
When `/practice/sentences` is loaded with a `?itemIds=` query parameter containing a comma-separated list of vocabulary item IDs, the page SHALL skip the theme picker and call `POST /api/practice/sentences` with those IDs automatically.

#### Scenario: itemIds in URL bypasses theme picker
- **WHEN** the page loads with `?itemIds=id1,id2,...`
- **THEN** the theme picker is never shown; generation begins immediately

#### Scenario: No rating controls in itemIds session
- **WHEN** a sentence is completed in an itemIds session
- **THEN** thumbs-up / thumbs-down controls are not shown; only a "Continue" button advances to the next sentence

#### Scenario: Summary navigates home
- **WHEN** all sentences in an itemIds session are completed
- **THEN** the summary screen has a "Done" button that navigates to `/`
