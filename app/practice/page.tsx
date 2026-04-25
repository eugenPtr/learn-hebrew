'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import HebrewKeyboard from '@/components/HebrewKeyboard'
import type { VocabularyItem } from '@/lib/flashcard-selection'

// Strip Hebrew nikud/cantillation marks (U+0591–U+05C7) then trim
function normalize(s: string): string {
  return s.replace(/[֑-ׇ]/g, '').trim()
}

type CardResult = { itemId: string; mistakeMade: boolean }

type State =
  | { phase: 'picking' }
  | { phase: 'loading' }
  | { phase: 'running'; deck: VocabularyItem[]; index: number; results: CardResult[]; input: string }
  | { phase: 'revealed'; deck: VocabularyItem[]; index: number; results: CardResult[]; input: string; audio: HTMLAudioElement | null }
  | { phase: 'summary'; results: CardResult[]; total: number }

export default function PracticePage() {
  const router = useRouter()
  const [state, setState] = useState<State>({ phase: 'picking' })
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function startSession(count: number) {
    setState({ phase: 'loading' })
    setFetchError(null)
    try {
      const res = await fetch(`/api/flashcard?count=${count}`)
      if (!res.ok) throw new Error(`Failed to load cards: ${res.status}`)
      const deck: VocabularyItem[] = await res.json()
      if (deck.length === 0) {
        setFetchError('No vocabulary items found. Add some lessons first.')
        setState({ phase: 'picking' })
        return
      }
      setState({ phase: 'running', deck, index: 0, results: [], input: '' })
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : String(err))
      setState({ phase: 'picking' })
    }
  }

  function checkAnswer() {
    if (state.phase !== 'running') return
    const { deck, index, results, input } = state
    const card = deck[index]
    if (normalize(input) === normalize(card.hebrew)) {
      // Correct
      const newResults = [...results, { itemId: card.id, mistakeMade: false }]
      const newDeck = deck.filter((_, i) => i !== index)
      if (newDeck.length === 0) {
        setState({ phase: 'summary', results: newResults, total: newResults.length })
      } else {
        const nextIndex = index < newDeck.length ? index : 0
        setState({ phase: 'running', deck: newDeck, index: nextIndex, results: newResults, input: '' })
      }
    } else {
      // Wrong
      const newResults = [...results, { itemId: card.id, mistakeMade: true }]
      const audio = card.audio_url ? new Audio(card.audio_url) : null
      setState({ phase: 'revealed', deck, index, results: newResults, input, audio })
    }
  }

  function idk() {
    if (state.phase !== 'running') return
    const { deck, index, results, input } = state
    const card = deck[index]
    const newResults = [...results, { itemId: card.id, mistakeMade: true }]
    const audio = card.audio_url ? new Audio(card.audio_url) : null
    setState({ phase: 'revealed', deck, index, results: newResults, input, audio })
  }

  function continueAfterRevealed() {
    if (state.phase !== 'revealed') return
    const { deck, index, results } = state
    // Re-insert card at random position >= index + 3, or end if fewer than 3 remain
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

  // --- Picking ---
  if (state.phase === 'picking' || state.phase === 'loading') {
    const loading = state.phase === 'loading'
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-6">
        <h1 className="text-2xl font-bold">Flashcard Practice</h1>
        <p className="text-gray-500">How many words?</p>
        {fetchError && <p className="text-red-600 text-sm">{fetchError}</p>}
        <div className="flex flex-col gap-3 w-48">
          {[10, 20, 30].map((n) => (
            <button
              key={n}
              disabled={loading}
              onClick={() => startSession(n)}
              className="w-full py-3 text-lg font-medium border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              {loading ? '…' : `${n} words`}
            </button>
          ))}
        </div>
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
        <p className="self-end text-sm text-gray-400">{remaining} card{remaining !== 1 ? 's' : ''} left</p>

        <div className="w-full rounded-xl border border-gray-200 p-6 text-center shadow-sm">
          <p className="text-sm text-gray-400 mb-1">Translate to Hebrew</p>
          <p className="text-2xl font-semibold">{card.english}</p>
        </div>

        <input
          autoFocus
          dir="rtl"
          type="text"
          value={input}
          onChange={(e) => setState({ ...state, input: e.target.value })}
          onKeyDown={(e) => { if (e.key === 'Enter') checkAnswer() }}
          placeholder="Type Hebrew…"
          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-xl text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <HebrewKeyboard
          onKey={(char) => setState({ ...state, input: input + char })}
          onBackspace={() => setState({ ...state, input: input.slice(0, -1) })}
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
  const { audio } = state
  return (
    <div className="flex flex-col items-center min-h-screen p-6 pt-10 max-w-sm mx-auto gap-6">
      <p className="self-end text-sm text-gray-400">{remaining} card{remaining !== 1 ? 's' : ''} left</p>

      <div className="w-full rounded-xl border border-gray-200 p-6 text-center shadow-sm">
        <p className="text-sm text-gray-400 mb-1">Translate to Hebrew</p>
        <p className="text-2xl font-semibold">{card.english}</p>
      </div>

      <div className="w-full rounded-xl bg-red-50 border border-red-200 p-5 text-center">
        <p className="text-sm text-red-400 mb-1">Correct answer</p>
        <p className="text-3xl font-bold text-red-700" dir="rtl">{card.hebrew}</p>
        {audio && (
          <button
            onClick={() => audio.play()}
            className="mt-3 px-4 py-1 text-sm border border-red-300 rounded-full text-red-600 hover:bg-red-100 transition-colors"
          >
            ▶ Play
          </button>
        )}
      </div>

      <button
        onClick={continueAfterRevealed}
        className="w-full py-3 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-900 transition-colors"
      >
        Continue
      </button>
    </div>
  )
}
