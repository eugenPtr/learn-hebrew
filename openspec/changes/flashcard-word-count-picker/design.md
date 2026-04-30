## Context

The flashcard practice page currently presents a lesson list as its first (and only) picking screen. Selecting a lesson immediately starts a session using all words in that lesson, capped at 30 (`MAX_LESSON_COUNT`). The `count` query param accepted by `GET /api/flashcard` is silently ignored when `lessonId` is also present.

Users have no way to scope a session to fewer words than the full lesson — useful when short on time or drilling a specific subset.

## Goals / Non-Goals

**Goals:**
- Add a count-picking screen between lesson selection and session start.
- Disable count options that exceed the lesson's word count.
- Show word count per lesson in the lesson list so users can anticipate their options.
- Fix the API to honor `count` when `lessonId` is present.

**Non-Goals:**
- Changing the running/revealed/summary phases.
- Persistent user preferences for count.
- Filtering by specific words within a lesson (e.g. hardest, newest).

## Decisions

### Decision: Count picker comes after lesson selection

**Chosen:** lesson → count.  
**Alternative considered:** count → lesson (what the user originally explored, then rejected).  
**Rationale:** Users need to see the word count per lesson before deciding which count option makes sense. If count came first and they picked 30, they'd discover on the lesson list that most lessons have fewer — forcing them to pick "All" anyway or go back. Lesson-first lets the count screen show accurate, lesson-specific options.

### Decision: Disabled buttons rather than hidden ones

**Chosen:** Render all four buttons (10 / 20 / 30 / All(N)); disable those that exceed `lesson.word_count`.  
**Alternative considered:** Only render buttons ≤ word_count.  
**Rationale:** Disabled buttons communicate that 20 and 30 exist as concepts even if unavailable for this lesson. This avoids confusion ("why does this lesson only show two buttons?") and makes the constraint legible.

### Decision: "All(N)" always enabled, label includes count

**Chosen:** Button reads "All (N)" where N = lesson.word_count; never disabled.  
**Rationale:** A lesson with any words can always be practiced in full. Showing N removes ambiguity — the user knows exactly how many cards they'll get.

### Decision: Back arrow returns to lesson list, not to home

**Chosen:** Back arrow sets state back to `lesson-picking` (lessons already in memory).  
**Alternative considered:** Back arrow navigates to `/`.  
**Rationale:** Users landing on the count-picking screen most likely want to pick a different lesson, not abandon practice entirely. Preserving lesson list state avoids a refetch.

### Decision: API fix — one-line change

**Chosen:** When both `lessonId` and `count` are present, apply `Math.min(count, items.length)` instead of `Math.min(items.length, MAX_LESSON_COUNT)`.  
**Rationale:** `MAX_LESSON_COUNT` was a stand-in for a count the user never got to specify. Now that the user provides an explicit count, the cap should be that count (or the lesson size, whichever is smaller).

## Risks / Trade-offs

- **Lessons with 0 words** — The existing empty-lesson guard stays in place; "All (0)" would be disabled (0 < any positive count), but this edge case is unlikely given DB constraints.
- **Extra tap in the happy path** — Users who always want all words now tap twice (lesson → All(N)) instead of once. Trade-off accepted; the extra step prevents accidental 30-card sessions on small lessons.

## State machine delta

```
Before: loading-lessons → lesson-picking → loading → running → revealed → summary
After:  loading-lessons → lesson-picking → count-picking → loading → running → revealed → summary
                                          ↑ back arrow ↓
                                      (lesson-picking)
```

New state shape:
```ts
| { phase: 'count-picking'; lesson: LessonSummary; lessons: LessonSummary[] }
```
The existing `picking` / `lesson-picking` state is unchanged. `startSession` gains a `count: number` argument (where `lesson.word_count` is passed for "All").
