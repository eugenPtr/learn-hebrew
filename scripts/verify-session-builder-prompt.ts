import { selectItems, buildExercisePrompt, ExercisePair, VocabularyItem } from '../lib/session-builder'

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
const prompt = buildExercisePrompt(focusedWords, otherWords)

async function main() {
const res = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
  },
  body: JSON.stringify({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
  }),
})

const data = await res.json()
const content = data.choices?.[0]?.message?.content

if (!content) {
  console.error('No content in response:', JSON.stringify(data, null, 2))
  process.exit(1)
}

console.log('=== Raw LLM response ===')
console.log(content)
console.log()

// Strip markdown code fences if present
const stripped = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()

let parsed: ExercisePair[]
try {
  parsed = JSON.parse(stripped)
} catch {
  console.error('FAIL: Response is not valid JSON')
  process.exit(1)
}

function validateVariant(v: any): boolean {
  return typeof v?.hebrewSentence === 'string' && v.hebrewSentence.length > 0
    && typeof v?.englishSentence === 'string' && v.englishSentence.length > 0
    && Array.isArray(v?.wordsUsed)
}

console.log('=== Validation ===')
let allValid = true
for (const pair of parsed) {
  const hasId = typeof pair.focusWordId === 'string'
  const readingOk = validateVariant(pair.reading)
  const listeningOk = validateVariant(pair.listening)
  const translatingOk = validateVariant(pair.translating)
  const distinct = pair.reading?.hebrewSentence !== pair.listening?.hebrewSentence
    && pair.listening?.hebrewSentence !== pair.translating?.hebrewSentence
  const valid = hasId && readingOk && listeningOk && translatingOk && distinct
  if (!valid) allValid = false
  console.log(`focusWordId=${pair.focusWordId}: ${valid ? '✓ PASS' : '✗ FAIL'}`)
  console.log(`  reading:     ${pair.reading?.hebrewSentence} → ${pair.reading?.englishSentence}`)
  console.log(`  listening:   ${pair.listening?.hebrewSentence} → ${pair.listening?.englishSentence}`)
  console.log(`  translating: ${pair.translating?.hebrewSentence} → ${pair.translating?.englishSentence}`)
  if (!distinct) console.log('  ✗ sentences are not distinct')
}

console.log()
console.log(allValid ? '✓ ALL PAIRS VALID — ExercisePair[] shape confirmed' : '✗ SOME PAIRS INVALID')
process.exit(allValid ? 0 : 1)
}

main()
