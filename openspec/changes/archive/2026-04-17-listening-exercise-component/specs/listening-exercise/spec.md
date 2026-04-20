## ADDED Requirements

### Requirement: Audio auto-plays on mount
The component SHALL attempt to play `exercise.audioUrl` automatically when first rendered.

#### Scenario: Audio plays on mount
- **WHEN** the component first renders
- **THEN** `exercise.audioUrl` begins playing

### Requirement: Speaker button replays audio
The component SHALL render a speaker icon button that replays `exercise.audioUrl` on click at any time.

#### Scenario: Speaker button replays audio
- **WHEN** the user clicks the speaker button
- **THEN** audio from `exercise.audioUrl` plays again from the start

### Requirement: Hebrew sentence is hidden before submission
The component SHALL NOT display `exercise.hebrewSentence` before the user submits their answer.

#### Scenario: Hebrew sentence not visible before submission
- **WHEN** the component renders and the user has not yet submitted
- **THEN** the Hebrew sentence text is not visible on screen

### Requirement: RTL Hebrew transcription input
The component SHALL render a text input with `dir="rtl"` and `lang="he"` for typing the Hebrew transcription.

#### Scenario: Input is RTL Hebrew
- **WHEN** the component renders
- **THEN** a text input is present with `dir="rtl"` and `lang="he"` attributes

### Requirement: Answer scoring — 70% Hebrew token match
The component SHALL score the answer by tokenising both the user input and `exercise.hebrewSentence` (split on whitespace, punctuation stripped), then comparing token sets. The answer is correct if the intersection covers ≥ 70% of the reference tokens.

#### Scenario: Exact Hebrew transcription is correct
- **WHEN** the user types the exact Hebrew sentence
- **THEN** the result is correct

#### Scenario: Answer with ≥ 70% token match is correct
- **WHEN** the user's input matches ≥ 70% of the reference Hebrew tokens
- **THEN** the result is correct

#### Scenario: Answer with < 70% token match is incorrect
- **WHEN** the user's input matches < 70% of the reference Hebrew tokens
- **THEN** the result is incorrect

### Requirement: Inline result feedback and Hebrew sentence revealed
After submission the component SHALL show correct/incorrect feedback and reveal `exercise.hebrewSentence`. The input SHALL be disabled.

#### Scenario: Correct feedback shown and sentence revealed
- **WHEN** the user submits a correct answer
- **THEN** a correct indicator is shown and the Hebrew sentence is revealed

#### Scenario: Incorrect feedback shown and sentence revealed
- **WHEN** the user submits an incorrect answer
- **THEN** an incorrect indicator is shown and the Hebrew sentence is revealed

#### Scenario: Input disabled after submission
- **WHEN** the user has submitted
- **THEN** the text input is disabled

### Requirement: Next button triggers onComplete callback
After submission the component SHALL show a "Next" button. Clicking it SHALL call `onComplete(correct)`.

#### Scenario: Next button calls onComplete
- **WHEN** the user clicks "Next" after submitting
- **THEN** `onComplete` is called with `true` if correct, `false` otherwise
