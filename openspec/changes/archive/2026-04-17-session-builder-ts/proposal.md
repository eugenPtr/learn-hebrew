## Why

The M2 Practice Session feature requires a pure function that selects vocabulary items for a focused lesson and builds an LLM prompt to generate exercise sentence pairs. This is the foundational building block before `/api/session` can be wired up (EUG-16).

## What Changes

- Add `lib/session-builder.ts` with two pure functions:
  - `selectItems(allItems, focusedLessonId, wordCount)` — selects focused and context words
  - `buildExercisePrompt(focusedWords, otherWords)` — returns an LLM prompt string that produces `ExercisePair[]` JSON

## Capabilities

### New Capabilities
- `session-builder`: Pure functions for selecting vocabulary items and building LLM exercise generation prompts

### Modified Capabilities
<!-- No existing spec-level behavior changes -->

## Impact

- New file: `lib/session-builder.ts`
- Consumed by: `app/api/session/route.ts` (EUG-16)
- No DB calls, no API calls — pure functions only
