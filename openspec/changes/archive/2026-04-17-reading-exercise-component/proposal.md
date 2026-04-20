## Why

The M2 practice session needs three exercise components. The reading exercise is the first: it shows a Hebrew sentence, lets the user play its audio, and asks them to type the English translation. Without it the `/practice` runner (EUG-20) has nothing to render.

## What Changes

- Add `components/exercises/ReadingExercise.tsx` — a self-contained client component for the reading exercise type

## Capabilities

### New Capabilities
- `reading-exercise`: Display a Hebrew sentence with audio playback and English translation input; score the answer and report result via callback

### Modified Capabilities
<!-- No existing spec-level behavior changes -->

## Impact

- New file: `components/exercises/ReadingExercise.tsx`
- Consumed by: `/practice` page (EUG-20)
- No API calls — uses `exercise.audioUrl` directly for audio playback
