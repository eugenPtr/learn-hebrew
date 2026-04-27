## ADDED Requirements

### Requirement: /lesson/[id] loads and displays a lesson's title and vocabulary
The system SHALL render a page at `/lesson/[id]` that fetches `GET /api/lessons/[id]` on mount and displays the lesson title (or positional fallback) and its full vocabulary list.

#### Scenario: Lesson loads successfully
- **WHEN** the user navigates to `/lesson/[id]` for an existing lesson
- **THEN** the page SHALL display the lesson's title (or "Lesson N" fallback) and a list of its vocabulary items, each showing Hebrew and English

#### Scenario: Lesson not found
- **WHEN** the user navigates to `/lesson/[id]` for a non-existent id
- **THEN** the page SHALL display an error message and a back link to the dashboard

#### Scenario: Loading state
- **WHEN** the page is mounted and the API request is in flight
- **THEN** a loading indicator SHALL be shown in place of the vocabulary list

### Requirement: Lesson title is editable from the detail page
The system SHALL display the lesson title as an editable field. Editing and saving the title calls `PATCH /api/lessons/[id]` with the new value. Clearing the field reverts to the positional fallback display.

#### Scenario: User edits and saves a title
- **WHEN** the user edits the title field and confirms
- **THEN** `PATCH /api/lessons/[id]` is called with the new title and the page reflects the saved value

#### Scenario: User clears the title
- **WHEN** the user clears the title field and saves
- **THEN** `PATCH /api/lessons/[id]` is called with `null` and the page displays the positional fallback label

### Requirement: Vocabulary rows are inline-editable
The system SHALL render each vocabulary item as a row. Tapping a row reveals Hebrew and English `<input>` fields in place of the display text. The row shows Save and Cancel buttons. Save calls `PATCH /api/vocabulary-items/[id]`. Cancel restores the row to display mode with original values. Only one row may be in edit mode at a time.

#### Scenario: User taps a word row to edit
- **WHEN** the user taps a vocabulary row
- **THEN** the row SHALL switch to edit mode showing Hebrew and English inputs pre-filled with current values, along with Save and Cancel buttons

#### Scenario: User saves an edit
- **WHEN** the user modifies inputs and taps Save
- **THEN** `PATCH /api/vocabulary-items/[id]` is called; on success the row returns to display mode showing updated values; Save is disabled and shows a loading state while the request is in flight

#### Scenario: User cancels an edit
- **WHEN** the user taps Cancel
- **THEN** the row returns to display mode with original values unchanged, and no API call is made

#### Scenario: One edit at a time
- **WHEN** the user taps a second row while another row is in edit mode
- **THEN** the first row SHALL close without saving and the second row SHALL open in edit mode

### Requirement: Words can be deleted from the detail page
Each vocabulary row in display mode SHALL include a delete control. Tapping it calls `DELETE /api/vocabulary-items/[id]` and removes the row from the list on success.

#### Scenario: User deletes a word
- **WHEN** the user taps the delete control on a word row and confirms
- **THEN** `DELETE /api/vocabulary-items/[id]` is called and the row is removed from the list

### Requirement: New words can be added from the detail page
The detail page SHALL include an "Add word" form with Hebrew and English inputs. Submitting the form calls `POST /api/lessons/[id]/words`. On success, the new (or transferred) word appears in the list.

#### Scenario: User adds a new word
- **WHEN** the user fills in the Add word form and submits
- **THEN** `POST /api/lessons/[id]/words` is called; on success the form clears and the word appears in the vocabulary list

#### Scenario: Submitted word already exists in another lesson
- **WHEN** the added Hebrew already exists in another lesson
- **THEN** the API returns `action: "transferred"` and the word appears in the list (ownership was silently transferred)

#### Scenario: Invalid submission
- **WHEN** the user submits with an empty Hebrew or English field
- **THEN** the form SHALL show a validation error and no API call is made

### Requirement: A back button navigates to the dashboard
The detail page SHALL display a back button (or link) that navigates to `/`.

#### Scenario: User taps back
- **WHEN** the user taps the back button on the lesson detail page
- **THEN** the user is navigated to `/`
