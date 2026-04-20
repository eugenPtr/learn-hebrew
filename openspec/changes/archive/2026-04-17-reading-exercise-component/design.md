## Context

A reading exercise shows the Hebrew sentence, lets the user hear it via a speaker button, and asks them to type the English translation. Scoring is client-side: tokenise both answer and reference, compare sets, pass if ≥ 70% of reference tokens are covered.

## Goals / Non-Goals

**Goals:**
- Display Hebrew sentence with `dir="rtl"`
- Speaker button plays `exercise.audioUrl` on click (HTML Audio API, no API call)
- English text input + "Check" button
- Inline result feedback (correct / incorrect + correct answer revealed)
- Call `onComplete(correct: boolean)` when user clicks "Next"

**Non-Goals:**
- Recording or speech recognition
- Server-side scoring
- Storing results (handled by the `/practice` runner)

## Decisions

**Tokenisation for scoring** — Split on whitespace, lowercase, strip leading/trailing punctuation (`.,!?;:`). Compare token sets: correct if intersection size ÷ reference token count ≥ 0.7. Lenient enough to handle minor word-order variation and missing articles.

**`new Audio(url).play()` over `<audio>` element** — Simpler for a one-shot play-on-click pattern. No visible audio controls needed.

**Result shown inline, not as a modal** — Keeps the flow lightweight. After submitting, the input is disabled, result is shown, and a "Next" button appears to trigger `onComplete`.

**Props interface:**
```ts
type Exercise = {
  type: 'reading'
  focusWordId: string
  hebrewSentence: string
  englishSentence: string
  wordsUsed: { itemId: string; usedForm: string }[]
  audioUrl: string
}

type Props = {
  exercise: Exercise
  onComplete: (correct: boolean) => void
}
```

## Risks / Trade-offs

- **70% threshold** → May be too lenient or too strict for some answers. Tunable constant, easy to adjust later.
- **Audio autoplay policies** → `new Audio().play()` triggered by user click is safe across browsers. Do not autoplay on mount.
