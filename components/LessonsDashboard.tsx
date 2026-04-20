'use client'

import { useState } from 'react'
import Link from 'next/link'

type VocabularyItem = {
  id: string
  hebrew: string
  english: string
}

type Lesson = {
  id: string
  created_at: string
  vocabulary_items: VocabularyItem[]
}

type Props = {
  lessons: Lesson[]
}

export default function LessonsDashboard({ lessons }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  function toggleLesson(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  return (
    <main className="flex min-h-screen flex-col gap-6 max-w-lg mx-auto p-6">
      <h1 className="text-2xl font-semibold">My Lessons</h1>

      <Link
        href="/lesson/new"
        className="inline-flex items-center justify-center rounded-xl bg-blue-500 text-white font-semibold py-3 px-6 text-base hover:bg-blue-600 transition self-start"
      >
        Add Lesson
      </Link>

      {lessons.length === 0 ? (
        <p className="text-gray-500 text-sm text-center mt-8">
          No lessons yet. Add your first lesson to get started!
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {lessons.map((lesson, index) => {
            const isExpanded = expanded.has(lesson.id)
            return (
              <li
                key={lesson.id}
                className="rounded-xl border border-gray-200 bg-white overflow-hidden"
              >
                <button
                  onClick={() => toggleLesson(lesson.id)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition"
                  aria-expanded={isExpanded}
                >
                  <span className="font-semibold text-gray-800">Lesson {index + 1}</span>
                  <span className="text-gray-400 text-sm">{isExpanded ? '▲' : '▼'}</span>
                </button>

                {isExpanded && (
                  <ul className="flex flex-col divide-y divide-gray-100 border-t border-gray-100">
                    {lesson.vocabulary_items.map((item) => (
                      <li key={item.id} className="px-4 py-3 flex flex-col gap-0.5">
                        <span className="font-bold text-lg leading-tight text-gray-700">
                          {item.hebrew}
                        </span>
                        <span className="text-sm text-gray-500">{item.english}</span>
                      </li>
                    ))}
                    {lesson.vocabulary_items.length === 0 && (
                      <li className="px-4 py-3 text-sm text-gray-400">No vocabulary items.</li>
                    )}
                  </ul>
                )}
              </li>
            )
          })}
        </ul>
      )}

      <div className="mt-auto pt-6">
        <Link
          href="/practice"
          className="w-full rounded-xl bg-blue-500 text-white font-semibold py-4 text-lg hover:bg-blue-600 transition flex items-center justify-center"
        >
          Generate Practice Session
        </Link>
      </div>
    </main>
  )
}
