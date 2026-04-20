## 1. Scaffold the route

- [x] 1.1 Create `app/api/session/route.ts` with a `GET` handler skeleton
- [x] 1.2 Parse and validate `lessonId` and `wordCount` query params (defaults: most recent lesson, 10)

## 2. DB read

- [x] 2.1 Query all `vocabulary_items` joined with `lessons` (full table, no filters)
- [x] 2.2 If `lessonId` provided, verify it exists — return 400 if not
- [x] 2.3 If `lessonId` absent, identify focused lesson as `max(lessons.created_at)`

## 3. Exercise generation

- [x] 3.1 Call `selectItems(allItems, focusedLessonId, wordCount)` from `lib/session-builder.ts`
- [x] 3.2 Call `buildExercisePrompt(focusedWords, otherWords)` and send to GPT-4o (`gpt-4o`)
- [x] 3.3 Strip markdown fences from GPT-4o response and `JSON.parse` into `ExercisePair[]`

## 4. Expand, shuffle, and enrich with audio

- [x] 4.1 Expand each `ExercisePair` into 3 `Exercise` objects (`reading`, `listening`, `translating`)
- [x] 4.2 Shuffle: interleave so no two consecutive exercises share `type` or `focusWordId`
- [x] 4.3 For each exercise, call `/api/tts` with `hebrewSentence` sequentially and attach `audioUrl`

## 5. Return and verify

- [x] 5.1 Return the complete `Exercise[]` as JSON
- [x] 5.2 Manual smoke test: `curl` the endpoint and verify shape, count, and that `audioUrl`s resolve
