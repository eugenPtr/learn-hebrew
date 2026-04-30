## 1. Lesson List — Show Word Count

- [x] 1.1 Update `LessonList.tsx` to render each lesson's `word_count` alongside its title (e.g. "14 words")

## 2. Flashcard Page — State Machine

- [x] 2.1 Add `count-picking` phase to the `State` union in `app/practice/page.tsx`: `{ phase: 'count-picking'; lesson: LessonSummary; lessons: LessonSummary[] }`
- [x] 2.2 Rename the existing `picking` phase to `lesson-picking` throughout the file for clarity
- [x] 2.3 Wire lesson selection: clicking a lesson in the list transitions to `count-picking` instead of calling `startSession` directly

## 3. Flashcard Page — Count Picker UI

- [x] 3.1 Render the count-picking screen: show selected lesson name and word count as subtitle; render four buttons (10, 20, 30, All(N))
- [x] 3.2 Disable the 10 / 20 / 30 buttons when the lesson's `word_count` is less than that count; "All(N)" is always enabled
- [x] 3.3 Label the "All" button as "All (N)" where N equals `lesson.word_count`
- [x] 3.4 Add a back arrow on the count-picking screen that returns to the `lesson-picking` state (no refetch)
- [x] 3.5 On count button tap: call `startSession(lesson, count)` — for All(N), pass `lesson.word_count` as count

## 4. Flashcard Page — startSession Update

- [x] 4.1 Update `startSession` signature to accept `count: number` and pass it as the `count` query param: `GET /api/flashcard?lessonId=<id>&count=<count>`
- [x] 4.2 On fetch error, return to `count-picking` state (not `lesson-picking`) so the user can retry or pick a different count

## 5. API — Honor count with lessonId

- [x] 5.1 In `app/api/flashcard/route.ts`, when `lessonId` is present apply `Math.min(count, items.length)` instead of `Math.min(items.length, MAX_LESSON_COUNT)` — use the count from the query param (defaulting to `MAX_LESSON_COUNT` if absent for backwards compatibility)
