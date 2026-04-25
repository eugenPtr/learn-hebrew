export type VocabularyItem = {
  id: string
  hebrew: string
  english: string
  audio_url: string | null
  last_used_at: string | null
  last_mistake_at: string | null
}

export type Strategy = {
  name: string
  select: (items: VocabularyItem[], count: number) => VocabularyItem[]
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000

const defaultStrategy: Strategy = {
  name: 'default',
  select(items, count) {
    const now = Date.now()
    const recent = items.filter(
      (item) => item.last_mistake_at !== null && now - new Date(item.last_mistake_at).getTime() <= THREE_DAYS_MS
    )
    const recentIds = new Set(recent.map((i) => i.id))
    const remainder = items
      .filter((item) => !recentIds.has(item.id))
      .sort((a, b) => {
        if (a.last_used_at === null && b.last_used_at === null) return 0
        if (a.last_used_at === null) return -1
        if (b.last_used_at === null) return 1
        return new Date(a.last_used_at).getTime() - new Date(b.last_used_at).getTime()
      })

    const selected = [...recent.slice(0, count), ...remainder].slice(0, count)
    return shuffle(selected)
  },
}

export const activeStrategy: Strategy = defaultStrategy
