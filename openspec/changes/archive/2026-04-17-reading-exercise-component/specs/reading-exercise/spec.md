## ADDED Requirements

### Requirement: Display Hebrew sentence with RTL direction
The component SHALL display `exercise.hebrewSentence` prominently with `dir="rtl"` and `lang="he"`.

#### Scenario: Hebrew text is visible and RTL
- **WHEN** the component renders with a valid exercise
- **THEN** the Hebrew sentence is displayed with `dir="rtl"` attribute

### Requirement: Speaker button plays audio on click
The component SHALL render a speaker icon button that plays `exercise.audioUrl` when clicked. Playback MUST be triggered by user interaction, not on mount.

#### Scenario: Speaker button plays audio
- **WHEN** the user clicks the speaker button
- **THEN** audio from `exercise.audioUrl` begins playing

#### Scenario: No autoplay on mount
- **WHEN** the component first renders
- **THEN** no audio plays automatically

### Requirement: English translation input and Check button
The component SHALL render a text input for the English translation and a "Check" button to submit.

#### Scenario: Input accepts English text
- **WHEN** the component renders
- **THEN** a text input is present and accepts keyboard input

#### Scenario: Check button submits the answer
- **WHEN** the user types an answer and clicks "Check"
- **THEN** the answer is scored

### Requirement: Answer scoring — 70% token match threshold
The component SHALL score the answer by tokenising both the user input and `exercise.englishSentence` (split on whitespace, lowercased, punctuation stripped), then comparing token sets. The answer is correct if the intersection covers ≥ 70% of the reference tokens.

#### Scenario: Exact match is correct
- **WHEN** the user types the exact English sentence
- **THEN** the result is correct

#### Scenario: Answer with minor omissions passes if ≥ 70% tokens match
- **WHEN** the user types a response covering ≥ 70% of the reference tokens
- **THEN** the result is correct

#### Scenario: Answer with too few matching tokens fails
- **WHEN** the user types a response covering < 70% of the reference tokens
- **THEN** the result is incorrect

### Requirement: Inline result feedback after submission
After the user submits, the component SHALL show whether the answer was correct or incorrect and reveal the correct answer. The input SHALL be disabled after submission.

#### Scenario: Correct answer feedback
- **WHEN** the user submits a correct answer
- **THEN** a correct indicator is shown and the correct answer is revealed

#### Scenario: Incorrect answer feedback
- **WHEN** the user submits an incorrect answer
- **THEN** an incorrect indicator is shown and the correct answer is revealed

#### Scenario: Input disabled after submission
- **WHEN** the user has submitted an answer
- **THEN** the text input is disabled

### Requirement: Next button triggers onComplete callback
After submission, the component SHALL show a "Next" button. Clicking it SHALL call `onComplete(correct)` with the result of the scored answer.

#### Scenario: Next button calls onComplete
- **WHEN** the user clicks "Next" after submitting
- **THEN** `onComplete` is called with `true` if the answer was correct, `false` otherwise
