## 1. File input changes

- [x] 1.1 Remove `capture="environment"` from the file input
- [x] 1.2 Add `multiple` attribute to the file input

## 2. State and type updates

- [x] 2.1 Replace single `State` type with states that support multi-photo progress: add a `progress` field (current photo index + total) to the loading state
- [x] 2.2 Add `failedCount` and `totalCount` to component state for post-processing warning

## 3. Multi-photo processing loop

- [x] 3.1 Replace `handleFile(file: File)` with `handleFiles(files: FileList)` that iterates sequentially
- [x] 3.2 For each file, run the existing HEIC conversion + canvas JPEG + `/api/extract` pipeline
- [x] 3.3 Update progress state each iteration: "Processing photo N of M…"
- [x] 3.4 On per-photo success: push items into accumulated results array
- [x] 3.5 On per-photo error or empty result: increment `failedCount`, continue loop

## 4. Post-processing navigation and error states

- [x] 4.1 After loop: if merged list is empty and all failed → show existing error state
- [x] 4.2 After loop: if merged list is empty but no errors (all returned empty) → show existing "nothing found" state
- [x] 4.3 After loop: if merged list has items → write to `sessionStorage.extractedItems` and navigate to `/lesson/review`
- [x] 4.4 If `failedCount > 0` and merged list has items → show non-blocking warning banner: "X of N photos could not be processed"

## 5. UI wiring

- [x] 5.1 Update `onChange` handler to pass `e.target.files` (FileList) to `handleFiles`
- [x] 5.2 Update loading UI to show the dynamic "Processing photo N of M…" string
- [x] 5.3 Render warning banner below results when `failedCount > 0`
