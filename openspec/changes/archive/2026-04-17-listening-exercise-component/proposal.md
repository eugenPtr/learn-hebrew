## Why

The M2 practice session needs a listening exercise component — the second of three exercise types. The user hears a Hebrew sentence and must type what they heard in Hebrew, with no visible text to read. This tests listening comprehension rather than translation.

## What Changes

- Add `components/exercises/ListeningExercise.tsx` — a self-contained client component for the listening exercise type

## Capabilities

### New Capabilities
- `listening-exercise`: Auto-play Hebrew audio on mount, accept RTL Hebrew transcription input, score against the Hebrew sentence, and report result via callback

### Modified Capabilities
<!-- No existing spec-level behavior changes -->

## Impact

- New file: `components/exercises/ListeningExercise.tsx`
- Consumed by: `/practice` page (EUG-20)
- No API calls — uses `exercise.audioUrl` directly
