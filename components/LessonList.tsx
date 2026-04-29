import Link from 'next/link'

export type LessonSummary = {
  id: string
  title: string | null
  created_at: string
  word_count: number
  position: number
}

type Props = {
  lessons: LessonSummary[]
  onSelect?: (lesson: LessonSummary) => void
}

export default function LessonList({ lessons, onSelect }: Props) {
  if (lessons.length === 0) {
    return (
      <p className="text-gray-500 text-sm text-center mt-8">
        No lessons yet. Add your first lesson to get started!
      </p>
    )
  }

  const itemClass =
    'flex items-center justify-between px-4 py-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition w-full'

  return (
    <ul className="flex flex-col gap-3 overflow-y-auto max-h-[calc(5*4.5rem)]">
      {lessons.map((lesson) => {
        const label = lesson.title ?? `Lesson ${lesson.position}`
        const inner = (
          <>
            <span className="font-semibold text-gray-800">{label}</span>
            <span className="text-gray-400 text-sm">{lesson.word_count} words</span>
          </>
        )
        return (
          <li key={lesson.id} className="shrink-0">
            {onSelect ? (
              <button onClick={() => onSelect(lesson)} className={itemClass}>
                {inner}
              </button>
            ) : (
              <Link href={`/lesson/${lesson.id}`} className={itemClass}>
                {inner}
              </Link>
            )}
          </li>
        )
      })}
    </ul>
  )
}
