'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import HebrewKeyboard from '@/components/HebrewKeyboard'
import { normalizeHebrew } from '@/lib/hebrew'

type Theme = {
  id: string
  name: string
  description: string
  created_at: string
}

type Sentence = {
  english: string
  hebrew: string
  usedItemIds: string[]
}

type State =
  | { phase: 'picking'; themes: Theme[] }
  | { phase: 'loading-themes' }
  | { phase: 'generating'; theme: Theme | null }
  | { phase: 'running'; theme: Theme | null; deck: Sentence[]; index: number; input: string }
  | { phase: 'revealed'; theme: Theme | null; deck: Sentence[]; index: number; input: string }
  | { phase: 'feedback'; theme: Theme; deck: Sentence[]; index: number; input: string; feedback: string; rating: 'up' | 'down' }
  | { phase: 'summary'; theme: Theme | null }

export default function SentencesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const itemIdsParam = searchParams.get('itemIds')
  const isItemIdsMode = !!itemIdsParam

  const [state, setState] = useState<State>({ phase: 'loading-themes' })
  const [error, setError] = useState<string | null>(null)
  const [audioUrls, setAudioUrls] = useState<Record<number, string>>({})
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isItemIdsMode) {
      // Skip theme loading — auto-start with item IDs
      const ids = itemIdsParam!.split(',').filter(Boolean)
      setState({ phase: 'generating', theme: null })
      startWithItemIds(ids)
    } else {
      fetch('/api/themes')
        .then((r) => r.json())
        .then((themes: Theme[]) => setState({ phase: 'picking', themes }))
        .catch((err) => setError(err instanceof Error ? err.message : String(err)))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const focusKey = state.phase === 'running' ? state.index : -1
  useEffect(() => {
    if (state.phase === 'running') inputRef.current?.focus()
  }, [state.phase, focusKey])

  async function startWithItemIds(ids: string[]) {
    setError(null)
    setAudioUrls({})
    try {
      const res = await fetch('/api/practice/sentences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemIds: ids, count: 5 }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `Failed: ${res.status}` }))
        throw new Error(err.error ?? 'Failed to generate sentences')
      }
      const { sentences } = (await res.json()) as { sentences: Sentence[] }
      if (!sentences || sentences.length === 0) throw new Error('No sentences returned')
      setState({ phase: 'running', theme: null, deck: sentences, index: 0, input: '' })
      prefetchTts(sentences)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setState({ phase: 'summary', theme: null })
    }
  }

  async function pickTheme(theme: Theme) {
    setError(null)
    setAudioUrls({})
    setState({ phase: 'generating', theme })
    try {
      const res = await fetch('/api/practice/sentences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ themeId: theme.id, count: 5 }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `Failed: ${res.status}` }))
        throw new Error(err.error ?? 'Failed to generate sentences')
      }
      const { sentences } = (await res.json()) as { sentences: Sentence[] }
      if (!sentences || sentences.length === 0) throw new Error('No sentences returned')
      setState({ phase: 'running', theme, deck: sentences, index: 0, input: '' })
      prefetchTts(sentences)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      const themes = (await fetch('/api/themes').then((r) => r.json())) as Theme[]
      setState({ phase: 'picking', themes })
    }
  }

  function prefetchTts(sentences: Sentence[]) {
    sentences.forEach((s, i) => {
      fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: s.hebrew }),
      })
        .then((r) => r.json())
        .then((data: { audioUrl?: string }) => {
          if (data.audioUrl) setAudioUrls((prev) => ({ ...prev, [i]: data.audioUrl! }))
        })
        .catch(() => {})
    })
  }

  function checkAnswer() {
    if (state.phase !== 'running') return
    setState({ ...state, phase: 'revealed' })
  }

  function goToFeedback(rating: 'up' | 'down') {
    if (state.phase !== 'revealed' || !state.theme) return
    setState({ ...state, phase: 'feedback', feedback: '', rating, theme: state.theme })
  }

  function advanceFromRevealed() {
    if (state.phase !== 'revealed') return
    const { theme, deck, index } = state
    if (index + 1 >= deck.length) {
      setState({ phase: 'summary', theme })
    } else {
      setState({ phase: 'running', theme, deck, index: index + 1, input: '' })
    }
  }

  function submitFeedback(feedback: string | null) {
    if (state.phase !== 'feedback') return
    const { theme, deck, index, rating } = state
    const current = deck[index]

    fetch('/api/practice/sentences/rate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        english: current.english,
        hebrew: current.hebrew,
        itemIds: current.usedItemIds,
        themeId: theme.id,
        rating,
        feedback,
      }),
    }).catch(() => {})

    if (index + 1 >= deck.length) {
      setState({ phase: 'summary', theme })
    } else {
      setState({ phase: 'running', theme, deck, index: index + 1, input: '' })
    }
  }

  async function backToPicker() {
    const themes = (await fetch('/api/themes').then((r) => r.json())) as Theme[]
    setState({ phase: 'picking', themes })
    setError(null)
  }

  // --- Render ---

  if (state.phase === 'loading-themes') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-400">Loading themes…</p>
      </div>
    )
  }

  if (state.phase === 'picking') {
    return (
      <main className="flex flex-col max-w-lg mx-auto p-6 gap-5 min-h-screen">
        <Link href="/" className="text-blue-500 text-sm self-start">← Back</Link>
        <h1 className="text-2xl font-semibold">Sentence Practice</h1>
        <p className="text-gray-400 text-sm">Pick a theme to generate 5 sentence exercises.</p>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        {state.themes.length === 0 ? (
          <p className="text-gray-500 text-sm">No themes yet.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {state.themes.map((theme) => (
              <li key={theme.id}>
                <button
                  onClick={() => pickTheme(theme)}
                  className="w-full text-left px-4 py-3 rounded-xl border border-gray-700 hover:border-blue-400 hover:bg-blue-500/10 transition"
                >
                  <span className="font-semibold text-white">{theme.name}</span>
                  <span className="block text-xs text-gray-400 mt-0.5 truncate">
                    {theme.description}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>
    )
  }

  if (state.phase === 'generating') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3 p-6">
        {state.theme ? (
          <>
            <p className="text-gray-300 text-sm">Generating sentences for</p>
            <p className="text-xl font-bold">{state.theme.name}</p>
          </>
        ) : (
          <p className="text-gray-300 text-sm">Generating sentences…</p>
        )}
        <p className="text-gray-500 text-xs">This usually takes a few seconds…</p>
      </div>
    )
  }

  if (state.phase === 'summary') {
    if (isItemIdsMode || !state.theme) {
      return (
        <main className="flex flex-col items-center justify-center min-h-screen gap-6 p-6 max-w-sm mx-auto">
          <h1 className="text-2xl font-bold">All done!</h1>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            onClick={() => router.push('/')}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Done
          </button>
        </main>
      )
    }
    return (
      <main className="flex flex-col items-center justify-center min-h-screen gap-6 p-6 max-w-sm mx-auto">
        <h1 className="text-2xl font-bold">All done!</h1>
        <p className="text-gray-400 text-sm">You finished {state.theme.name}.</p>
        <button
          onClick={backToPicker}
          className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Pick another theme
        </button>
        <Link href="/" className="text-sm text-gray-400 underline">Home</Link>
      </main>
    )
  }

  const deck = state.deck
  const index = state.index
  const current = deck[index]
  const remaining = deck.length - index

  if (state.phase === 'running') {
    return (
      <div className="flex flex-col items-center min-h-screen p-6 pt-10 max-w-sm mx-auto gap-6">
        <div className="w-full flex justify-between items-center">
          <button
            onClick={() => router.push('/')}
            className="text-sm text-gray-400 hover:text-gray-200 transition-colors"
          >
            End practice
          </button>
          <p className="text-sm text-gray-400">{remaining} sentence{remaining !== 1 ? 's' : ''} left</p>
        </div>

        <div className="w-full rounded-xl border border-gray-200 p-6 text-center shadow-sm bg-white">
          <p className="text-sm text-gray-400 mb-1">Translate to Hebrew</p>
          <p className="text-xl font-semibold text-gray-900">{current.english}</p>
        </div>

        <input
          ref={inputRef}
          dir="rtl"
          type="text"
          value={state.input}
          onChange={(e) => setState({ ...state, input: e.target.value })}
          onKeyDown={(e) => { if (e.key === 'Enter') checkAnswer() }}
          placeholder="Type Hebrew…"
          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-3xl text-right text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <HebrewKeyboard
          onKey={(char) => setState({ ...state, input: state.input + char })}
          onBackspace={() => setState({ ...state, input: state.input.slice(0, -1) })}
        />

        <button
          onClick={checkAnswer}
          className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Check
        </button>
      </div>
    )
  }

  if (state.phase === 'revealed') {
    const correct = normalizeHebrew(state.input) === normalizeHebrew(current.hebrew)
    const audioUrl = audioUrls[index]
    const hasTheme = !!state.theme

    return (
      <div className="flex flex-col items-center min-h-screen p-6 pt-10 max-w-sm mx-auto gap-5">
        <div className="w-full flex justify-between items-center">
          <button
            onClick={() => router.push('/')}
            className="text-sm text-gray-400 hover:text-gray-200 transition-colors"
          >
            End practice
          </button>
          <p className="text-sm text-gray-400">{remaining} sentence{remaining !== 1 ? 's' : ''} left</p>
        </div>

        <div className="w-full rounded-xl border border-gray-200 p-6 text-center shadow-sm bg-white">
          <p className="text-sm text-gray-400 mb-1">English</p>
          <p className="text-xl font-semibold text-gray-900">{current.english}</p>
        </div>

        <div className="w-full rounded-xl border border-gray-200 p-4 text-center bg-white">
          <p className="text-xs text-gray-400 mb-1">Your answer</p>
          <p className={`text-2xl ${correct ? 'text-green-700' : 'text-gray-700'}`} dir="rtl">
            {state.input || '—'}
          </p>
        </div>

        <div className="w-full rounded-xl bg-blue-50 border border-blue-200 p-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-blue-500">Correct</p>
            {audioUrl ? (
              <button
                onClick={() => new Audio(audioUrl).play()}
                className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1 transition-colors"
                aria-label="Play pronunciation"
              >
                <span>▶</span> Hear it
              </button>
            ) : (
              <span className="text-xs text-blue-300">Loading audio…</span>
            )}
          </div>
          <p className="text-3xl font-bold text-blue-900 text-center" dir="rtl">{current.hebrew}</p>
        </div>

        {hasTheme ? (
          <div className="flex gap-3 w-full">
            <button
              onClick={() => goToFeedback('up')}
              className="flex-1 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              👍 Good
            </button>
            <button
              onClick={() => goToFeedback('down')}
              className="flex-1 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
            >
              👎 Bad
            </button>
          </div>
        ) : null}

        <button
          onClick={advanceFromRevealed}
          className="w-full py-3 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors font-medium"
        >
          Continue
        </button>
      </div>
    )
  }

  // feedback phase
  const isGood = state.phase === 'feedback' && state.rating === 'up'
  return (
    <div className="flex flex-col items-center min-h-screen p-6 pt-10 max-w-sm mx-auto gap-5">
      <div className="w-full flex justify-between items-center">
        <button
          onClick={() => router.push('/')}
          className="text-sm text-gray-400 hover:text-gray-200 transition-colors"
        >
          End practice
        </button>
      </div>

      <div className="w-full rounded-xl border border-gray-200 p-4 text-center bg-white">
        <p className="text-sm text-gray-400 mb-1">{current.english}</p>
        <p className="text-2xl text-gray-900" dir="rtl">{current.hebrew}</p>
      </div>

      <p className="text-sm text-gray-300 self-start">
        {isGood ? 'Any notes on this sentence? (optional)' : 'What was wrong with this sentence? (optional)'}
      </p>
      <textarea
        value={state.phase === 'feedback' ? state.feedback : ''}
        onChange={(e) => state.phase === 'feedback' && setState({ ...state, feedback: e.target.value })}
        placeholder={isGood ? 'e.g. great example, used it in context…' : 'e.g. too formal, weird word choice, ungrammatical…'}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        rows={3}
        autoFocus
      />

      <button
        onClick={() => state.phase === 'feedback' && submitFeedback(state.feedback.trim() || null)}
        className={`w-full py-3 text-white rounded-lg font-medium transition-colors ${isGood ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
      >
        Submit
      </button>
    </div>
  )
}
