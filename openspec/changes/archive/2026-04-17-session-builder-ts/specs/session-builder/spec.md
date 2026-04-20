## ADDED Requirements

### Requirement: selectItems returns focused and context words
`selectItems(allItems, focusedLessonId, wordCount)` SHALL return `{ focusedWords, otherWords }` where `focusedWords` is a shuffled subset of items from the focused lesson (up to `wordCount`) and `otherWords` is all items from all other lessons.

#### Scenario: Normal case — lesson has more items than wordCount
- **WHEN** `allItems` contains 15 items from lesson A and 5 from lesson B, `focusedLessonId` is lesson A, `wordCount` is 10
- **THEN** `focusedWords` has exactly 10 items, all from lesson A
- **THEN** `otherWords` has exactly 5 items, all from lesson B

#### Scenario: Lesson has fewer items than wordCount
- **WHEN** `allItems` contains 4 items from lesson A, `focusedLessonId` is lesson A, `wordCount` is 10
- **THEN** `focusedWords` has all 4 items from lesson A
- **THEN** `otherWords` is empty

#### Scenario: No items from other lessons
- **WHEN** all items in `allItems` belong to `focusedLessonId`
- **THEN** `otherWords` is an empty array

### Requirement: buildExercisePrompt returns a valid LLM prompt string
`buildExercisePrompt(focusedWords, otherWords)` SHALL return a non-empty string that instructs an LLM to produce one `ExercisePair` per focused word as a JSON array.

#### Scenario: Prompt includes all focused word Hebrew and English forms
- **WHEN** `focusedWords` contains items with known `hebrew` and `english` values
- **THEN** the returned prompt string contains those Hebrew and English values

#### Scenario: Prompt instructs JSON output matching ExercisePair shape
- **WHEN** the prompt is sent to an LLM
- **THEN** the LLM returns a JSON array where each element has `focusWordId`, `hebrewSentence`, `englishSentence`, and `wordsUsed`

#### Scenario: Prompt requests natural conversational sentences
- **WHEN** the prompt is constructed
- **THEN** it explicitly instructs the LLM to generate sentences a real person would say in conversation, not textbook drills

### Requirement: Shared TypeScript types are exported
`lib/session-builder.ts` SHALL export `VocabularyItem`, `WordRef`, and `ExercisePair` types for use by consumers.

#### Scenario: Types are importable by API route
- **WHEN** `app/api/session/route.ts` imports from `lib/session-builder`
- **THEN** `VocabularyItem`, `WordRef`, and `ExercisePair` are available without type errors
