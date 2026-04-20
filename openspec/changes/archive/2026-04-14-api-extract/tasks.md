## 1. Setup

- [x] 1.1 Install `openai` npm package

## 2. Implementation

- [x] 2.1 Create `app/api/extract/route.ts` with `export const maxDuration = 30`
- [x] 2.2 Accept `POST { image: string }` and construct the GPT-4o vision request with `response_format: { type: "json_object" }`
- [x] 2.3 Write the system prompt: extract Hebrew words/phrases from the image and generate correct English translations — explicitly ignore any English or phonetic text written in the notebook
- [x] 2.4 Parse the model response and validate it matches `{ items: { hebrew, english }[] }`
- [x] 2.5 Return HTTP 502 on OpenAI API errors
- [x] 2.6 Return HTTP 422 on malformed/unparseable model output

## 3. Verification

- [x] 3.1 Start dev server and POST a real base64 photo — confirm translations are model-generated (not phonetic copies from notebook)
- [x] 3.2 POST an image with no vocabulary — confirm `{ items: [] }` returned
