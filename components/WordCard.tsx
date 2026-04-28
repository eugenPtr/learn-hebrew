'use client'

import { PRONOUN_ORDER, PRONOUN_LABELS_HE } from '@/lib/hebrew'
import type { WordFields } from '@/lib/wordTypes'

// 9-pronoun rows displayed as 3×3
const CONJUGATION_ROWS = [
  [0, 1, 2],   // אני, אתה, את
  [3, 4, 5],   // הוא, היא, אנחנו
  [6, 7, 8],   // אתם, הם, הן
]

type Props = {
  item: WordFields & { known?: boolean; loading?: boolean }
  onClick: () => void
  onDelete?: () => void
}

export default function WordCard({ item, onClick, onDelete }: Props) {
  const { hebrew, english, pos, gender, binyan, root, conjugations, known, loading } = item

  return (
    <div
      onClick={onClick}
      className={`relative bg-white rounded-2xl border border-gray-200 p-4 cursor-pointer
        hover:border-blue-300 hover:shadow-sm transition-all select-none
        ${known ? 'opacity-50' : ''}`}
    >
      {onDelete && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center
            text-gray-300 hover:text-red-400 transition-colors text-lg leading-none"
          aria-label="Delete"
        >
          ×
        </button>
      )}

      {loading ? (
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-start gap-4">
            <span className="text-2xl font-bold text-gray-800" dir="rtl">{hebrew}</span>
            <span className="text-sm text-gray-400 text-right">{english}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <div className="w-3 h-3 rounded-full border-2 border-gray-300 border-t-blue-400 animate-spin" />
            <span>Analysing…</span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3 pr-6">
          {/* Hebrew + English */}
          <div className="flex items-start justify-between gap-4">
            <span className="text-2xl font-bold text-gray-800 leading-tight" dir="rtl">{hebrew}</span>
            <span className="text-sm text-gray-500 text-right mt-1 flex-shrink-0 max-w-[55%]">{english}</span>
          </div>

          {/* Meta chips */}
          {(pos || gender || binyan || root || known) && (
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              {pos && (
                <span className="bg-blue-50 text-blue-700 rounded-full px-2 py-0.5 font-medium">
                  {pos}
                </span>
              )}
              {(pos === 'noun' || pos === 'pronoun') && gender && (
                <span className={`rounded-full px-2 py-0.5 font-medium
                  ${gender === 'masculine' ? 'bg-sky-50 text-sky-700' : 'bg-pink-50 text-pink-700'}`}>
                  {gender === 'masculine' ? 'm' : 'f'}
                </span>
              )}
              {pos === 'verb' && binyan && (
                <span className="bg-purple-50 text-purple-700 rounded-full px-2 py-0.5 font-medium">
                  {binyan}
                </span>
              )}
              {root && (
                <span className="text-gray-500">
                  <span className="text-gray-400">root </span>
                  <span className="font-medium" dir="rtl">{root}</span>
                </span>
              )}
              {known && (
                <span className="bg-gray-100 text-gray-400 rounded-full px-2 py-0.5">
                  already known
                </span>
              )}
            </div>
          )}

          {/* Conjugation grid — verb only */}
          {pos === 'verb' && conjugations?.present && conjugations.present.length === 9 && (
            <div className="mt-1 border border-gray-100 rounded-xl overflow-hidden text-xs">
              <div className="bg-gray-50 px-3 py-1 text-gray-400 font-medium text-[11px] uppercase tracking-wide">
                Present
              </div>
              {CONJUGATION_ROWS.map((row, ri) => (
                <div key={ri} className={`grid grid-cols-3 divide-x divide-gray-100 ${ri > 0 ? 'border-t border-gray-100' : ''}`}>
                  {row.map((idx) => {
                    const pronoun = PRONOUN_ORDER[idx]
                    const form = conjugations.present[idx]
                    return (
                      <div key={idx} className="flex flex-col items-center py-2 px-2 gap-0.5">
                        <span className="text-gray-400 text-[10px]">{PRONOUN_LABELS_HE[pronoun]}</span>
                        <span className="font-semibold text-gray-800 text-sm" dir="rtl">
                          {form || <span className="text-gray-300">—</span>}
                        </span>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
