## Context

`lib/session-builder.ts` is a pure module — no I/O, no side effects. It provides two functions consumed by `/api/session`: word selection and LLM prompt construction. Keeping it pure makes it easy to unit test and reason about independently of the API route.

## Goals / Non-Goals

**Goals:**
- Implement `selectItems` — deterministic (modulo shuffle) focused-lesson word selection
- Implement `buildExercisePrompt` — construct an LLM prompt that produces `ExercisePair[]` JSON
- Export shared TypeScript types (`VocabularyItem`, `ExercisePair`, `WordRef`)

**Non-Goals:**
- Calling the LLM (done in `/api/session`)
- DB reads (done in `/api/session`)
- Parsing or validating the LLM response (done in `/api/session`)

## Decisions

**Pure functions over a class** — No shared state, simpler to test. Each function takes plain data and returns plain data.

**Shuffle focused words before slicing** — Randomises which items appear when the lesson has more than `wordCount` items, giving variety across sessions.

**`otherWords` as context only** — The prompt includes them so the LLM can use them naturally in sentences, but they are never the `focusWordId` of any exercise pair.

**Prompt instructs JSON output** — The prompt must ask the LLM to return a JSON array of `ExercisePair` matching the defined shape. This keeps parsing simple in the caller.

**Natural conversational sentences** — The prompt explicitly asks for sentences a real person would say, not textbook drills. This is a product requirement.

## Risks / Trade-offs

- **LLM prompt quality is opaque** → Mitigation: test prompt manually with a hardcoded item list before wiring to the real API (exit criterion from ticket).
- **Shuffle non-determinism** → Acceptable; variety is the goal. Tests can seed or mock Math.random if needed.
