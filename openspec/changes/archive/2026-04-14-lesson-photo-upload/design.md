## Context

The `/lesson/new` page is a client component — it handles file selection, image processing, and an API call, all of which require browser APIs. The page is mobile-first: users will primarily take a photo with their phone camera rather than uploading from a gallery.

The `/api/extract` endpoint already exists and expects a raw base64 JPEG string (no data URI prefix). The page must bridge the gap between the browser's `File` object and that format.

## Goals / Non-Goals

**Goals:**
- Let the user select or capture a photo
- Convert it reliably to JPEG base64 before sending to `/api/extract`
- Show a loading state during the API call
- Navigate to the review screen with extracted items on success
- Show a recoverable error with a retry option on failure

**Non-Goals:**
- Image cropping or editing UI
- Preview of the selected photo before submitting
- Multiple photo uploads in one lesson

## Decisions

**Canvas-based JPEG conversion with heic2any pre-processing**
Use an off-screen `<canvas>` to draw the selected image and export it as `image/jpeg`. Before drawing, detect HEIC files (by extension or MIME type) and convert them using the `heic2any` npm package — Chrome on desktop and Android cannot decode HEIC natively via any browser API. Safari handles HEIC natively and doesn't need the conversion step. Alternative considered: server-side conversion with Sharp — rejected due to native binary deployment complexity on Vercel. Alternative considered: restrict `accept` to JPEG only — rejected because iOS auto-transcodes for iOS Chrome but not macOS Chrome, leaving a gap.

**`'use client'` page with no server component wrapper**
File input and canvas require browser APIs; there's nothing to SSR here. A pure client component is the simplest approach.

**Router state for passing items to review screen**
Pass extracted items to `/lesson/review` via `router.push` with state (Next.js `useRouter` + `window.history.state` or a lightweight URL-encoded param). Alternative: store in a global state manager — overkill for a single-step handoff between two pages.

**No compression beyond JPEG conversion**
Canvas `toDataURL('image/jpeg', 0.85)` gives reasonable quality reduction. Explicit resizing is deferred — GPT-4o handles large images fine and cost is acceptable for personal use.

## Risks / Trade-offs

- [HEIC on non-Safari] Chrome on desktop and Android cannot decode HEIC natively → Mitigation: `heic2any` pre-converts HEIC to JPEG client-side before the canvas step; adds ~500KB to the bundle and ~1–3s conversion time
- [Large images] High-res photos may cause slow base64 encoding on low-end devices → Mitigation: acceptable for v1; compression can be added later
- [Router state loss] If the user navigates back from the review screen and then forward, state may be lost → Mitigation: user can just re-upload; not a critical flow
