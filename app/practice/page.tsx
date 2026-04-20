'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ReadingExercise from '@/components/exercises/ReadingExercise'
import ListeningExercise from '@/components/exercises/ListeningExercise'
import TranslatingExercise from '@/components/exercises/TranslatingExercise'

type ExerciseType = 'reading' | 'listening' | 'translating'

type Exercise = {
  type: ExerciseType
  focusWordId: string
  hebrewSentence: string
  englishSentence: string
  wordsUsed: { itemId: string; usedForm: string }[]
  audioUrl: string
}

type StoredSession = {
  exercises: Exercise[]
  currentIndex: number
  results: Record<string, boolean> // itemId → mistake (true = mistake ever)
  complete: boolean
}

const SESSION_KEY = 'currentSession'

function loadSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveSession(session: StoredSession) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY)
}

type PageState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'running'; session: StoredSession }
  | { status: 'summary'; session: StoredSession; submitError: string | null }
  | { status: 'submitting'; session: StoredSession }

export default function PracticePage() {
  const router = useRouter()
  const [state, setState] = useState<PageState>({ status: 'loading' })

  useEffect(() => {
    const stored = loadSession()
    if (stored && !stored.complete) {
      setState({ status: 'running', session: stored })
      return
    }

    // Fetch new session
    fetch('/api/session')
      .then((res) => {
        if (!res.ok) throw new Error(`Session fetch failed: ${res.status}`)
        return res.json()
      })
      .then((exercises: Exercise[]) => {
        const session: StoredSession = {
          exercises,
          currentIndex: 0,
          results: {},
          complete: false,
        }
        saveSession(session)
        setState({ status: 'running', session })
      })
      .catch((err) => {
        setState({ status: 'error', message: err.message })
      })
  }, [])

  function handleComplete(correct: boolean) {
    if (state.status !== 'running') return
    const { session } = state
    const exercise = session.exercises[session.currentIndex]

    // Derive word results from wordsUsed — if incorrect, all words are mistakes
    const updatedResults = { ...session.results }
    for (const { itemId } of exercise.wordsUsed) {
      // mistake: true wins — never overwrite true with false
      if (!correct) {
        updatedResults[itemId] = true
      } else if (updatedResults[itemId] === undefined) {
        updatedResults[itemId] = false
      }
    }

    const nextIndex = session.currentIndex + 1
    const isLast = nextIndex >= session.exercises.length

    const updatedSession: StoredSession = {
      ...session,
      currentIndex: nextIndex,
      results: updatedResults,
      complete: isLast,
    }

    saveSession(updatedSession)

    if (isLast) {
      setState({ status: 'summary', session: updatedSession, submitError: null })
    } else {
      setState({ status: 'running', session: updatedSession })
    }
  }

  async function handleDone() {
    if (state.status !== 'summary') return
    const { session } = state
    setState({ status: 'submitting', session })

    const results = Object.entries(session.results).map(([itemId, mistake]) => ({
      itemId,
      mistake,
    }))

    try {
      const res = await fetch('/api/session/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ results }),
      })
      if (!res.ok) throw new Error(`POST failed: ${res.status}`)
      clearSession()
      router.push('/')
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setState({ status: 'summary', session, submitError: message })
    }
  }

  // --- Render states ---

  if (state.status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-gray-500">
        <div className="text-4xl animate-pulse">📚</div>
        <p className="text-lg font-medium">Preparing your session…</p>
        <p className="text-sm">This takes about 10–15 seconds</p>
      </div>
    )
  }

  if (state.status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-red-600 font-medium">Failed to load session</p>
        <p className="text-sm text-gray-500">{state.message}</p>
        <button
          onClick={() => { clearSession(); window.location.reload() }}
          className="bg-blue-600 text-white rounded-lg px-6 py-2 hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    )
  }

  if (state.status === 'summary' || state.status === 'submitting') {
    const { session } = state
    const total = session.exercises.length
    const correctCount = Object.values(session.results).filter((m) => !m).length
    const mistakeCount = Object.values(session.results).filter((m) => m).length

    const byType = session.exercises.reduce<Record<ExerciseType, { correct: number; total: number }>>(
      (acc, ex) => {
        if (!acc[ex.type]) acc[ex.type] = { correct: 0, total: 0 }
        acc[ex.type].total++
        const isMistake = ex.wordsUsed.some(({ itemId }) => session.results[itemId])
        if (!isMistake) acc[ex.type].correct++
        return acc
      },
      {} as Record<ExerciseType, { correct: number; total: number }>
    )

    const submitError = state.status === 'summary' ? state.submitError : null
    const isSubmitting = state.status === 'submitting'

    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-6 max-w-md mx-auto">
        <h1 className="text-3xl font-bold">Session Complete!</h1>
        <div className="text-5xl font-bold text-blue-600">
          {correctCount} / {total}
        </div>
        <p className="text-gray-500">exercises correct</p>

        <div className="w-full border rounded-lg divide-y">
          {(Object.entries(byType) as [ExerciseType, { correct: number; total: number }][]).map(
            ([type, stats]) => (
              <div key={type} className="flex justify-between items-center px-4 py-3">
                <span className="capitalize text-gray-700">{type}</span>
                <span className="font-medium">
                  {stats.correct} / {stats.total}
                </span>
              </div>
            )
          )}
        </div>

        {mistakeCount > 0 && (
          <p className="text-sm text-gray-500">{mistakeCount} word(s) to review</p>
        )}

        {submitError && (
          <p className="text-red-600 text-sm">Failed to save results: {submitError}</p>
        )}

        <button
          onClick={handleDone}
          disabled={isSubmitting}
          className="w-full bg-gray-800 text-white rounded-lg px-6 py-3 font-medium hover:bg-gray-900 disabled:opacity-50 transition-colors"
        >
          {isSubmitting ? 'Saving…' : 'Done'}
        </button>
      </div>
    )
  }

  // status === 'running'
  const { session } = state
  const exercise = session.exercises[session.currentIndex]
  const total = session.exercises.length
  const current = session.currentIndex + 1
  const progress = (session.currentIndex / total) * 100

  return (
    <div className="flex flex-col min-h-screen">
      {/* Progress bar */}
      <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center gap-3">
        <div className="flex-1 bg-gray-100 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-sm text-gray-500 whitespace-nowrap">{current} / {total}</span>
      </div>

      {/* Exercise */}
      <div className="flex-1">
        {exercise.type === 'reading' && (
          <ReadingExercise
            key={session.currentIndex}
            exercise={exercise as Parameters<typeof ReadingExercise>[0]['exercise']}
            onComplete={handleComplete}
          />
        )}
        {exercise.type === 'listening' && (
          <ListeningExercise
            key={session.currentIndex}
            exercise={exercise as Parameters<typeof ListeningExercise>[0]['exercise']}
            onComplete={handleComplete}
          />
        )}
        {exercise.type === 'translating' && (
          <TranslatingExercise
            key={session.currentIndex}
            exercise={exercise as Parameters<typeof TranslatingExercise>[0]['exercise']}
            onComplete={handleComplete}
          />
        )}
      </div>
    </div>
  )
}
