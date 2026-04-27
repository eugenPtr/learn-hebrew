import { supabase } from '@/lib/supabase'
import LessonsDashboard from '@/components/LessonsDashboard'

export default async function Home() {
  const { data, error } = await supabase
    .from('lessons')
    .select('id, title, created_at, vocabulary_items(id)')
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  const lessons = (data ?? []).map((lesson, index) => ({
    id: lesson.id as string,
    title: (lesson.title as string | null) ?? null,
    created_at: lesson.created_at as string,
    word_count: Array.isArray(lesson.vocabulary_items) ? lesson.vocabulary_items.length : 0,
    position: index + 1,
  }))

  return <LessonsDashboard lessons={lessons} />
}
