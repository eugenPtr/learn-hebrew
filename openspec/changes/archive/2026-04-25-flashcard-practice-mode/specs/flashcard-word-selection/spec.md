## ADDED Requirements

### Requirement: GET /api/flashcard returns N selected vocabulary items
The system SHALL expose a `GET /api/flashcard?count=N` endpoint that returns an array of vocabulary items selected by the active strategy. `count` defaults to 10 if not provided.

#### Scenario: Returns requested count
- **WHEN** `GET /api/flashcard?count=20` is called
- **THEN** the response is `200 OK` with a JSON array of up to 20 vocabulary items

#### Scenario: Returns fewer than count when vocabulary is small
- **WHEN** the vocabulary has fewer items than `count`
- **THEN** all available items are returned without error

#### Scenario: Invalid count returns 400
- **WHEN** `GET /api/flashcard?count=0` or a non-numeric value is provided
- **THEN** the response is `400 Bad Request`

#### Scenario: Default count is 10
- **WHEN** `GET /api/flashcard` is called with no `count` parameter
- **THEN** up to 10 items are returned

### Requirement: Selection logic is encapsulated in a swappable strategy
The system SHALL implement selection as a strategy object in `lib/flashcard-selection.ts`. A single `activeStrategy` export controls which strategy runs. Changing strategy requires only updating `activeStrategy`.

#### Scenario: Strategy is invoked by the API route
- **WHEN** `GET /api/flashcard` is called
- **THEN** the route calls `activeStrategy.select(allItems, count)` and returns the result

### Requirement: Default strategy prioritizes recent mistakes then stalest words
The default strategy SHALL:
1. Select items where `last_mistake_at >= now() - 3 days` (recent mistake items, up to `count`)
2. Fill remaining slots with items sorted by `last_used_at ASC NULLS FIRST` (never-used items first, then oldest-practiced)
3. Shuffle the merged result before returning

#### Scenario: Recent mistake items appear in selection
- **WHEN** some items have `last_mistake_at` within the last 3 days
- **THEN** those items are included in the returned set before any staleness-sorted items

#### Scenario: Never-used items have highest staleness priority
- **WHEN** some items have `last_used_at = null`
- **THEN** those items appear before items with any `last_used_at` value in the staleness fill

#### Scenario: Result is shuffled
- **WHEN** the strategy returns items
- **THEN** the order is randomized (recent mistakes are not always at the front)

### Requirement: POST /api/flashcard writes session results
The system SHALL expose a `POST /api/flashcard` endpoint accepting `{ results: Array<{ itemId: string, mistakeMade: boolean }> }`. For all items, it increments `number_used` and sets `last_used_at = now()`. For items where `mistakeMade` is true, it also sets `last_mistake_at = now()`.

#### Scenario: All items get last_used_at updated
- **WHEN** a POST to `/api/flashcard` is made with a results array
- **THEN** every item in the array has `last_used_at` set to the current timestamp and `number_used` incremented by 1

#### Scenario: Mistake items get last_mistake_at updated
- **WHEN** a POST to `/api/flashcard` includes an item with `mistakeMade: true`
- **THEN** that item's `last_mistake_at` is set to the current timestamp

#### Scenario: Non-mistake items do not overwrite last_mistake_at
- **WHEN** a POST to `/api/flashcard` includes an item with `mistakeMade: false`
- **THEN** that item's `last_mistake_at` is not modified

#### Scenario: Empty results array is accepted
- **WHEN** a POST to `/api/flashcard` is made with an empty `results` array
- **THEN** the response is `200 OK` with no DB writes
