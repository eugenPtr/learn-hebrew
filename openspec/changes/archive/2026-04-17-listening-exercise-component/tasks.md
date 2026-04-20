## 1. Scaffold the component

- [x] 1.1 Create `components/exercises/ListeningExercise.tsx` with props interface and state structure
- [x] 1.2 Auto-play `exercise.audioUrl` on mount via `useEffect`
- [x] 1.3 Render speaker button that replays audio on click

## 2. Input and submission

- [x] 2.1 Render RTL Hebrew input (`dir="rtl"`, `lang="he"`) bound to local state
- [x] 2.2 Render "Check" button that triggers scoring (also trigger on Enter key)
- [x] 2.3 Disable input after submission

## 3. Scoring and feedback

- [x] 3.1 Implement `scoreAnswer(input, reference)` — tokenise, strip punctuation, 70% threshold (same logic as ReadingExercise)
- [x] 3.2 Show inline result: correct/incorrect indicator + reveal `exercise.hebrewSentence`
- [x] 3.3 Render "Next" button after submission that calls `onComplete(correct)`
