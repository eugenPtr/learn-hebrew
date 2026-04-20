import { selectItems, buildExercisePrompt, VocabularyItem } from '../lib/session-builder'

const LESSON_A = 'lesson-a-id'
const LESSON_B = 'lesson-b-id'

const items: VocabularyItem[] = [
  { id: '1', lessonId: LESSON_A, hebrew: 'כלב', english: 'dog', numberUsed: 3, mistakes: 1, lastUsedAt: null, lastMistakeAt: null, createdAt: '2026-01-01' },
  { id: '2', lessonId: LESSON_A, hebrew: 'חתול', english: 'cat', numberUsed: 2, mistakes: 0, lastUsedAt: null, lastMistakeAt: null, createdAt: '2026-01-01' },
  { id: '3', lessonId: LESSON_A, hebrew: 'בית', english: 'house', numberUsed: 5, mistakes: 2, lastUsedAt: null, lastMistakeAt: null, createdAt: '2026-01-01' },
  { id: '4', lessonId: LESSON_B, hebrew: 'מים', english: 'water', numberUsed: 1, mistakes: 0, lastUsedAt: null, lastMistakeAt: null, createdAt: '2026-01-01' },
  { id: '5', lessonId: LESSON_B, hebrew: 'לחם', english: 'bread', numberUsed: 2, mistakes: 1, lastUsedAt: null, lastMistakeAt: null, createdAt: '2026-01-01' },
]

const { focusedWords, otherWords } = selectItems(items, LESSON_A, 10)

console.log('=== selectItems result ===')
console.log('focusedWords:', focusedWords.map(w => w.english))
console.log('otherWords:', otherWords.map(w => w.english))
console.log()

const prompt = buildExercisePrompt(focusedWords, otherWords)

console.log('=== buildExercisePrompt output ===')
console.log(prompt)
