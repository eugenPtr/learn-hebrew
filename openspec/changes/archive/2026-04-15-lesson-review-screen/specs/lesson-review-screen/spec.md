## ADDED Requirements

### Requirement: Page reads extracted items from sessionStorage on mount
The system SHALL read `sessionStorage.getItem('extractedItems')` on mount, parse the JSON array, and clear the key immediately after reading. If the key is empty or missing, the user SHALL be redirected to `/lesson/new`.

#### Scenario: Items present in sessionStorage
- **WHEN** the user navigates to `/lesson/review` after a successful extraction
- **THEN** the extracted items SHALL be displayed and `sessionStorage` SHALL be cleared

#### Scenario: No items in sessionStorage
- **WHEN** the user navigates directly to `/lesson/review` without prior extraction
- **THEN** the user SHALL be redirected to `/lesson/new`

### Requirement: Known items are visually distinguished from new items
The system SHALL query Supabase `vocabulary_items` for existing `hebrew` values on mount and mark any extracted item whose `hebrew` matches as known. Known items SHALL be visually distinct (e.g. dimmed with an "Already known" badge). If the Supabase query fails, all items SHALL default to new.

#### Scenario: Item already exists in vocabulary bank
- **WHEN** an extracted item's `hebrew` value matches an existing row in `vocabulary_items`
- **THEN** that item SHALL be rendered with a visual "Already known" indicator

#### Scenario: Supabase query fails
- **WHEN** the known-items lookup throws an error
- **THEN** all items SHALL be shown as new and the review SHALL proceed normally

### Requirement: User can delete individual items before confirming
The system SHALL render a delete button on each row. Tapping delete SHALL remove the item from the local list only — no DB call. Hebrew text SHALL be `dir="rtl"` aligned.

#### Scenario: User deletes an item
- **WHEN** the user taps the delete button on a row
- **THEN** that item SHALL be removed from the list immediately without any network request

### Requirement: Confirm button is disabled when list is empty
The system SHALL disable the "Looks good" CTA when no items remain in the list.

#### Scenario: All items deleted
- **WHEN** the user deletes all items from the list
- **THEN** the confirm button SHALL be disabled

### Requirement: User can edit individual items before confirming
The system SHALL allow the user to tap any row to open an edit modal. The modal SHALL display the row's hebrew and english as editable inputs, render with a blurred background overlay, and provide a Save button and an X (close) button. Tapping Save SHALL update the item in local state and close the modal. Tapping X SHALL close without saving. Hebrew input SHALL be `dir="rtl"`.

#### Scenario: User opens edit modal
- **WHEN** the user taps a row
- **THEN** an edit modal SHALL appear with the row's current hebrew and english values pre-filled

#### Scenario: User saves an edit
- **WHEN** the user edits values and taps Save
- **THEN** the item in the list SHALL reflect the updated values and the modal SHALL close

#### Scenario: User cancels an edit
- **WHEN** the user taps X without saving
- **THEN** the item SHALL remain unchanged and the modal SHALL close

### Requirement: Confirm saves items and redirects home
The system SHALL POST `{ items }` to `/api/lessons` when the user taps "Looks good", show a saving state during the request, redirect to `/` on success, and show an inline error with a retry option on failure.

#### Scenario: Successful save
- **WHEN** the user taps "Looks good" and `/api/lessons` returns success
- **THEN** the user SHALL be redirected to `/`

#### Scenario: Save fails
- **WHEN** `/api/lessons` returns an error
- **THEN** an error message SHALL be shown and the confirm button SHALL be re-enabled for retry
