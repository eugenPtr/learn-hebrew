'use client'

import Link from 'next/link'
import LessonList from '@/components/LessonList'
import type { LessonSummary } from '@/components/LessonList'

type Props = {
  lessons: LessonSummary[]
}

export default function LessonsDashboard({ lessons }: Props) {
  return (
    <main className="flex min-h-screen flex-col gap-6 max-w-lg mx-auto p-6">
      <h1 className="text-2xl font-semibold">My Lessons</h1>

      <LessonList lessons={lessons} />

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
        Flashcards
      </Link>

      <Link
        href="/practice/sentences"
        className="w-full rounded-xl bg-purple-500 text-white font-semibold py-4 text-lg hover:bg-purple-600 transition flex items-center justify-center"
      >
        Sentences
      </Link>
    </main>
  )
}
