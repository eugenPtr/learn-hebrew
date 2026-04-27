'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

type VocabItem = {
  id: string
  hebrew: string
  english: string
  audio_url: string | null
}

type Lesson = {
  id: string
  title: string | null
  created_at: string
  vocabulary_items: VocabItem[]
}

type RowState =
  | { mode: 'display' }
  | { mode: 'editing'; hebrew: string; english: string; saving: boolean; error: string | null }

export default function LessonDetailPage() {
  const { id: lessonId } = useParams<{ id: string }>()
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  // Title editing
  const [titleEditing, setTitleEditing] = useState(false)
  const [titleInput, setTitleInput] = useState('')
  const [titleSaving, setTitleSaving] = useState(false)
  const titleInputRef = useRef<HTMLInputElement>(null)

  // Per-row edit state (keyed by item id)
  const [rowStates, setRowStates] = useState<Record<string, RowState>>({})
  const [activeEditId, setActiveEditId] = useState<string | null>(null)

  // Add word form
  const [addHebrew, setAddHebrew] = useState('')
  const [addEnglish, setAddEnglish] = useState('')
  const [addSaving, setAddSaving] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/lessons/${lessonId}`)
      .then(async (res) => {
        if (res.status === 404) { setNotFound(true); return }
        if (!res.ok) throw new Error(`Failed to load lesson: ${res.status}`)
        const data: Lesson = await res.json()
        setLesson(data)
        setTitleInput(data.title ?? '')
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [lessonId])

  useEffect(() => {
    if (titleEditing) titleInputRef.current?.focus()
  }, [titleEditing])

  // --- Title ---

  async function saveTitle() {
    if (!lesson) return
    setTitleSaving(true)
    const res = await fetch(`/api/lessons/${lessonId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: titleInput.trim() || null }),
    })
    setTitleSaving(false)
    if (res.ok) {
      setLesson({ ...lesson, title: titleInput.trim() || null })
      setTitleEditing(false)
    }
  }

  function cancelTitle() {
    setTitleInput(lesson?.title ?? '')
    setTitleEditing(false)
  }

  // --- Word row editing ---

  function openEdit(item: VocabItem) {
    // Close any other open edit without saving
    setActiveEditId(item.id)
    setRowStates((prev) => {
      const next: Record<string, RowState> = {}
      for (const key of Object.keys(prev)) {
        next[key] = { mode: 'display' }
      }
      next[item.id] = { mode: 'editing', hebrew: item.hebrew, english: item.english, saving: false, error: null }
      return next
    })
  }

  function cancelEdit(itemId: string) {
    setActiveEditId(null)
    setRowStates((prev) => ({ ...prev, [itemId]: { mode: 'display' } }))
  }

  async function saveEdit(itemId: string) {
    const rowState = rowStates[itemId]
    if (rowState?.mode !== 'editing') return

    setRowStates((prev) => ({
      ...prev,
      [itemId]: { ...rowState, saving: true, error: null },
    }))

    const res = await fetch(`/api/vocabulary-items/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hebrew: rowState.hebrew, english: rowState.english }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Save failed' }))
      setRowStates((prev) => ({
        ...prev,
        [itemId]: { ...rowState, saving: false, error: err.error ?? 'Save failed' },
      }))
      return
    }

    const result = await res.json()
    // If ownership was transferred, the item now has a new id
    const newId: string = result.itemId ?? itemId

    setLesson((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        vocabulary_items: prev.vocabulary_items.map((item) =>
          item.id === itemId
            ? { ...item, id: newId, hebrew: rowState.hebrew, english: rowState.english }
            : item
        ),
      }
    })
    setActiveEditId(null)
    setRowStates((prev) => {
      const next = { ...prev }
      delete next[itemId]
      if (newId !== itemId) delete next[newId]
      next[newId] = { mode: 'display' }
      return next
    })
  }

  async function deleteWord(itemId: string) {
    const res = await fetch(`/api/vocabulary-items/${itemId}`, { method: 'DELETE' })
    if (res.ok) {
      setLesson((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          vocabulary_items: prev.vocabulary_items.filter((item) => item.id !== itemId),
        }
      })
      if (activeEditId === itemId) setActiveEditId(null)
    }
  }

  // --- Add word ---

  async function addWord() {
    if (!addHebrew.trim() || !addEnglish.trim()) {
      setAddError('Both fields are required.')
      return
    }
    setAddSaving(true)
    setAddError(null)

    const res = await fetch(`/api/lessons/${lessonId}/words`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hebrew: addHebrew, english: addEnglish }),
    })

    setAddSaving(false)

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to add word' }))
      setAddError(err.error ?? 'Failed to add word')
      return
    }

    const result = await res.json()
    if (result.action === 'no-op') {
      setAddError('This word is already in the lesson.')
      return
    }

    // Refetch lesson to get full updated item (including audio_url)
    const refreshed = await fetch(`/api/lessons/${lessonId}`).then((r) => r.json())
    setLesson(refreshed)
    setAddHebrew('')
    setAddEnglish('')
  }

  // --- Render ---

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-400">Loading…</p>
      </div>
    )
  }

  if (notFound || !lesson) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-gray-600">Lesson not found.</p>
        <Link href="/" className="text-blue-500 underline">Back to lessons</Link>
      </div>
    )
  }

  const positionLabel = `Lesson`

  return (
    <div className="flex flex-col max-w-lg mx-auto p-6 gap-6 min-h-screen">
      {/* Back button */}
      <Link href="/" className="text-blue-500 text-sm self-start">← Back</Link>

      {/* Editable title */}
      <div className="flex items-center gap-2">
        {titleEditing ? (
          <>
            <input
              ref={titleInputRef}
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') cancelTitle() }}
              placeholder={positionLabel}
              className="flex-1 text-2xl font-bold border-b-2 border-blue-400 outline-none bg-transparent"
            />
            <button
              onClick={saveTitle}
              disabled={titleSaving}
              className="text-sm text-blue-600 font-medium disabled:opacity-50"
            >
              {titleSaving ? '…' : 'Save'}
            </button>
            <button onClick={cancelTitle} className="text-sm text-gray-400">Cancel</button>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold flex-1">
              {lesson.title ?? positionLabel}
            </h1>
            <button
              onClick={() => { setTitleInput(lesson.title ?? ''); setTitleEditing(true) }}
              className="text-sm text-gray-400 hover:text-gray-200"
            >
              Edit
            </button>
          </>
        )}
      </div>

      {/* Vocabulary list */}
      <ul className="flex flex-col divide-y divide-gray-700 border border-gray-700 rounded-xl overflow-hidden">
        {lesson.vocabulary_items.length === 0 && (
          <li className="px-4 py-4 text-sm text-gray-400 text-center">No words yet.</li>
        )}
        {lesson.vocabulary_items.map((item) => {
          const rowState = rowStates[item.id] ?? { mode: 'display' }

          if (rowState.mode === 'editing') {
            return (
              <li key={item.id} className="px-4 py-3 flex flex-col gap-2 bg-white">
                <input
                  dir="rtl"
                  value={rowState.hebrew}
                  onChange={(e) =>
                    setRowStates((prev) => ({
                      ...prev,
                      [item.id]: { ...rowState, hebrew: e.target.value },
                    }))
                  }
                  placeholder="Hebrew"
                  className="border border-gray-300 rounded px-3 py-2 text-lg text-right text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <input
                  value={rowState.english}
                  onChange={(e) =>
                    setRowStates((prev) => ({
                      ...prev,
                      [item.id]: { ...rowState, english: e.target.value },
                    }))
                  }
                  placeholder="English"
                  className="border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                {rowState.error && (
                  <p className="text-red-500 text-xs">{rowState.error}</p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => saveEdit(item.id)}
                    disabled={rowState.saving}
                    className="flex-1 py-2 bg-blue-600 text-white text-sm rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {rowState.saving ? 'Saving…' : 'Save'}
                  </button>
                  <button
                    onClick={() => cancelEdit(item.id)}
                    className="flex-1 py-2 border border-gray-300 text-sm rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </li>
            )
          }

          return (
            <li key={item.id} className="px-4 py-3 flex items-center gap-2">
              <div className="flex-1 flex flex-col gap-0.5 min-w-0">
                <span className="font-bold text-lg leading-tight text-white" dir="rtl">{item.hebrew}</span>
                <span className="text-sm text-gray-400 truncate">{item.english}</span>
              </div>
              <button
                onClick={() => openEdit(item)}
                className="text-xs text-gray-300 hover:text-blue-400 transition-colors px-1"
              >
                Edit
              </button>
              <button
                onClick={() => deleteWord(item.id)}
                className="text-xs text-red-400 hover:text-red-300 transition-colors px-1"
              >
                Delete
              </button>
            </li>
          )
        })}
      </ul>

      {/* Add word form */}
      <div className="flex flex-col gap-3 border border-gray-700 rounded-xl p-4">
        <p className="text-sm font-medium text-gray-300">Add word</p>
        <input
          dir="rtl"
          value={addHebrew}
          onChange={(e) => setAddHebrew(e.target.value)}
          placeholder="Hebrew"
          className="border border-gray-300 rounded-lg px-3 py-2 text-lg text-right focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <input
          value={addEnglish}
          onChange={(e) => setAddEnglish(e.target.value)}
          placeholder="English"
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        {addError && <p className="text-red-500 text-xs">{addError}</p>}
        <button
          onClick={addWord}
          disabled={addSaving}
          className="w-full py-2 bg-gray-800 text-white text-sm rounded-lg font-medium hover:bg-gray-900 disabled:opacity-50 transition-colors"
        >
          {addSaving ? 'Adding…' : 'Add'}
        </button>
      </div>
    </div>
  )
}
