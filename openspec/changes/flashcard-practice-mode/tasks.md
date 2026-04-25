## 1. Database migration

- [x] 1.1 Add `audio_url text` nullable column to `vocabulary_items` via Supabase migration

## 2. TTS at indexing time

- [x] 2.1 Update `POST /api/lessons` to call `POST /api/tts` for each net-new vocabulary item after deduplication
- [x] 2.2 Store the returned `audioUrl` in the `audio_url` column of each inserted `vocabulary_items` row
- [x] 2.3 Return `502` if TTS call fails for any item (no partial insert)

## 3. Pluggable word selection

- [x] 3.1 Create `lib/flashcard-selection.ts` with `Strategy` type and `activeStrategy` export
- [x] 3.2 Implement default strategy: recent mistakes (last 3 days) first, then `last_used_at ASC NULLS FIRST` fill, shuffle result
- [x] 3.3 Create `GET /api/flashcard` route — parse `count` param (default 10, reject ≤0), call `activeStrategy.select`, return array
- [x] 3.4 Create `POST /api/flashcard` route — accept `{ results: Array<{ itemId, mistakeMade }> }`, update `last_used_at`, `number_used`, and `last_mistake_at` (mistakes only) in a single DB call

## 4. Hebrew on-screen keyboard component

- [x] 4.1 Create `components/HebrewKeyboard.tsx` — 3-row grid of 27 keys (22 base + 5 final forms) plus backspace
- [x] 4.2 Accept `onKey: (char: string) => void` and `onBackspace: () => void` props
- [x] 4.3 Render only when `typeof window !== 'undefined' && !('ontouchstart' in window)`

## 5. Flashcard practice page

- [x] 5.1 Rewrite `app/practice/page.tsx` as a client component with `picking | loading | running | summary` state machine
- [x] 5.2 `picking` state: render three stacked buttons (10, 20, 30); on click fetch `GET /api/flashcard?count=N` → transition to `loading` then `running`
- [x] 5.3 `running` state: render current card (English prompt, Hebrew text input, IDK button, Check button); show deck count
- [x] 5.4 Implement answer normalization: strip U+0591–U+05C7, trim whitespace, compare
- [x] 5.5 On correct: remove card from deck; if deck empty → `summary`; else next card
- [x] 5.6 On wrong/IDK: transition to `revealed` sub-state (show Hebrew, play button if audio_url present, Continue button); mark card as mistake
- [x] 5.7 On Continue: re-insert card at random position `>= currentIndex + 3` (or end if fewer than 3 remain); advance to next card
- [x] 5.8 Integrate `HebrewKeyboard` — render below input in `running` state; key presses append to input value; backspace removes last char
- [x] 5.9 `summary` state: show total, first-attempt correct count, mistake count; Done button POSTs to `/api/flashcard` then navigates to `/`
- [x] 5.10 Show error and allow retry if POST to `/api/flashcard` fails

## 6. Remove retired code

- [x] 6.1 Delete `app/api/session/route.ts`
- [x] 6.2 Delete `lib/session-builder.ts`
- [x] 6.3 Remove imports of `session-builder` from any remaining files
