## 1. Route Setup

- [x] 1.1 Create `app/api/lessons/route.ts` with a named `POST` export
- [x] 1.2 Parse and validate the request body — return 400 if `items` is missing or not an array

## 2. Deduplication

- [x] 2.1 Query all existing `hebrew` values from `vocabulary_items` in a single Supabase call
- [x] 2.2 Filter the incoming items against the existing set (exact match on trimmed `hebrew`)
- [x] 2.3 Track the count of skipped (duplicate) items

## 3. Persistence

- [x] 3.1 Insert a new row into `lessons` and capture its `id`
- [x] 3.2 If any net-new items remain, insert them into `vocabulary_items` with `lesson_id` set (batch insert)
- [x] 3.3 Return `{ lessonId, inserted: N, skipped: N }` with status 200

## 4. Error Handling

- [x] 4.1 If the Supabase insert fails, return 500 with a descriptive error message
- [x] 4.2 Ensure a failed `vocabulary_items` insert does not leave the response hanging (catch and respond)

## 5. Verification

- [ ] 5.1 Test with all-new items — confirm rows appear in `vocabulary_items` and `lessons`
- [ ] 5.2 Test with a mix of new and duplicate items — confirm only new items are inserted
- [ ] 5.3 Test with all-duplicate items — confirm `lessons` row is created, `inserted: 0`
- [ ] 5.4 Test with empty `items` array — confirm `lessons` row is created, `inserted: 0, skipped: 0`
- [ ] 5.5 Test with malformed body — confirm 400 response
