## 1. Page scaffold

- [ ] 1.1 Create `app/lesson/new/page.tsx` as a `'use client'` component
- [ ] 1.2 Add a file input with `accept="image/*"` and `capture="environment"`

## 2. Image processing

- [ ] 2.1 On file select, draw the image to an off-screen canvas and export as JPEG (`toDataURL('image/jpeg', 0.85)`)
- [ ] 2.2 Strip the `data:image/jpeg;base64,` prefix to get raw base64

## 3. API call and state

- [ ] 3.1 POST `{ image }` to `/api/extract` on file select
- [ ] 3.2 Show loading spinner and disable file input while request is in flight
- [ ] 3.3 On success with non-empty items: navigate to `/lesson/review` passing extracted items
- [ ] 3.4 On success with empty items: show "Nothing found — try another photo" message with retry
- [ ] 3.5 On error response: show error message and re-enable file input for retry

## 4. Verification

- [x] 4.1 Test on desktop: select a PNG — confirm it reaches `/api/extract` as JPEG base64
- [x] 4.2 Test loading state is visible during the API call
- [x] 4.3 Test error state: confirm retry is possible without page reload
