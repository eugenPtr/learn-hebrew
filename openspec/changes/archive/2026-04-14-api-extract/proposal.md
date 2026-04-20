## Why

The app needs to turn a photo of handwritten Hebrew lesson notes into structured `{ hebrew, english }` pairs. GPT-4o vision is the extraction engine; this endpoint is the first step in the lesson ingestion flow and a prerequisite for the review screen and all downstream features.

## What Changes

- Create `app/api/extract/route.ts` — a `POST` endpoint that accepts a base64 image and returns extracted vocabulary pairs
- Add `openai` npm package as a dependency
- Handle OpenAI errors, malformed model output, and empty extraction results gracefully

## Capabilities

### New Capabilities

- `image-extraction`: POST endpoint that takes a base64 image, sends it to GPT-4o vision, and returns `{ items: { hebrew: string, english: string }[] }`

### Modified Capabilities

## Impact

- New file: `app/api/extract/route.ts`
- New dependency: `openai` npm package
- Calls OpenAI Chat Completions API (GPT-4o) with vision input
- No DB writes — extraction only; saving to DB is handled by a separate endpoint (EUG-13)
