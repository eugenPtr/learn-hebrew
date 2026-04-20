export type VocabularyItem = {
  id: string
  lessonId: string
  hebrew: string
  english: string
  numberUsed: number
  mistakes: number
  lastUsedAt: string | null
  lastMistakeAt: string | null
  createdAt: string
}

export type WordRef = {
  itemId: string
  usedForm: string
}

export type ExerciseVariant = {
  hebrewSentence: string
  englishSentence: string
  wordsUsed: WordRef[]
}

export type ExercisePair = {
  focusWordId: string
  reading: ExerciseVariant
  listening: ExerciseVariant
  translating: ExerciseVariant
}

export function selectItems(
  allItems: VocabularyItem[],
  focusedLessonId: string,
  wordCount: number = 10
): { focusedWords: VocabularyItem[]; otherWords: VocabularyItem[] } {
  const lessonItems = allItems.filter((item) => item.lessonId === focusedLessonId)
  const otherWords = allItems.filter((item) => item.lessonId !== focusedLessonId)

  // Fisher-Yates shuffle
  const shuffled = [...lessonItems]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }

  const focusedWords = shuffled.slice(0, wordCount)
  return { focusedWords, otherWords }
}

export function buildExercisePrompt(
  focusedWords: VocabularyItem[],
  otherWords: VocabularyItem[]
): string {
  const focusedList = focusedWords
    .map((w) => `- id: ${w.id}, hebrew: "${w.hebrew}", english: "${w.english}"`)
    .join('\n')

  const contextList =
    otherWords.length > 0
      ? otherWords
          .map((w) => `- hebrew: "${w.hebrew}", english: "${w.english}"`)
          .join('\n')
      : '(none)'

  const allWords = [...focusedWords, ...otherWords]
  const allWordsList = allWords
    .map((w) => `- id: ${w.id}, hebrew: "${w.hebrew}", english: "${w.english}"`)
    .join('\n')

  return `You are generating Hebrew language learning exercises for a beginner with a very small vocabulary.

LEARNER VOCABULARY (the content words the learner knows):
${allWordsList}

You may also freely use standard Hebrew grammatical function words as scaffolding:
pronouns (אני, אתה, את, הוא, היא, אנחנו, אתם, הם), the definite article (ה), common prepositions (ב, ל, מ, של, עם, את), and the copula (זה, זאת).

TASK: For each focus word, generate THREE distinct Hebrew expressions — one per exercise type (reading, listening, translating). Each must use the focus word but express a different idea or phrasing. They must not be identical or trivially similar.

FOCUS WORDS:
${focusedList}

SENTENCE RULES (apply to every expression):
1. MEANING FIRST: every expression MUST make real-world sense. Never combine words that produce nonsense.
2. CONTENT WORDS: every content word MUST come from the learner vocabulary above or the allowed function words. Do not invent content words.
3. PREFER SIMPLICITY: if a meaningful sentence cannot be built from available words, use a minimal sensible expression — "יש + noun", "זה + noun", or a single labelled word is fine.
4. Good examples: "יש כלב", "אין חתול", "הוא גר פה", "יש לב אבל אין כלב", "זה החתול שלי".
5. Bad examples: "גרה על חתול" (nonsense), "כלב מים" (noun pile with no meaning).

Return ONLY a valid JSON array. No markdown, no explanation.

Each element MUST match this exact shape:
{
  "focusWordId": "<the id of the focus word>",
  "reading":    { "hebrewSentence": "...", "englishSentence": "...", "wordsUsed": [{ "itemId": "...", "usedForm": "..." }] },
  "listening":  { "hebrewSentence": "...", "englishSentence": "...", "wordsUsed": [{ "itemId": "...", "usedForm": "..." }] },
  "translating":{ "hebrewSentence": "...", "englishSentence": "...", "wordsUsed": [{ "itemId": "...", "usedForm": "..." }] }
}

Additional rules:
- The three sentences for each focus word MUST be different from each other.
- "wordsUsed" includes ONLY learner-vocabulary words (from the list above) that appear in the expression. Do NOT include function words in wordsUsed unless they are in the learner vocabulary list.
- "usedForm" is the exact surface form as it appears in the expression.
- Output only the JSON array. No preamble, no trailing text.`
}
