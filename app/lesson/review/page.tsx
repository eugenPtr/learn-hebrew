'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import WordCard from '@/components/WordCard'
import WordEditModal from '@/components/WordEditModal'
import type { WordFields } from '@/lib/wordTypes'

type ReviewItem = WordFields & { known: boolean; loading: boolean }

type TagResponse = {
  hebrew: string
  pos: WordFields['pos']
  gender: WordFields['gender']
  binyan: WordFields['binyan']
  root: WordFields['root']
  conjugations: WordFields['conjugations']
}

export default function ReviewPage() {
  const router = useRouter()
  const [items, setItems] = useState<ReviewItem[]>([])
  const [ready, setReady] = useState(false)
  const initialized = useRef(false)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'error'>('idle')
  const [saveError, setSaveError] = useState('')
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    const raw = sessionStorage.getItem('extractedItems')
    if (!raw) { router.replace('/lesson/new'); return }

    const extracted: { hebrew: string; english: string }[] = JSON.parse(raw)

    ;(async () => {
      // Check known items
      let knownSet = new Set<string>()
      try {
        const { data } = await supabase.from('vocabulary_items').select('hebrew')
        knownSet = new Set((data ?? []).map((r: { hebrew: string }) => r.hebrew))
      } catch { /* default all to new */ }

      // Initialise items as loading
      const initial: ReviewItem[] = extracted.map((item) => ({
        hebrew: item.hebrew,
        english: item.english,
        pos: null,
        gender: null,
        binyan: null,
        root: null,
        conjugations: null,
        known: knownSet.has(item.hebrew),
        loading: true,
      }))
      setItems(initial)
      setReady(true)

      // Tag all items in parallel
      const tagPromises = extracted.map(async (item, i) => {
        try {
          const res = await fetch('/api/tag', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ hebrew: item.hebrew, english: item.english }),
          })
          if (!res.ok) throw new Error()
          const tag: TagResponse = await res.json()
          setItems((prev) =>
            prev.map((it, idx) =>
              idx === i
                ? {
                    ...it,
                    hebrew: tag.hebrew ?? it.hebrew,
                    pos: tag.pos,
                    gender: tag.gender,
                    binyan: tag.binyan,
                    root: tag.root,
                    conjugations: tag.conjugations,
                    loading: false,
                  }
                : it
            )
          )
        } catch {
          setItems((prev) =>
            prev.map((it, idx) => (idx === i ? { ...it, loading: false } : it))
          )
        }
      })

      await Promise.allSettled(tagPromises)
    })()
  }, [router])

  function deleteItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index))
    if (editingIndex === index) setEditingIndex(null)
  }

  async function handleSaveEdit(updated: WordFields) {
    if (editingIndex === null) return
    setItems((prev) =>
      prev.map((item, i) =>
        i === editingIndex ? { ...item, ...updated } : item
      )
    )
    setEditingIndex(null)
  }

  async function handleConfirm() {
    setSaveState('saving')
    setSaveError('')
    try {
      const res = await fetch('/api/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(({ hebrew, english, pos, gender, binyan, root, conjugations }) => ({
            hebrew, english, pos, gender, binyan, root, conjugations,
          })),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)
      sessionStorage.removeItem('extractedItems')
      router.push('/')
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Something went wrong')
      setSaveState('error')
    }
  }

  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <span className="text-gray-400">Loading…</span>
      </main>
    )
  }

  const editingItem = editingIndex !== null ? items[editingIndex] : null

  return (
    <>
      <main className="flex min-h-screen flex-col p-6 gap-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-semibold text-gray-800">Review</h1>
        <p className="text-gray-500 text-sm">
          {items.length} word{items.length !== 1 ? 's' : ''} extracted — click a card to edit, or delete words you don&apos;t want.
        </p>

        {items.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-8">Nothing left to save.</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {items.map((item, i) => (
            <WordCard
              key={i}
              item={item}
              onClick={() => setEditingIndex(i)}
              onDelete={() => deleteItem(i)}
            />
          ))}
        </div>

        {saveState === 'error' && (
          <p className="text-red-500 text-sm text-center">{saveError}</p>
        )}

        <button
          onClick={handleConfirm}
          disabled={items.length === 0 || saveState === 'saving'}
          className="mt-auto rounded-xl bg-blue-500 text-white font-semibold py-4 text-lg
            disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-600 transition"
        >
          {saveState === 'saving' ? 'Saving…' : 'Looks good'}
        </button>
      </main>

      {editingItem !== null && editingIndex !== null && (
        <WordEditModal
          item={editingItem}
          onSave={handleSaveEdit}
          onClose={() => setEditingIndex(null)}
        />
      )}
    </>
  )
}
