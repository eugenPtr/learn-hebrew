'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import WordCard from '@/components/WordCard'
import WordEditModal from '@/components/WordEditModal'
import type { WordFields } from '@/lib/wordTypes'
import { normalizeHebrew } from '@/lib/hebrew'

type VocabItem = WordFields & { id: string; audio_url: string | null }

type Lesson = {
  id: string
  title: string | null
  created_at: string
  vocabulary_items: VocabItem[]
}

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

  // Edit modal
  const [editingItem, setEditingItem] = useState<VocabItem | null>(null)

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

  async function handleSaveEdit(updated: WordFields) {
    if (!editingItem) return
    const res = await fetch(`/api/vocabulary-items/${editingItem.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Save failed' }))
      throw new Error(err.error ?? 'Save failed')
    }

    const result = await res.json()
    const newId: string = result.itemId ?? editingItem.id
    const newHebrew = normalizeHebrew(updated.hebrew)

    setLesson((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        vocabulary_items: prev.vocabulary_items.map((item) =>
          item.id === editingItem.id
            ? { ...item, id: newId, ...updated, hebrew: newHebrew }
            : item
        ),
      }
    })
    setEditingItem(null)
  }

  async function deleteWord(itemId: string) {
    const res = await fetch(`/api/vocabulary-items/${itemId}`, { method: 'DELETE' })
    if (res.ok) {
      setLesson((prev) => {
        if (!prev) return prev
        return { ...prev, vocabulary_items: prev.vocabulary_items.filter((item) => item.id !== itemId) }
      })
      if (editingItem?.id === itemId) setEditingItem(null)
    }
  }

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

    const refreshed = await fetch(`/api/lessons/${lessonId}`).then((r) => r.json())
    setLesson(refreshed)
    setAddHebrew('')
    setAddEnglish('')
  }

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

  return (
    <>
      <div className="flex flex-col max-w-2xl mx-auto p-6 gap-6 min-h-screen">
        <Link href="/" className="text-blue-500 text-sm self-start">← Back</Link>

        {/* Title */}
        <div className="flex items-center gap-2">
          {titleEditing ? (
            <>
              <input
                ref={titleInputRef}
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') cancelTitle() }}
                placeholder="Lesson"
                className="flex-1 text-2xl font-bold border-b-2 border-blue-400 outline-none bg-transparent"
              />
              <button onClick={saveTitle} disabled={titleSaving} className="text-sm text-blue-600 font-medium disabled:opacity-50">
                {titleSaving ? '…' : 'Save'}
              </button>
              <button onClick={cancelTitle} className="text-sm text-gray-400">Cancel</button>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold flex-1">{lesson.title ?? 'Lesson'}</h1>
              <button
                onClick={() => { setTitleInput(lesson.title ?? ''); setTitleEditing(true) }}
                className="text-sm text-gray-400 hover:text-gray-200"
              >
                Edit
              </button>
            </>
          )}
        </div>

        {/* Word cards */}
        {lesson.vocabulary_items.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">No words yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {lesson.vocabulary_items.map((item) => (
              <WordCard
                key={item.id}
                item={item}
                onClick={() => setEditingItem(item)}
                onDelete={() => deleteWord(item.id)}
              />
            ))}
          </div>
        )}

        {/* Add word form */}
        <div className="flex flex-col gap-3 border border-gray-700 rounded-xl p-4 mt-auto">
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

      {editingItem && (
        <WordEditModal
          item={editingItem}
          onSave={handleSaveEdit}
          onClose={() => setEditingItem(null)}
        />
      )}
    </>
  )
}
