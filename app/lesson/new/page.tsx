'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

type State = 'idle' | 'loading' | 'empty' | 'error' | 'partial-success'

export default function NewLessonPage() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [state, setState] = useState<State>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [progressText, setProgressText] = useState('')
  const [failedCount, setFailedCount] = useState(0)
  const [totalCount, setTotalCount] = useState(0)

  async function convertToJpeg(file: File): Promise<string> {
    const isHeic = file.name.toLowerCase().endsWith('.heic') || file.type === 'image/heic' || file.type === 'image/heif'
    const sourceFile = isHeic
      ? await import('heic2any').then(({ default: heic2any }) =>
          heic2any({ blob: file, toType: 'image/jpeg', quality: 0.85 }).then(
            (result) => new File([result as Blob], file.name.replace(/\.heic$/i, '.jpg'), { type: 'image/jpeg' })
          )
        )
      : file

    const url = URL.createObjectURL(sourceFile)
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = reject
      el.src = url
    })
    URL.revokeObjectURL(url)
    const canvas = document.createElement('canvas')
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    canvas.getContext('2d')!.drawImage(img, 0, 0)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
    return dataUrl.replace('data:image/jpeg;base64,', '')
  }

  async function handleFiles(files: FileList) {
    setState('loading')
    setErrorMsg('')
    setFailedCount(0)

    const total = files.length
    setTotalCount(total)

    const allItems: { hebrew: string; english: string }[] = []
    let failed = 0

    for (let i = 0; i < total; i++) {
      setProgressText(total === 1 ? 'Extracting vocabulary…' : `Processing photo ${i + 1} of ${total}…`)

      const file = files[i]
      try {
        const image = await convertToJpeg(file)
        const res = await fetch('/api/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image }),
        })
        const data: { items?: { hebrew: string; english: string }[]; error?: string } = await res.json()
        if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)
        if (data.items && data.items.length > 0) {
          allItems.push(...data.items)
        } else {
          failed++
        }
      } catch {
        failed++
      }
    }

    setFailedCount(failed)

    if (allItems.length === 0) {
      if (failed === total) {
        setState('error')
        setErrorMsg('Could not process any of the selected photos.')
      } else {
        setState('empty')
      }
      return
    }

    sessionStorage.setItem('extractedItems', JSON.stringify(allItems))

    if (failed > 0) {
      setState('partial-success')
    } else {
      router.push('/lesson/review')
    }
  }

  function reset() {
    setState('idle')
    setErrorMsg('')
    setProgressText('')
    setFailedCount(0)
    setTotalCount(0)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-2xl font-semibold">New Lesson</h1>
      <p className="text-gray-500 text-center">Take a photo of your notebook to extract vocabulary.</p>

      <label className={`cursor-pointer rounded-xl border-2 border-dashed px-8 py-10 text-center transition
        ${state === 'loading' ? 'cursor-not-allowed opacity-50 border-gray-300' : 'border-blue-400 hover:bg-blue-50'}`}>
        {state === 'loading' ? (
          <span className="flex flex-col items-center gap-2">
            <svg className="animate-spin h-8 w-8 text-blue-500" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <span className="text-gray-500">{progressText}</span>
          </span>
        ) : (
          <span className="flex flex-col items-center gap-2">
            <span className="text-4xl">📷</span>
            <span className="font-medium text-blue-600">Choose or take a photo</span>
            <span className="text-xs text-gray-400">You can select multiple photos</span>
          </span>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          disabled={state === 'loading'}
          onChange={(e) => {
            const files = e.target.files
            if (files && files.length > 0) handleFiles(files)
          }}
        />
      </label>

      {state === 'partial-success' && (
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700">
            {failedCount} of {totalCount} photos could not be processed
          </div>
          <button
            onClick={() => router.push('/lesson/review')}
            className="rounded-xl bg-blue-500 text-white font-semibold py-3 px-8 hover:bg-blue-600 transition"
          >
            Continue with {totalCount - failedCount} photo{totalCount - failedCount !== 1 ? 's' : ''}
          </button>
          <button onClick={reset} className="text-sm text-gray-400 underline">Start over</button>
        </div>
      )}

      {state === 'empty' && (
        <div className="text-center">
          <p className="text-amber-600 font-medium">Nothing found — try another photo.</p>
          <button onClick={reset} className="mt-2 text-blue-500 underline">Try again</button>
        </div>
      )}

      {state === 'error' && (
        <div className="text-center">
          <p className="text-red-600 font-medium">Extraction failed.</p>
          <p className="text-sm text-gray-500 mt-1">{errorMsg}</p>
          <button onClick={reset} className="mt-2 text-blue-500 underline">Try again</button>
        </div>
      )}
    </main>
  )
}
