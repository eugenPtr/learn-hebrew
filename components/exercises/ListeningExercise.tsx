'use client'

import { useEffect, useState } from 'react'

type Exercise = {
  type: 'listening'
  focusWordId: string
  hebrewSentence: string
  englishSentence: string
  wordsUsed: { itemId: string; usedForm: string }[]
  audioUrl: string
}

type Props = {
  exercise: Exercise
  onComplete: (correct: boolean) => void
}

function scoreAnswer(input: string, reference: string): boolean {
  function tokenise(s: string): Set<string> {
    return new Set(
      s
        .toLowerCase()
        .split(/\s+/)
        .map((t) => t.replace(/^[.,!?;:״׳]+|[.,!?;:״׳]+$/g, ''))
        .filter(Boolean)
    )
  }
  const inputTokens = tokenise(input)
  const refTokens = tokenise(reference)
  if (refTokens.size === 0) return true
  let matches = 0
  for (const t of refTokens) {
    if (inputTokens.has(t)) matches++
  }
  return matches / refTokens.size >= 0.7
}

export default function ListeningExercise({ exercise, onComplete }: Props) {
  const [input, setInput] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [correct, setCorrect] = useState(false)

  // Auto-play on mount
  useEffect(() => {
    new Audio(exercise.audioUrl).play().catch(() => {
      // Autoplay blocked — speaker button serves as fallback
    })
  }, [exercise.audioUrl])

  function playAudio() {
    new Audio(exercise.audioUrl).play()
  }

  function handleCheck() {
    if (submitted || !input.trim()) return
    const result = scoreAnswer(input, exercise.hebrewSentence)
    setCorrect(result)
    setSubmitted(true)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleCheck()
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-xl mx-auto">
      {/* Audio controls */}
      <div className="flex flex-col items-center gap-3">
        <p className="text-sm text-gray-500">Listen and type what you hear in Hebrew</p>
        <button
          onClick={playAudio}
          aria-label="Play audio"
          className="text-4xl p-4 rounded-full hover:bg-gray-100 transition-colors"
        >
          🔊
        </button>
      </div>

      {/* RTL Hebrew input */}
      <div className="flex flex-col gap-2">
        <label className="text-sm text-gray-500">Type what you heard (Hebrew)</label>
        <input
          type="text"
          dir="rtl"
          lang="he"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={submitted}
          placeholder="...כתוב כאן"
          className="border rounded-lg px-4 py-3 text-base text-right focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-50 disabled:text-gray-400"
        />
      </div>

      {/* Check button */}
      {!submitted && (
        <button
          onClick={handleCheck}
          disabled={!input.trim()}
          className="bg-blue-600 text-white rounded-lg px-6 py-3 font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Check
        </button>
      )}

      {/* Inline result feedback + reveal Hebrew sentence */}
      {submitted && (
        <div className={`rounded-lg p-4 ${correct ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <p className={`font-semibold mb-2 ${correct ? 'text-green-700' : 'text-red-700'}`}>
            {correct ? '✓ Correct!' : '✗ Not quite'}
          </p>
          <p className="text-sm text-gray-500 mb-1">The sentence was:</p>
          <p dir="rtl" lang="he" className="text-xl font-semibold text-right">
            {exercise.hebrewSentence}
          </p>
        </div>
      )}

      {/* Next button */}
      {submitted && (
        <button
          onClick={() => onComplete(correct)}
          className="bg-gray-800 text-white rounded-lg px-6 py-3 font-medium hover:bg-gray-900 transition-colors"
        >
          Next →
        </button>
      )}
    </div>
  )
}
