## ADDED Requirements

### Requirement: Practice page has three states
The `/practice` page SHALL display one of three states: `picking`, `running`, or `summary`. The initial state is `picking`.

#### Scenario: Page loads in picking state
- **WHEN** the user navigates to `/practice`
- **THEN** the page shows the word count selector with three options: 10, 20, and 30

### Requirement: Word count picker shows three options
In the `picking` state, the system SHALL render three stacked buttons labeled "10 words", "20 words", and "30 words".

#### Scenario: User selects a word count
- **WHEN** the user clicks one of the three count buttons
- **THEN** the page fetches `GET /api/flashcard?count=N` and transitions to a loading state

#### Scenario: Loading state while fetching
- **WHEN** the fetch to `/api/flashcard` is in progress
- **THEN** the page shows a loading indicator and the count buttons are disabled

#### Scenario: Fetch fails
- **WHEN** `GET /api/flashcard` returns a non-2xx response
- **THEN** the page shows an error message and returns to the `picking` state

### Requirement: Flashcard loop in running state
In the `running` state, the system SHALL display one card at a time. Each card shows the English word or phrase and prompts the user for the Hebrew translation via a text input.

#### Scenario: Flashcard displays English side
- **WHEN** the running state is active
- **THEN** the current card shows the English word or phrase prominently, a text input for Hebrew entry, an "I don't know" button, and a "Check" button

#### Scenario: Progress indicator
- **WHEN** the running state is active
- **THEN** the page shows how many cards remain in the deck (e.g. "7 cards left")

### Requirement: Correct answer advances to next card
The system SHALL compare the user's input against the stored Hebrew value using nikud-stripped normalized exact match (strip U+0591–U+05C7, trim whitespace). On match, the card is removed from the deck.

#### Scenario: User types correct Hebrew and clicks Check
- **WHEN** the user's input matches the Hebrew value after normalization
- **THEN** the card is removed from the deck and the next card is shown (or summary if deck is empty)

#### Scenario: Normalization ignores nikud
- **WHEN** the stored Hebrew is `כֶּלֶב` and the user types `כלב`
- **THEN** the answer is accepted as correct

### Requirement: Wrong answer or IDK shows revealed state
When the user clicks "Check" with an incorrect answer, or clicks "I don't know", the system SHALL show the revealed state: display the correct Hebrew text, optionally play the audio, and show a "Continue" button.

#### Scenario: Wrong answer reveals correct Hebrew
- **WHEN** the user's input does not match the Hebrew value and they click Check
- **THEN** the correct Hebrew text is displayed, the audio play button is shown (if audio_url is not null), and a "Continue" button appears

#### Scenario: IDK reveals correct Hebrew
- **WHEN** the user clicks "I don't know"
- **THEN** the correct Hebrew text is displayed, the audio play button is shown (if audio_url is not null), and a "Continue" button appears

#### Scenario: Audio plays on demand
- **WHEN** the user clicks the play button in revealed state
- **THEN** the MP3 at the item's audio_url is played

#### Scenario: No audio button when audio_url is null
- **WHEN** the item has no audio_url
- **THEN** no play button is shown in revealed state

### Requirement: Mistakes are re-queued in the deck
When a card is revealed (wrong or IDK), clicking "Continue" SHALL re-insert the card into the deck at a random position at least 3 cards from the current position. The card is also marked as a mistake for the session.

#### Scenario: Continue re-queues the card
- **WHEN** the user clicks "Continue" after a revealed card
- **THEN** the card is inserted back into the deck at index `currentIndex + 3` or later (randomly chosen), and the next card is shown

#### Scenario: Re-queue near end of deck
- **WHEN** fewer than 3 cards remain after the current card
- **THEN** the mistake card is appended to the end of the deck

### Requirement: Session ends when deck is empty
When the last card is answered correctly and removed from the deck, the system SHALL transition to the `summary` state.

#### Scenario: Deck empties after correct answer
- **WHEN** the user answers the last remaining card correctly
- **THEN** the page transitions to the summary state

### Requirement: Summary state shows results and flushes to API
In the `summary` state, the system SHALL show the total words practiced, count of words answered correctly on first attempt, and count of words where a mistake was made. A "Done" button SHALL POST results to `/api/flashcard` and navigate to `/`.

#### Scenario: Summary displays counts
- **WHEN** the summary state is shown
- **THEN** total words, first-attempt correct count, and mistake count are displayed

#### Scenario: Done button flushes results
- **WHEN** the user clicks "Done"
- **THEN** a POST is made to `/api/flashcard` with `{ results: [{ itemId, mistakeMade: boolean }] }` for all words in the session

#### Scenario: Done button navigates home on success
- **WHEN** the POST to `/api/flashcard` succeeds
- **THEN** the user is navigated to `/`

#### Scenario: Done button shows error on failure
- **WHEN** the POST to `/api/flashcard` fails
- **THEN** an error message is shown and the user can retry
