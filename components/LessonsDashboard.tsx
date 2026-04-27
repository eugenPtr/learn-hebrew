'use client'

import Link from 'next/link'

type LessonSummary = {
  id: string
  title: string | null
  created_at: string
  word_count: number
  position: number
}

type Props = {
  lessons: LessonSummary[]
}

export default function LessonsDashboard({ lessons }: Props) {
  return (
    <main className="flex min-h-screen flex-col gap-6 max-w-lg mx-auto p-6">
      <h1 className="text-2xl font-semibold">My Lessons</h1>

      {lessons.length === 0 ? (
        <p className="text-gray-500 text-sm text-center mt-8">
          No lessons yet. Add your first lesson to get started!
        </p>
      ) : (
        <ul className="flex flex-col gap-3 overflow-y-auto max-h-[calc(5*4.5rem)]">
          {lessons.map((lesson) => (
            <li key={lesson.id} className="shrink-0">
              <Link
                href={`/lesson/${lesson.id}`}
                className="flex items-center justify-between px-4 py-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition"
              >
                <span className="font-semibold text-gray-800">
                  {lesson.title ?? `Lesson ${lesson.position}`}
                </span>
                <span className="text-gray-400 text-sm">{lesson.word_count} words</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Link
        href="/lesson/new"
        className="w-full rounded-xl border border-blue-500 text-blue-500 font-semibold py-3 text-base hover:bg-blue-50 transition flex items-center justify-center"
      >
        Add Lesson
      </Link>

      <Link
        href="/practice"
        className="w-full rounded-xl bg-blue-500 text-white font-semibold py-4 text-lg hover:bg-blue-600 transition flex items-center justify-center"
      >
        Generate Practice Session
      </Link>
    </main>
  )
}
