'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import HebrewKeyboard from '@/components/HebrewKeyboard'
import LessonList from '@/components/LessonList'
import type { LessonSummary } from '@/components/LessonList'
import type { VocabularyItem } from '@/lib/flashcard-selection'

// Strip Hebrew nikud/cantillation marks (U+0591–U+05C7) then trim
function normalize(s: string): string {
  return s.replace(/[֑-ׇ]/g, '').trim()
}

const BINYAN_PATTERNS: Record<string, { name: string; infinitive: string; msgPresent: string }> = {
  paal:    { name: "Pa'al",     infinitive: 'לִXXוֹX',       msgPresent: 'XוֹXֵX' },
  piel:    { name: "Pi'el",     infinitive: 'לְXַXֵX',       msgPresent: 'מְXַXֵX' },
  hifil:   { name: "Hif'il",    infinitive: 'לְהַXXִיX',     msgPresent: 'מַXXִיX' },
  hitpael: { name: "Hitpa'el",  infinitive: 'לְהִתְXַXֵX',   msgPresent: 'מִתְXַXֵX' },
}

const PRONOUNS = ['אֲנִי', 'אַתָּה', 'אַתְּ', 'הוּא', 'הִיא', 'אֲנַחְנוּ', 'אַתֶּם', 'הֵם', 'הֵן']

type CardResult = { itemId: string; mistakeMade: boolean }

type State =
  | { phase: 'loading-lessons' }
  | { phase: 'lesson-picking'; lessons: LessonSummary[] }
  | { phase: 'count-picking'; lesson: LessonSummary; lessons: LessonSummary[] }
  | { phase: 'loading'; lesson: LessonSummary; lessons: LessonSummary[]; count: number }
  | { phase: 'running'; deck: VocabularyItem[]; index: number; results: CardResult[]; input: string }
  | { phase: 'revealed'; deck: VocabularyItem[]; index: number; results: CardResult[]; input: string }
  | { phase: 'summary'; results: CardResult[]; total: number }

export default function PracticePage() {
  const router = useRouter()
  const [state, setState] = useState<State>({ phase: 'loading-lessons' })
  const inputRef = useRef<HTMLInputElement>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const cardIndex = state.phase === 'running' || state.phase === 'revealed' ? state.index : -1
  useEffect(() => {
    if (state.phase === 'running') inputRef.current?.focus()
  }, [state.phase, cardIndex])

  // Pre-load audio when a card is revealed so it's ready before the user taps Play
  const revealedCardId = state.phase === 'revealed' ? state.deck[state.index].id : null
  useEffect(() => {
    if (state.phase !== 'revealed') return
    setAudioError(false)
    setCopied(false)
    const card = state.deck[state.index]
    const audio = card.audio_url ? new Audio(card.audio_url) : null
    if (audio) {
      audio.addEventListener('error', () => {
        const err = audio.error
        console.error('[flashcard audio] load error', { code: err?.code, message: err?.message, url: card.audio_url })
        setAudioError(true)
      })
      audio.addEventListener('loadedmetadata', () => {
        console.log('[flashcard audio] loaded', { duration: audio.duration, url: card.audio_url })
      })
    }
    audioRef.current = audio
  }, [revealedCardId]) // eslint-disable-line react-hooks/exhaustive-deps

  const [conjugationsOpen, setConjugationsOpen] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches
  )
  const [audioError, setAudioError] = useState(false)
  const [copied, setCopied] = useState(false)

  const [fetchError, setFetchError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetch('/api/lessons')
      .then((r) => r.json())
      .then((data: Array<{ id: string; title: string | null; created_at: string; word_count: number }>) => {
        const lessons: LessonSummary[] = data.map((l, i) => ({ ...l, position: i + 1 }))
        setState({ phase: 'lesson-picking', lessons })
      })
      .catch((err) => {
        setFetchError(err instanceof Error ? err.message : String(err))
        setState({ phase: 'lesson-picking', lessons: [] })
      })
  }, [])

  async function startSession(lesson: LessonSummary, lessons: LessonSummary[], count: number) {
    setState({ phase: 'loading', lesson, lessons, count })
    setFetchError(null)
    try {
      const res = await fetch(`/api/flashcard?lessonId=${lesson.id}&count=${count}`)
      if (!res.ok) throw new Error(`Failed to load cards: ${res.status}`)
      const deck: VocabularyItem[] = await res.json()
      if (deck.length === 0) {
        setFetchError(`"${lesson.title ?? `Lesson ${lesson.position}`}" has no vocabulary items.`)
        setState({ phase: 'count-picking', lesson, lessons })
        return
      }
      setState({ phase: 'running', deck, index: 0, results: [], input: '' })
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : String(err))
      setState({ phase: 'count-picking', lesson, lessons })
    }
  }

  function checkAnswer() {
    if (state.phase !== 'running') return
    const { deck, index, results, input } = state
    const card = deck[index]
    if (normalize(input) === normalize(card.hebrew)) {
      const newResults = [...results, { itemId: card.id, mistakeMade: false }]
      const newDeck = deck.filter((_, i) => i !== index)
      if (newDeck.length === 0) {
        setState({ phase: 'summary', results: newResults, total: newResults.length })
      } else {
        const nextIndex = index < newDeck.length ? index : 0
        setState({ phase: 'running', deck: newDeck, index: nextIndex, results: newResults, input: '' })
      }
    } else {
      const newResults = [...results, { itemId: card.id, mistakeMade: true }]
      setState({ phase: 'revealed', deck, index, results: newResults, input })
    }
  }

  function idk() {
    if (state.phase !== 'running') return
    const { deck, index, results, input } = state
    const card = deck[index]
    const newResults = [...results, { itemId: card.id, mistakeMade: true }]
    setState({ phase: 'revealed', deck, index, results: newResults, input })
  }

  function continueAfterRevealed() {
    if (state.phase !== 'revealed') return
    const { deck, index, results } = state
    const card = deck[index]
    const remaining = deck.filter((_, i) => i !== index)
    const minPos = Math.min(index + 3, remaining.length)
    const insertAt = minPos + Math.floor(Math.random() * (remaining.length - minPos + 1))
    const newDeck = [...remaining.slice(0, insertAt), card, ...remaining.slice(insertAt)]
    setState({ phase: 'running', deck: newDeck, index, results, input: '' })
  }

  async function handleDone() {
    if (state.phase !== 'summary') return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const res = await fetch('/api/flashcard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ results: state.results }),
      })
      if (!res.ok) throw new Error(`Failed to save results: ${res.status}`)
      router.push('/')
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : String(err))
      setSubmitting(false)
    }
  }

  function handleGenerateSentences() {
    if (state.phase !== 'summary') return
    const uniqueIds = [...new Set(state.results.map((r) => r.itemId))]
    router.push(`/practice/sentences?itemIds=${uniqueIds.join(',')}`)
  }

  // --- Loading lessons ---
  if (state.phase === 'loading-lessons') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-400">Loading lessons…</p>
      </div>
    )
  }

  // --- Lesson picking ---
  if (state.phase === 'lesson-picking') {
    return (
      <div className="flex flex-col min-h-screen gap-6 max-w-lg mx-auto p-6">
        <h1 className="text-2xl font-bold">Flashcard Practice</h1>
        <p className="text-gray-500 text-sm">Pick a lesson to practice.</p>
        {fetchError && <p className="text-red-600 text-sm">{fetchError}</p>}
        <LessonList
          lessons={state.lessons}
          onSelect={(lesson) => setState({ phase: 'count-picking', lesson, lessons: state.lessons })}
        />
      </div>
    )
  }

  // --- Count picking ---
  if (state.phase === 'count-picking') {
    const { lesson, lessons } = state
    const lessonLabel = lesson.title ?? `Lesson ${lesson.position}`
    return (
      <div className="flex flex-col min-h-screen gap-6 max-w-lg mx-auto p-6">
        <button
          onClick={() => setState({ phase: 'lesson-picking', lessons })}
          className="self-start text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Back to lesson selection"
        >
          ← Back
        </button>
        <div>
          <h1 className="text-2xl font-bold">{lessonLabel}</h1>
          <p className="text-gray-500 text-sm mt-1">{lesson.word_count} words</p>
        </div>
        {fetchError && <p className="text-red-600 text-sm">{fetchError}</p>}
        <p className="text-gray-600">How many words to practice?</p>
        <div className="flex flex-col gap-3">
          {[10, 20, 30].map((c) => (
            <button
              key={c}
              disabled={lesson.word_count < c}
              onClick={() => startSession(lesson, lessons, c)}
              className="w-full py-3 rounded-xl border border-gray-200 bg-white text-gray-900 font-medium hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              {c}
            </button>
          ))}
          <button
            onClick={() => startSession(lesson, lessons, lesson.word_count)}
            className="w-full py-3 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 font-medium hover:bg-blue-100 transition"
          >
            All ({lesson.word_count})
          </button>
        </div>
      </div>
    )
  }

  // --- Loading session ---
  if (state.phase === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-400">Loading cards…</p>
      </div>
    )
  }

  // --- Summary ---
  if (state.phase === 'summary') {
    const { results, total } = state
    const correct = results.filter((r) => !r.mistakeMade).length
    const mistakes = results.filter((r) => r.mistakeMade).length
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-6 max-w-sm mx-auto">
        <h1 className="text-2xl font-bold">Session Complete</h1>
        <div className="text-5xl font-bold text-blue-600">{correct} / {total}</div>
        <div className="w-full space-y-2 text-center">
          <p className="text-gray-600">First-attempt correct: <span className="font-semibold text-green-600">{correct}</span></p>
          <p className="text-gray-600">Mistakes: <span className="font-semibold text-red-500">{mistakes}</span></p>
        </div>
        {submitError && (
          <p className="text-red-600 text-sm">Failed to save: {submitError}</p>
        )}
        <button
          onClick={handleGenerateSentences}
          className="w-full bg-purple-600 text-white rounded-lg py-3 font-medium hover:bg-purple-700 transition-colors"
        >
          Generate sentences with these words
        </button>
        <button
          onClick={handleDone}
          disabled={submitting}
          className="w-full bg-gray-800 text-white rounded-lg py-3 font-medium hover:bg-gray-900 disabled:opacity-50 transition-colors"
        >
          {submitting ? 'Saving…' : 'Done'}
        </button>
      </div>
    )
  }

  // --- Running ---
  const { deck, index, input } = state
  const card = deck[index]
  const remaining = deck.length

  if (state.phase === 'running') {
    return (
      <div className="flex flex-col items-center min-h-screen p-6 pt-10 max-w-sm mx-auto gap-6">
        <div className="w-full flex justify-between items-center">
          <button
            onClick={() => router.push('/')}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            End practice
          </button>
          <p className="text-sm text-gray-400">{remaining} card{remaining !== 1 ? 's' : ''} left</p>
        </div>

        <div className="w-full rounded-xl border border-gray-200 p-6 text-center shadow-sm">
          <p className="text-sm text-gray-400 mb-1">Translate to Hebrew</p>
          <p className="text-2xl font-semibold">{card.english}</p>
        </div>

        <input
          ref={inputRef}
          dir="rtl"
          type="text"
          value={input}
          onChange={(e) => setState({ ...state, input: e.target.value })}
          onKeyDown={(e) => { if (e.key === 'Enter') checkAnswer() }}
          placeholder="Type Hebrew…"
          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-xl text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <HebrewKeyboard
          onKey={(char) => {
            setState({ ...state, input: input + char })
            requestAnimationFrame(() => {
              if (inputRef.current) {
                const len = inputRef.current.value.length
                inputRef.current.setSelectionRange(len, len)
              }
            })
          }}
          onBackspace={() => {
            setState({ ...state, input: input.slice(0, -1) })
            requestAnimationFrame(() => {
              if (inputRef.current) {
                const len = inputRef.current.value.length
                inputRef.current.setSelectionRange(len, len)
              }
            })
          }}
        />

        <div className="flex gap-3 w-full">
          <button
            onClick={idk}
            className="flex-1 py-3 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
          >
            I don&apos;t know
          </button>
          <button
            onClick={checkAnswer}
            className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Check
          </button>
        </div>
      </div>
    )
  }

  // --- Revealed ---
  return (
    <div className="flex flex-col items-center min-h-screen p-6 pt-10 max-w-sm mx-auto gap-6">
      <div className="w-full flex justify-between items-center">
        <button
          onClick={() => router.push('/')}
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          End practice
        </button>
        <p className="text-sm text-gray-400">{remaining} card{remaining !== 1 ? 's' : ''} left</p>
      </div>

      <div className="w-full rounded-xl border border-gray-200 p-6 text-center shadow-sm">
        <p className="text-sm text-gray-400 mb-1">Translate to Hebrew</p>
        <p className="text-2xl font-semibold">{card.english}</p>
      </div>

      <div className="w-full rounded-xl bg-red-50 border border-red-200 p-5 text-center">
        <p className="text-sm text-red-400 mb-1">Correct answer</p>
        <p className="text-3xl font-bold text-red-700" dir="rtl">{card.hebrew}</p>
        {card.pos === 'verb' && card.binyan != null && BINYAN_PATTERNS[card.binyan] && (
          <p className="mt-2 text-sm text-red-500">
            {BINYAN_PATTERNS[card.binyan].name}{' '}
            <span dir="rtl">{BINYAN_PATTERNS[card.binyan].infinitive} / {BINYAN_PATTERNS[card.binyan].msgPresent}</span>
          </p>
        )}
        <button
          onClick={() => navigator.clipboard.writeText(card.hebrew).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) }).catch(console.error)}
          className="mt-2 text-xs text-red-400 hover:text-red-600 flex items-center gap-1 mx-auto transition-colors"
          aria-label="Copy Hebrew text"
        >
          {copied ? 'Copied!' : (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              Copy
            </>
          )}
        </button>
        {card.audio_url && (
          <div className="mt-2 flex flex-col items-center gap-1">
            <button
              onClick={() => {
                setAudioError(false)
                audioRef.current?.play()
                  .then(() => console.log('[flashcard audio] playing'))
                  .catch((err) => { console.error('[flashcard audio] play() rejected:', err); setAudioError(true) })
              }}
              className="px-4 py-1 text-sm border border-red-300 rounded-full text-red-600 hover:bg-red-100 transition-colors"
            >
              ▶ Play
            </button>
            {audioError && <p className="text-xs text-red-400">Audio unavailable</p>}
          </div>
        )}
      </div>

      {card.pos === 'verb' && card.conjugations?.present && (
        <details
          open={conjugationsOpen}
          onToggle={(e) => setConjugationsOpen((e.target as HTMLDetailsElement).open)}
          className="w-full rounded-xl border border-gray-200 bg-white overflow-hidden"
        >
          <summary className="px-5 py-3 cursor-pointer text-sm font-medium text-gray-600 hover:bg-gray-50">
            Conjugations
          </summary>
          <table className="w-full text-sm border-t border-gray-100">
            <tbody>
              {PRONOUNS.map((pronoun, i) => (
                <tr key={pronoun} className="border-b border-gray-50 last:border-0">
                  <td className="px-5 py-2 text-gray-500" dir="rtl">{pronoun}</td>
                  <td className="px-5 py-2 font-medium text-gray-800" dir="rtl">{card.conjugations!.present[i]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      )}

      <button
        onClick={continueAfterRevealed}
        className="w-full py-3 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-900 transition-colors"
      >
        Continue
      </button>
    </div>
  )
}
