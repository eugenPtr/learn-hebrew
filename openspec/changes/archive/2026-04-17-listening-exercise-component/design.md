## Context

The listening exercise is structurally similar to the reading exercise but with key differences: audio auto-plays on mount, the Hebrew sentence is hidden (user is listening, not reading), and the input is RTL Hebrew rather than English. Scoring compares the user's Hebrew transcription against `exercise.hebrewSentence`.

## Goals / Non-Goals

**Goals:**
- Auto-play `exercise.audioUrl` on mount
- Speaker button to replay at any time
- Hide Hebrew sentence until after submission
- RTL Hebrew input (`dir="rtl"`, `lang="he"`)
- Score via 70% token match against `exercise.hebrewSentence`
- Reveal Hebrew sentence after submission with inline feedback
- Call `onComplete(correct: boolean)` on "Next"

**Non-Goals:**
- Speech recognition or recording
- Displaying the Hebrew sentence before submission
- Server-side scoring

## Decisions

**Auto-play on mount via `useEffect`** — `new Audio(url).play()` inside a `useEffect` with empty deps. Browsers allow autoplay triggered by component mount when the page was already interacted with (user navigated to practice). If blocked, the speaker button serves as fallback.

**Same `scoreAnswer` tokenisation as ReadingExercise** — Split on whitespace, lowercase, strip punctuation, 70% threshold. Reused as a local utility — no shared module needed yet.

**Hebrew sentence hidden until submitted** — The exercise tests listening. Revealing the sentence before submission defeats the purpose. After submission it's shown as the "correct answer".

**Same props interface shape as ReadingExercise** — Consistent API across all exercise components makes the runner (EUG-20) simpler.

## Risks / Trade-offs

- **Autoplay blocked by browser** → Speaker button always visible as manual fallback. No error state needed.
- **Hebrew tokenisation** → Hebrew words don't inflect as unpredictably as English for our purposes; 70% threshold is reasonable.
