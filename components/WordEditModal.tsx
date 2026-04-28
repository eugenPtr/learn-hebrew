'use client'

import { useState } from 'react'
import { PRONOUN_ORDER, PRONOUN_LABELS_HE } from '@/lib/hebrew'
import { POS_VALUES, GENDER_VALUES, BINYAN_VALUES } from '@/lib/wordTypes'
import type { WordFields, Pos, Gender, Binyan } from '@/lib/wordTypes'

const CONJUGATION_ROWS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
]

type Props = {
  item: WordFields
  onSave: (updated: WordFields) => Promise<void>
  onClose: () => void
}

export default function WordEditModal({ item, onSave, onClose }: Props) {
  const [hebrew, setHebrew] = useState(item.hebrew)
  const [english, setEnglish] = useState(item.english)
  const [pos, setPos] = useState<Pos | null>(item.pos)
  const [gender, setGender] = useState<Gender | null>(item.gender)
  const [binyan, setBinyan] = useState<Binyan | null>(item.binyan)
  const [root, setRoot] = useState(item.root ?? '')
  const [conjugationsPresent, setConjugationsPresent] = useState<string[]>(() => {
    const base = item.conjugations?.present ?? []
    const arr = [...base]
    while (arr.length < 9) arr.push('')
    return arr.slice(0, 9)
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handlePosChange(newPos: Pos | null) {
    setPos(newPos)
    if (newPos !== 'noun' && newPos !== 'pronoun') setGender(null)
    if (newPos !== 'verb') setBinyan(null)
  }

  function setConjugation(index: number, value: string) {
    setConjugationsPresent((prev) => {
      const next = [...prev]
      next[index] = value
      return next
    })
  }

  async function handleSave() {
    if (!hebrew.trim() || !english.trim()) {
      setError('Hebrew and English are required.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const conjugations =
        pos === 'verb' && conjugationsPresent.some((s) => s.trim())
          ? { present: conjugationsPresent.map((s) => s.trim()) }
          : null

      await onSave({
        hebrew: hebrew.trim(),
        english: english.trim(),
        pos,
        gender: (pos === 'noun' || pos === 'pronoun') ? gender : null,
        binyan: pos === 'verb' ? binyan : null,
        root: root.trim() || null,
        conjugations,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">Edit word</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition text-2xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto px-5 py-4 flex flex-col gap-4">
          {/* Hebrew */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">Hebrew</label>
            <input
              type="text"
              dir="rtl"
              value={hebrew}
              onChange={(e) => setHebrew(e.target.value)}
              className="border border-gray-200 rounded-xl px-4 py-3 text-xl font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>

          {/* English */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">English</label>
            <input
              type="text"
              value={english}
              onChange={(e) => setEnglish(e.target.value)}
              className="border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>

          {/* POS */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">Part of speech</label>
            <select
              value={pos ?? ''}
              onChange={(e) => handlePosChange((e.target.value || null) as Pos | null)}
              className="border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              <option value="">—</option>
              {POS_VALUES.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>

          {/* Gender — noun and pronoun */}
          {(pos === 'noun' || pos === 'pronoun') && (
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-gray-500">Gender</label>
              <div className="flex gap-3">
                {GENDER_VALUES.map((g) => (
                  <label key={g} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      value={g}
                      checked={gender === g}
                      onChange={() => setGender(g)}
                      className="accent-blue-500"
                    />
                    <span className="text-sm text-gray-700 capitalize">{g}</span>
                  </label>
                ))}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="gender"
                    value=""
                    checked={gender === null}
                    onChange={() => setGender(null)}
                    className="accent-blue-500"
                  />
                  <span className="text-sm text-gray-500">unset</span>
                </label>
              </div>
            </div>
          )}

          {/* Binyan — verb only */}
          {pos === 'verb' && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">Binyan</label>
              <select
                value={binyan ?? ''}
                onChange={(e) => setBinyan((e.target.value || null) as Binyan | null)}
                className="border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                <option value="">—</option>
                {BINYAN_VALUES.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
          )}

          {/* Root */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">Root</label>
            <input
              type="text"
              dir="rtl"
              value={root}
              onChange={(e) => setRoot(e.target.value)}
              placeholder="e.g. כתב"
              className="border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>

          {/* Conjugations — verb only */}
          {pos === 'verb' && (
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-gray-500">Present conjugations</label>
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                {CONJUGATION_ROWS.map((row, ri) => (
                  <div key={ri} className={`grid grid-cols-3 divide-x divide-gray-100 ${ri > 0 ? 'border-t border-gray-100' : ''}`}>
                    {row.map((idx) => {
                      const pronoun = PRONOUN_ORDER[idx]
                      return (
                        <div key={idx} className="flex flex-col items-center p-2 gap-1">
                          <span className="text-[10px] text-gray-400">{PRONOUN_LABELS_HE[pronoun]}</span>
                          <input
                            type="text"
                            dir="rtl"
                            value={conjugationsPresent[idx] ?? ''}
                            onChange={(e) => setConjugation(idx, e.target.value)}
                            className="w-full text-center text-sm font-medium text-gray-800 border border-gray-200 rounded-lg px-1 py-1 focus:outline-none focus:ring-1 focus:ring-blue-300"
                          />
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-5 py-4 border-t border-gray-100">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3 bg-blue-500 text-white text-sm font-semibold rounded-xl hover:bg-blue-600 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-gray-200 text-sm text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
