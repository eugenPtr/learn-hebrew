## 1. Create the module

- [x] 1.1 Create `lib/session-builder.ts` and export `VocabularyItem`, `WordRef`, `ExercisePair` types
- [x] 1.2 Implement `selectItems(allItems, focusedLessonId, wordCount)` with shuffle logic
- [x] 1.3 Implement `buildExercisePrompt(focusedWords, otherWords)` returning LLM prompt string

## 2. Validate the prompt

- [x] 2.1 Write a quick test script (or inline test) with a hardcoded item list and log the prompt output
- [x] 2.2 Send the prompt to GPT-4o manually and verify the response matches the `ExercisePair[]` shape
