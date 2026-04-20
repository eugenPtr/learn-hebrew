# Implementation Notes

Cross-cutting decisions and details that don't fit neatly in a single ticket or spec.

---

## Lesson ingestion flow

### Passing extracted items to the review screen (EUG-10 → EUG-12)

Extracted items are passed from `/lesson/new` to `/lesson/review` via `sessionStorage` (key: `extractedItems`, value: JSON array of `{ hebrew, english }`).

Router state was rejected because Next.js router state can be lost on back/forward navigation. `sessionStorage` survives the push but is cleared when the tab closes, which is acceptable — if the user closes the tab mid-flow they would need to re-upload anyway.

The review screen reads `sessionStorage.getItem('extractedItems')` on mount but does NOT clear it immediately — it is cleared only on successful save. This ensures items survive accidental back-navigation mid-review.

### React Strict Mode double-invocation (EUG-12)

In development, Next.js runs `useEffect` twice (React 18 Strict Mode). Any effect that reads-and-clears a one-shot value (like `sessionStorage`) will find it empty on the second run and behave incorrectly. Fix: guard with a `useRef` flag:

```tsx
const initialized = useRef(false)
useEffect(() => {
  if (initialized.current) return
  initialized.current = true
  // safe to read/clear sessionStorage here
}, [])
```

Apply this pattern to any effect that consumes a one-shot value.

### Image decoding and HEIC support (EUG-10)

**Problem encountered:** `createImageBitmap` rejects HEIC files in Chrome with `InvalidStateError: The source image could not be decoded`. Switching to `HTMLImageElement` + `URL.createObjectURL` didn't help either — Chrome on both desktop and Android cannot decode HEIC natively regardless of the API used.

**Affected scenarios:**
- macOS Chrome selecting HEIC from gallery
- iOS Chrome selecting HEIC from gallery (iOS saves camera photos as HEIC by default)
- Safari (iOS/macOS) is unaffected — it decodes HEIC natively

**Solution chosen:** `heic2any` npm package (client-side, WebAssembly-based). If a HEIC file is detected (by extension or MIME type), it is converted to JPEG in the browser before the canvas step. No server changes needed, works out of the box for the user.

**Trade-off:** ~500KB bundle addition on `/lesson/new` only. Conversion adds ~1–3s on mobile, acceptable since the user waits for GPT-4o anyway.
