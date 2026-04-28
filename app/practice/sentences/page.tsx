'use client'

import { useEffect, useRef, useState } from 'react'
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
  | { phase: 'generating'; theme: Theme }
  | { phase: 'running'; theme: Theme; deck: Sentence[]; index: number; input: string }
  | { phase: 'revealed'; theme: Theme; deck: Sentence[]; index: number; input: string }
  | { phase: 'feedback'; theme: Theme; deck: Sentence[]; index: number; input: string; feedback: string }
  | { phase: 'summary'; theme: Theme }

export default function SentencesPage() {
  const [state, setState] = useState<State>({ phase: 'loading-themes' })
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/themes')
      .then((r) => r.json())
      .then((themes: Theme[]) => setState({ phase: 'picking', themes }))
      .catch((err) => setError(err instanceof Error ? err.message : String(err)))
  }, [])

  const focusKey = state.phase === 'running' ? state.index : -1
  useEffect(() => {
    if (state.phase === 'running') inputRef.current?.focus()
  }, [state.phase, focusKey])

  async function pickTheme(theme: Theme) {
    setError(null)
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
      if (!sentences || sentences.length === 0) {
        throw new Error('No sentences returned')
      }
      setState({ phase: 'running', theme, deck: sentences, index: 0, input: '' })
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      // Return to theme picker; refresh themes list
      const themes = (await fetch('/api/themes').then((r) => r.json())) as Theme[]
      setState({ phase: 'picking', themes })
    }
  }

  function checkAnswer() {
    if (state.phase !== 'running') return
    setState({ ...state, phase: 'revealed' })
  }

  async function rate(rating: 'up' | 'down', feedback: string | null) {
    if (state.phase !== 'revealed' && state.phase !== 'feedback') return
    const { theme, deck, index } = state
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
    }).catch(() => {
      // Best-effort: a failed rate shouldn't block progression.
    })

    advance()
  }

  function advance() {
    if (state.phase !== 'revealed' && state.phase !== 'feedback') return
    const { theme, deck, index } = state
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
        <p className="text-gray-300 text-sm">Generating sentences for</p>
        <p className="text-xl font-bold">{state.theme.name}</p>
        <p className="text-gray-500 text-xs">This usually takes a few seconds…</p>
      </div>
    )
  }

  if (state.phase === 'summary') {
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

  // running / revealed / feedback all share deck + index
  const deck = state.deck
  const index = state.index
  const current = deck[index]
  const remaining = deck.length - index

  if (state.phase === 'running') {
    return (
      <div className="flex flex-col items-center min-h-screen p-6 pt-10 max-w-sm mx-auto gap-6">
        <p className="self-end text-sm text-gray-400">{remaining} sentence{remaining !== 1 ? 's' : ''} left</p>

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
          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-xl text-right text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
    return (
      <div className="flex flex-col items-center min-h-screen p-6 pt-10 max-w-sm mx-auto gap-5">
        <p className="self-end text-sm text-gray-400">{remaining} sentence{remaining !== 1 ? 's' : ''} left</p>

        <div className="w-full rounded-xl border border-gray-200 p-6 text-center shadow-sm bg-white">
          <p className="text-sm text-gray-400 mb-1">English</p>
          <p className="text-xl font-semibold text-gray-900">{current.english}</p>
        </div>

        <div className="w-full rounded-xl border border-gray-200 p-4 text-center bg-white">
          <p className="text-xs text-gray-400 mb-1">Your answer</p>
          <p className={`text-lg ${correct ? 'text-green-700' : 'text-gray-700'}`} dir="rtl">
            {state.input || '—'}
          </p>
        </div>

        <div className="w-full rounded-xl bg-blue-50 border border-blue-200 p-4 text-center">
          <p className="text-xs text-blue-500 mb-1">Correct</p>
          <p className="text-xl font-bold text-blue-900" dir="rtl">{current.hebrew}</p>
        </div>

        <div className="flex gap-3 w-full">
          <button
            onClick={() => rate('up', null)}
            className="flex-1 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            👍 Good
          </button>
          <button
            onClick={() => setState({ ...state, phase: 'feedback', feedback: '' })}
            className="flex-1 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
          >
            👎 Bad
          </button>
        </div>
      </div>
    )
  }

  // feedback phase
  return (
    <div className="flex flex-col items-center min-h-screen p-6 pt-10 max-w-sm mx-auto gap-5">
      <div className="w-full rounded-xl border border-gray-200 p-4 text-center bg-white">
        <p className="text-sm text-gray-400 mb-1">{current.english}</p>
        <p className="text-lg text-gray-900" dir="rtl">{current.hebrew}</p>
      </div>

      <p className="text-sm text-gray-300">What was wrong with this sentence? (optional)</p>
      <textarea
        value={state.feedback}
        onChange={(e) => setState({ ...state, feedback: e.target.value })}
        placeholder="e.g. too formal, weird word choice, ungrammatical…"
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        rows={3}
      />

      <div className="flex gap-3 w-full">
        <button
          onClick={() => rate('down', state.feedback.trim() || null)}
          className="flex-1 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
        >
          Submit
        </button>
        <button
          onClick={() => setState({ phase: 'revealed', theme: state.theme, deck, index, input: state.input })}
          className="flex-1 py-3 border border-gray-300 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
