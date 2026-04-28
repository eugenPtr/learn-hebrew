export const POS_VALUES = [
  'noun', 'verb', 'adjective', 'adverb',
  'preposition', 'conjunction', 'pronoun', 'phrase', 'other',
] as const
export type Pos = (typeof POS_VALUES)[number]

export const GENDER_VALUES = ['masculine', 'feminine'] as const
export type Gender = (typeof GENDER_VALUES)[number]

export const BINYAN_VALUES = [
  'paal', 'nifal', 'piel', 'pual', 'hitpael', 'hifil', 'hufal',
] as const
export type Binyan = (typeof BINYAN_VALUES)[number]

export type Conjugations = { present: string[] }

export type WordFields = {
  hebrew: string
  english: string
  pos: Pos | null
  gender: Gender | null
  binyan: Binyan | null
  root: string | null
  conjugations: Conjugations | null
}
