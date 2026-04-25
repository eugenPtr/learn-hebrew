## ADDED Requirements

### Requirement: End-of-flashcard-session updates last_mistake_at for mistake words
When `POST /api/flashcard` is called with session results, the system SHALL set `last_mistake_at = now()` for every item where `mistakeMade: true`. Items where `mistakeMade: false` SHALL NOT have their `last_mistake_at` value modified.

#### Scenario: Mistake item gets last_mistake_at set
- **WHEN** a session result includes `{ itemId: "x", mistakeMade: true }`
- **THEN** `vocabulary_items` row with `id = "x"` has `last_mistake_at` set to the current timestamp

#### Scenario: Correct item preserves last_mistake_at
- **WHEN** a session result includes `{ itemId: "y", mistakeMade: false }` and that item previously had `last_mistake_at = "2026-04-20"`
- **THEN** the item's `last_mistake_at` remains `"2026-04-20"` after the POST

### Requirement: last_mistake_at within 3 days causes item to be prioritized in next session
The selection strategy SHALL treat any item with `last_mistake_at >= now() - 3 days` as a priority item, placing it in the selected set before staleness-sorted items.

#### Scenario: Item with recent mistake is included in next session
- **WHEN** an item has `last_mistake_at` set to yesterday
- **THEN** `GET /api/flashcard` includes that item in its results even if other items have older `last_used_at` values

#### Scenario: Item with mistake older than 3 days is not prioritized
- **WHEN** an item has `last_mistake_at` set to 4 days ago
- **THEN** that item is not given priority over staleness-sorted items
