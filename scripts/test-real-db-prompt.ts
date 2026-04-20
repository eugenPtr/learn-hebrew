import { selectItems, buildExercisePrompt, VocabularyItem, ExercisePair } from '../lib/session-builder'

const items: VocabularyItem[] = [
  { id: '1', lessonId: 'L1', hebrew: 'כלב', english: 'dog', numberUsed: 0, mistakes: 0, lastUsedAt: null, lastMistakeAt: null, createdAt: '' },
  { id: '2', lessonId: 'L1', hebrew: 'חתול', english: 'cat', numberUsed: 0, mistakes: 0, lastUsedAt: null, lastMistakeAt: null, createdAt: '' },
  { id: '3', lessonId: 'L1', hebrew: 'לב', english: 'heart', numberUsed: 0, mistakes: 0, lastUsedAt: null, lastMistakeAt: null, createdAt: '' },
  { id: '4', lessonId: 'L1', hebrew: 'גר', english: 'lives (m. sg.)', numberUsed: 0, mistakes: 0, lastUsedAt: null, lastMistakeAt: null, createdAt: '' },
  { id: '5', lessonId: 'L1', hebrew: 'גרה', english: 'lives (f. sg.)', numberUsed: 0, mistakes: 0, lastUsedAt: null, lastMistakeAt: null, createdAt: '' },
  { id: '6', lessonId: 'L1', hebrew: 'על', english: 'on / about', numberUsed: 0, mistakes: 0, lastUsedAt: null, lastMistakeAt: null, createdAt: '' },
  { id: '7', lessonId: 'L1', hebrew: 'אין', english: 'there is no', numberUsed: 0, mistakes: 0, lastUsedAt: null, lastMistakeAt: null, createdAt: '' },
  { id: '8', lessonId: 'L1', hebrew: 'יש', english: 'there is', numberUsed: 0, mistakes: 0, lastUsedAt: null, lastMistakeAt: null, createdAt: '' },
  { id: '9', lessonId: 'L1', hebrew: 'אבל', english: 'but', numberUsed: 0, mistakes: 0, lastUsedAt: null, lastMistakeAt: null, createdAt: '' },
  { id: '10', lessonId: 'L1', hebrew: 'כש', english: 'when', numberUsed: 0, mistakes: 0, lastUsedAt: null, lastMistakeAt: null, createdAt: '' },
  { id: '11', lessonId: 'L1', hebrew: 'אז', english: 'then / so', numberUsed: 0, mistakes: 0, lastUsedAt: null, lastMistakeAt: null, createdAt: '' },
]

async function main() {
  const { focusedWords, otherWords } = selectItems(items, 'L1', 11)
  const prompt = buildExercisePrompt(focusedWords, otherWords)

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify({ model: 'gpt-4o', messages: [{ role: 'user', content: prompt }], temperature: 0.7 }),
  })
  const data = await res.json()
  const content = data.choices?.[0]?.message?.content ?? ''
  const stripped = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
  const pairs: ExercisePair[] = JSON.parse(stripped)

  console.log('Generated sentences:')
  for (const p of pairs) {
    console.log(`  [${p.focusWordId}]`)
    console.log(`    reading:     ${p.reading.hebrewSentence} → ${p.reading.englishSentence}`)
    console.log(`    listening:   ${p.listening.hebrewSentence} → ${p.listening.englishSentence}`)
    console.log(`    translating: ${p.translating.hebrewSentence} → ${p.translating.englishSentence}`)
  }
}

main()
