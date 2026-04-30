## 1. Data Layer

- [x] 1.1 Extend `VocabularyItem` type in `lib/flashcard-selection.ts` to add `pos: string | null`, `binyan: string | null`, `conjugations: { present: string[] } | null`
- [x] 1.2 Update `GET /api/flashcard` query in `app/api/flashcard/route.ts` to select `pos, binyan, conjugations` alongside existing fields
- [x] 1.3 Map the new fields in the `items` array construction in the same route handler

## 2. Binyan Pattern Lookup

- [x] 2.1 Add a static `BINYAN_PATTERNS` constant in `app/practice/page.tsx` mapping each binyan key to `{ name, infinitive, msgPresent }` (covering paal, piel, hifil, hitpael)

## 3. Revealed Card — Binyan Row

- [x] 3.1 In the `revealed` phase render block, add a binyan row below `card.hebrew`: show binyan display name and `infinitive / msgPresent` patterns, all wrapped in `dir="rtl"` spans, only when `card.pos === 'verb' && card.binyan != null`

## 4. Revealed Card — Conjugations Accordion

- [x] 4.1 Add initialisation logic that reads `window.matchMedia('(min-width: 768px)').matches` to set initial open state for the accordion
- [x] 4.2 Render a `<details>` accordion labelled "Conjugations" below the answer card box, controlled by the open state, only when `card.pos === 'verb' && card.conjugations?.present`
- [x] 4.3 Inside the accordion, render a 9-row table pairing each hardcoded Hebrew pronoun (`אֲנִי` … `הֵן`) with `conjugations.present[i]`, both columns `dir="rtl"`
