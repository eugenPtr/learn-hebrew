import { supabase } from '@/lib/supabase'
import LessonsDashboard from '@/components/LessonsDashboard'

export default async function Home() {
  const { data, error } = await supabase
    .from('lessons')
    .select('*, vocabulary_items(*)')
    .order('created_at', { ascending: true })
    .order('id', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return <LessonsDashboard lessons={data ?? []} />
}
