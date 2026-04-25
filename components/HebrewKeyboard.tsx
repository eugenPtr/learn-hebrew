'use client'

import { useEffect, useState } from 'react'

type Props = {
  onKey: (char: string) => void
  onBackspace: () => void
}

// 3 rows: 10, 9, 8 keys — 22 base letters + 5 final forms = 27 total
const ROWS = [
  ['ק', 'ר', 'א', 'ט', 'ו', 'ן', 'מ', 'פ', 'ף', 'ם'],
  ['ש', 'ד', 'ג', 'כ', 'ע', 'י', 'ח', 'ל', 'ך'],
  ['ז', 'ס', 'ב', 'ה', 'נ', 'ת', 'צ', 'ץ'],
]

export default function HebrewKeyboard({ onKey, onBackspace }: Props) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    setShow(typeof window !== 'undefined' && !('ontouchstart' in window))
  }, [])

  if (!show) return null

  return (
    <div className="flex flex-col items-center gap-1 mt-3 select-none">
      {ROWS.map((row, ri) => (
        <div key={ri} className="flex gap-1">
          {row.map((char) => (
            <button
              key={char}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); onKey(char) }}
              className="w-9 h-10 text-lg font-medium border border-gray-300 rounded bg-white text-gray-900 hover:bg-gray-100 active:bg-gray-200 transition-colors"
            >
              {char}
            </button>
          ))}
          {ri === ROWS.length - 1 && (
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); onBackspace() }}
              className="w-14 h-10 text-sm font-medium border border-gray-300 rounded bg-white text-gray-900 hover:bg-gray-100 active:bg-gray-200 transition-colors"
            >
              ⌫
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
