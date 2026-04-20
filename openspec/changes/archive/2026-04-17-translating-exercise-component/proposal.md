## Why

The third and final exercise type for M2. The translating exercise shows an English sentence and asks the user to type the Hebrew translation — the inverse of the reading exercise. With this done all three exercise types exist and the `/practice` runner (EUG-20) can be wired up.

## What Changes

- Add `components/exercises/TranslatingExercise.tsx` — self-contained client component for the translating exercise type

## Capabilities

### New Capabilities
- `translating-exercise`: Display English sentence, accept RTL Hebrew translation input, score against `exercise.hebrewSentence`, report result via callback

### Modified Capabilities
<!-- No existing spec-level behavior changes -->

## Impact

- New file: `components/exercises/TranslatingExercise.tsx`
- Consumed by: `/practice` page (EUG-20)
- No API calls — `exercise.audioUrl` available for optional playback after submission
