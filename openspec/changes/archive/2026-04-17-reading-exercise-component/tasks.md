## 1. Scaffold the component

- [x] 1.1 Create `components/exercises/ReadingExercise.tsx` with props interface and state structure
- [x] 1.2 Render Hebrew sentence with `dir="rtl"` and `lang="he"`
- [x] 1.3 Render speaker button that plays `exercise.audioUrl` on click via `new Audio(url).play()`

## 2. Input and submission

- [x] 2.1 Render English text input bound to local state
- [x] 2.2 Render "Check" button that triggers scoring on click (also trigger on Enter key)
- [x] 2.3 Disable input after submission

## 3. Scoring and feedback

- [x] 3.1 Implement `scoreAnswer(input, reference)` — tokenise, lowercase, strip punctuation, compare sets at 70% threshold
- [x] 3.2 Show inline result: correct/incorrect indicator + correct answer revealed
- [x] 3.3 Render "Next" button after submission that calls `onComplete(correct)`
