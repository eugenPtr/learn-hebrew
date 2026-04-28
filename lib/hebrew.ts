// Fixed pronoun order used by all conjugation arrays in vocabulary_items.conjugations.
// Conjugation tense arrays (e.g. conjugations.present) are 9-element arrays where
// each index maps to the pronoun at the same index here.
export const PRONOUN_ORDER = [
  'ani',      // 0  אני        (I)
  'ata',      // 1  אתה        (you, m sg)
  'at',       // 2  את         (you, f sg)
  'hoo',      // 3  הוא        (he)
  'hee',      // 4  היא        (she)
  'anahnoo',  // 5  אנחנו      (we)
  'atem',     // 6  אתם        (you, pl)
  'hem',      // 7  הם         (they, m)
  'hen',      // 8  הן         (they, f)
] as const

export type Pronoun = (typeof PRONOUN_ORDER)[number]

// Hebrew display labels (for UI rendering of conjugation rows).
export const PRONOUN_LABELS_HE: Record<Pronoun, string> = {
  ani: 'אני',
  ata: 'אתה',
  at: 'את',
  hoo: 'הוא',
  hee: 'היא',
  anahnoo: 'אנחנו',
  atem: 'אתם',
  hem: 'הם',
  hen: 'הן',
}

// Strip Hebrew nikud / cantillation marks (U+0591–U+05C7) and trim.
export function normalizeHebrew(s: string): string {
  return s.replace(/[֑-ׇ]/g, '').trim()
}
