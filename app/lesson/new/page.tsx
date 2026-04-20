'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

type State = 'idle' | 'loading' | 'empty' | 'error'

export default function NewLessonPage() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [state, setState] = useState<State>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleFile(file: File) {
    setState('loading')
    setErrorMsg('')
    console.log('[extract] file selected:', file.name, file.type, file.size)

    let image: string
    try {
      // Convert to JPEG via canvas using HTMLImageElement (broader format support than createImageBitmap)
      console.log('[extract] converting to JPEG via canvas…')

      // HEIC files can't be decoded by Chrome on desktop or Android — convert first
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
      image = dataUrl.replace('data:image/jpeg;base64,', '')
      console.log('[extract] JPEG base64 ready, length:', image.length)
    } catch (err) {
      console.error('[extract] canvas conversion failed:', err)
      setState('error')
      setErrorMsg('Failed to process image — try a different photo.')
      return
    }

    let data: { items?: { hebrew: string; english: string }[]; error?: string }
    try {
      console.log('[extract] POSTing to /api/extract…')
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image }),
      })
      data = await res.json()
      console.log('[extract] response status:', res.status, data)
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)
    } catch (err) {
      console.error('[extract] fetch failed:', err)
      setState('error')
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong')
      return
    }

    if (!data.items || data.items.length === 0) {
      setState('empty')
      return
    }

    // Pass items to review screen via sessionStorage (avoids URL length limits)
    sessionStorage.setItem('extractedItems', JSON.stringify(data.items))
    router.push('/lesson/review')
  }

  function reset() {
    setState('idle')
    setErrorMsg('')
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
            <span className="text-gray-500">Extracting vocabulary…</span>
          </span>
        ) : (
          <span className="flex flex-col items-center gap-2">
            <span className="text-4xl">📷</span>
            <span className="font-medium text-blue-600">Choose or take a photo</span>
          </span>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          disabled={state === 'loading'}
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
          }}
        />
      </label>

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
