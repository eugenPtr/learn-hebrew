## Context

No extraction endpoint exists yet. The app needs to convert a photo of handwritten Hebrew lesson notes into structured vocabulary pairs. GPT-4o vision is the only viable model for this — it handles handwriting and multilingual text in a single call. The endpoint is stateless: it receives an image and returns extracted pairs; no DB interaction.

## Goals / Non-Goals

**Goals:**
- Accept a base64-encoded image via POST and return `{ items: { hebrew, english }[] }`
- Use GPT-4o with a structured prompt that reliably extracts Hebrew/English vocabulary pairs
- Return clean error responses for all failure modes (API error, bad model output, empty result)
- Set a 30s Vercel function timeout to handle slow vision inference

**Non-Goals:**
- Saving extracted items to the DB — that's EUG-13 (`/api/lessons`)
- Image preprocessing or resizing — pass the image directly to the API
- Caching extraction results — each call is independent

## Decisions

**GPT-4o with JSON mode via response_format**
Use `response_format: { type: "json_object" }` and instruct the model to return `{ "items": [...] }`. This is more reliable than parsing free-text output and avoids regex fragility. Alternative: structured outputs with a Zod schema — deferred as unnecessary complexity for a single-field array.

**Base64 image in request body**
Accept `{ image: string }` (base64, no data URI prefix) in the POST body. The client strips the `data:image/...;base64,` prefix before sending. Alternative: multipart/form-data upload — skipped to keep the API simple and consistent with how the UI will construct the request.

**Prompt strategy**
System prompt instructs GPT-4o to extract Hebrew words/phrases from the image and generate correct English translations itself — explicitly ignoring any English or phonetic text written in the notebook. This is critical because notebooks often contain phonetic transcriptions (e.g. "yesh" for יש) or incorrect/incomplete translations. Trusting the notebook would corrupt the vocabulary bank. The model's translation is authoritative; the notebook's English annotations are discarded. The model is also responsible for deduplication — if the same Hebrew word or phrase appears multiple times in the image (e.g. written in two places), it is included only once in the output. If no Hebrew is found, return `{ "items": [] }`.

**30s max duration**
GPT-4o vision calls can take 10–20s on large images. Set `export const maxDuration = 30` on the route to avoid Vercel's default 10s timeout.

## Risks / Trade-offs

- [Handwriting quality] Poor handwriting or low-res photos may produce wrong or missing pairs → Mitigation: the review screen (EUG-12) lets the user correct before saving
- [Model output variance] GPT-4o may occasionally return malformed JSON despite `json_object` mode → Mitigation: wrap parse in try/catch, return 422 with a clear error message
- [Cost] Each vision call costs ~$0.01–0.03 depending on image size → Acceptable for personal use; no mitigation needed
