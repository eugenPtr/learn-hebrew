## ADDED Requirements

### Requirement: generated_sentences table stores rated sentence exercises
The system SHALL create a `generated_sentences` table with columns: `id uuid PK`, `english text NOT NULL`, `hebrew text NOT NULL`, `item_ids uuid[] NOT NULL`, `theme_id uuid REFERENCES themes(id) ON DELETE SET NULL`, `rating text NOT NULL CHECK (rating IN ('up', 'down'))`, `feedback text`, `created_at timestamptz`. Sentences are only written to this table when the student rates them.

#### Scenario: Unrated sentences are never persisted
- **WHEN** a student practices a generated sentence but does not rate it
- **THEN** no row is written to `generated_sentences`

#### Scenario: Rated sentence is persisted with rating set
- **WHEN** a student rates a sentence thumbs-up or thumbs-down
- **THEN** a row is inserted with `rating = 'up'` or `rating = 'down'` (never NULL)

#### Scenario: Thumbs-down with feedback text is stored
- **WHEN** a student rates thumbs-down and provides feedback text
- **THEN** the `feedback` column is populated with that text

#### Scenario: Theme deletion orphans sentences safely
- **WHEN** a theme is deleted
- **THEN** associated `generated_sentences` rows have `theme_id` set to NULL and are retained

### Requirement: POST /api/practice/sentences generates a set of sentence exercises for a theme
The system SHALL expose `POST /api/practice/sentences` accepting `{ themeId: string, count?: number }` (default count 5). It SHALL:
1. Load the theme's embedding and retrieve the top-20 most similar vocabulary items by cosine distance
2. Load recent rated sentences for this theme (up to 10, ordered by `created_at DESC`)
3. Call the LLM with: the retrieved vocabulary items, good examples (thumbs-up sentences), bad examples (thumbs-down sentences + feedback text), and Tel Aviv context instructions
4. Return an array of `{ english, hebrew, usedItemIds }` objects (not yet persisted)

#### Scenario: Returns requested sentence count
- **WHEN** `POST /api/practice/sentences` is called with `count: 5`
- **THEN** the response contains exactly 5 sentence objects

#### Scenario: Feedback from prior sessions is injected into prompt
- **WHEN** thumbs-down sentences with feedback exist for the theme
- **THEN** those sentences and their feedback appear in the LLM prompt as examples to avoid

#### Scenario: Good examples are included in prompt
- **WHEN** thumbs-up sentences exist for the theme
- **THEN** those sentences appear in the LLM prompt as positive examples

#### Scenario: Invalid themeId returns 404
- **WHEN** `themeId` does not match any theme in the database
- **THEN** the response is `404 Not Found`

### Requirement: POST /api/practice/sentences/rate persists a rated sentence
The system SHALL expose `POST /api/practice/sentences/rate` accepting `{ english, hebrew, itemIds, themeId, rating, feedback? }`. It SHALL insert a row into `generated_sentences` and return the new row's id.

#### Scenario: Rate thumbs-up stores sentence without feedback
- **WHEN** `rating = 'up'` is submitted
- **THEN** a row is inserted with `rating = 'up'` and `feedback = NULL`

#### Scenario: Rate thumbs-down with feedback stores both
- **WHEN** `rating = 'down'` and `feedback` text is provided
- **THEN** a row is inserted with `rating = 'down'` and `feedback` populated

#### Scenario: Invalid rating value returns 400
- **WHEN** `rating` is not `'up'` or `'down'`
- **THEN** the response is `400 Bad Request`

### Requirement: Sentence practice page — theme picker
The sentences practice page SHALL display all themes as buttons fetched from `GET /api/themes`. Selecting a theme initiates sentence generation.

#### Scenario: All themes rendered as buttons
- **WHEN** the sentence practice page loads
- **THEN** one button per theme is displayed, including user-created themes

#### Scenario: Selecting a theme triggers generation
- **WHEN** a student taps a theme button
- **THEN** the page transitions to a loading state and calls `POST /api/practice/sentences`

### Requirement: Sentence practice page — exercise flow
The sentence practice page SHALL cycle through the generated sentences. For each sentence: display the English text, accept Hebrew text input, reveal the correct Hebrew answer on submission, then show thumbs-up and thumbs-down controls.

#### Scenario: English prompt is displayed
- **WHEN** a sentence exercise is active
- **THEN** the English text is shown and the student can type a Hebrew translation

#### Scenario: Correct answer is revealed after submission
- **WHEN** the student submits their answer
- **THEN** the correct Hebrew sentence is displayed alongside the student's attempt

#### Scenario: Thumbs-up dismisses sentence and advances
- **WHEN** the student taps thumbs-up
- **THEN** the sentence is rated 'up' via `POST /api/practice/sentences/rate` and the next sentence loads

#### Scenario: Thumbs-down shows feedback input then advances
- **WHEN** the student taps thumbs-down
- **THEN** an optional text input appears for feedback; on confirm the sentence is rated 'down' (with feedback if provided) and the next sentence loads

#### Scenario: Session ends after all sentences are rated
- **WHEN** all generated sentences have been rated or skipped
- **THEN** the page shows a session-complete screen with a button to return to the theme picker

### Requirement: LLM prompt produces Tel Aviv-register sentences
The sentence generation prompt SHALL instruct the LLM to produce sentences that sound natural to a person living in Tel Aviv — colloquial, present-day Israeli Hebrew. Formal or bureaucratic phrasing SHALL be avoided.

#### Scenario: Generated sentences use colloquial register
- **WHEN** sentences are generated for any theme
- **THEN** the Hebrew uses everyday spoken Israeli Hebrew, not formal written style
