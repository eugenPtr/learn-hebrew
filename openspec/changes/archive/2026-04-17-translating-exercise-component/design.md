## Context

The translating exercise shows a full English sentence and asks the user to type the Hebrew translation. It's the inverse of the reading exercise: the prompt is English, the answer is Hebrew. Scoring compares the user's Hebrew input against `exercise.hebrewSentence` using the same 70% token-match logic used in the other two components.

## Goals / Non-Goals

**Goals:**
- Display `exercise.englishSentence` as the prompt
- RTL Hebrew input (`dir="rtl"`, `lang="he"`)
- Speaker button to play `exercise.audioUrl` — useful after submission to hear the correct pronunciation (no autoplay)
- Score via 70% token match against `exercise.hebrewSentence`
- Inline feedback with Hebrew sentence revealed after submission
- Call `onComplete(correct: boolean)` on "Next"

**Non-Goals:**
- Autoplay on mount (no audio cue needed — the prompt is text)
- Server-side scoring

## Decisions

**No autoplay** — Unlike the listening exercise, the user has a visible text prompt. Audio is available as an optional aid but shouldn't interrupt.

**Reveal Hebrew sentence after submission** — Same pattern as the other components. After submitting, show the correct Hebrew so the user can compare.

**Same props interface and scoring** — Consistent with ReadingExercise and ListeningExercise. Runner code stays simple.

## Risks / Trade-offs

- **Hebrew input on desktop** — Users may not have a Hebrew keyboard. Acceptable for now; a virtual keyboard is a future enhancement.
