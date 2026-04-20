'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Item = { hebrew: string; english: string; known: boolean }
type SaveState = 'idle' | 'saving' | 'error'

export default function ReviewPage() {
  const router = useRouter()
  const [items, setItems] = useState<Item[]>([])
  const [ready, setReady] = useState(false)
  const initialized = useRef(false)
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [saveError, setSaveError] = useState('')

  // Edit modal state
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editHebrew, setEditHebrew] = useState('')
  const [editEnglish, setEditEnglish] = useState('')

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    const raw = sessionStorage.getItem('extractedItems')

    if (!raw) {
      router.replace('/lesson/new')
      return
    }

    const extracted: { hebrew: string; english: string }[] = JSON.parse(raw)

    // Query existing hebrew values to mark known items
    ;(async () => {
      try {
        const { data } = await supabase.from('vocabulary_items').select('hebrew')
        const knownSet = new Set((data ?? []).map((r: { hebrew: string }) => r.hebrew))
        setItems(extracted.map((item) => ({ ...item, known: knownSet.has(item.hebrew) })))
      } catch {
        // Supabase failure — default all to new
        setItems(extracted.map((item) => ({ ...item, known: false })))
      } finally {
        setReady(true)
      }
    })()
  }, [router])

  function deleteItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  function openEdit(index: number) {
    setEditingIndex(index)
    setEditHebrew(items[index].hebrew)
    setEditEnglish(items[index].english)
  }

  function saveEdit() {
    if (editingIndex === null) return
    setItems((prev) =>
      prev.map((item, i) =>
        i === editingIndex ? { ...item, hebrew: editHebrew, english: editEnglish } : item
      )
    )
    setEditingIndex(null)
  }

  function closeEdit() {
    setEditingIndex(null)
  }

  async function handleConfirm() {
    setSaveState('saving')
    setSaveError('')

    try {
      const res = await fetch('/api/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: items.map(({ hebrew, english }) => ({ hebrew, english })) }),
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

  return (
    <>
      <main className="flex min-h-screen flex-col p-6 gap-6 max-w-lg mx-auto">
        <h1 className="text-2xl font-semibold">Review</h1>
        <p className="text-gray-500 text-sm">{items.length} item{items.length !== 1 ? 's' : ''} extracted — tap a row to edit, or delete items you don't want to save.</p>

        <ul className="flex flex-col gap-2">
          {items.map((item, i) => (
            <li
              key={i}
              onClick={() => openEdit(i)}
              className={`flex items-center justify-between rounded-xl border px-4 py-3 gap-4 cursor-pointer active:opacity-70
                ${item.known ? 'opacity-50 bg-gray-50 border-gray-200' : 'bg-white border-gray-200'}`}
            >
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="font-medium text-lg leading-tight text-gray-700">{item.hebrew}</span>
                <span className="text-gray-500 text-sm truncate">{item.english}</span>
                {item.known && (
                  <span className="text-xs text-gray-400 mt-0.5">Already known</span>
                )}
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); deleteItem(i) }}
                className="shrink-0 text-gray-300 hover:text-red-400 transition text-xl leading-none"
                aria-label="Delete"
              >
                ×
              </button>
            </li>
          ))}
        </ul>

        {items.length === 0 && (
          <p className="text-center text-gray-400 text-sm">Nothing left to save.</p>
        )}

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

      {/* Edit modal */}
      {editingIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-sm bg-black/30"
          onClick={closeEdit}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Edit item</h2>
              <button
                onClick={closeEdit}
                className="text-gray-400 hover:text-gray-600 transition text-2xl leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 font-medium">Hebrew</label>
              <input
                type="text"
                value={editHebrew}
                onChange={(e) => setEditHebrew(e.target.value)}
                className="border border-gray-200 rounded-xl px-4 py-3 text-lg text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 font-medium">English</label>
              <input
                type="text"
                value={editEnglish}
                onChange={(e) => setEditEnglish(e.target.value)}
                className="border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>

            <button
              onClick={saveEdit}
              className="rounded-xl bg-blue-500 text-white font-semibold py-3 hover:bg-blue-600 transition"
            >
              Save
            </button>
          </div>
        </div>
      )}
    </>
  )
}
