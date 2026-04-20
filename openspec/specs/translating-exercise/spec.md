## ADDED Requirements

### Requirement: Display English sentence as the prompt
The component SHALL display `exercise.englishSentence` prominently as the translation prompt.

#### Scenario: English prompt is visible
- **WHEN** the component renders
- **THEN** `exercise.englishSentence` is displayed on screen

### Requirement: RTL Hebrew translation input
The component SHALL render a text input with `dir="rtl"` and `lang="he"` for typing the Hebrew translation.

#### Scenario: Input is RTL Hebrew
- **WHEN** the component renders
- **THEN** a text input is present with `dir="rtl"` and `lang="he"` attributes

### Requirement: Speaker button plays audio
The component SHALL render a speaker icon button that plays `exercise.audioUrl` on click. No autoplay on mount.

#### Scenario: Speaker button plays audio on click
- **WHEN** the user clicks the speaker button
- **THEN** audio from `exercise.audioUrl` plays

#### Scenario: No autoplay on mount
- **WHEN** the component first renders
- **THEN** no audio plays automatically

### Requirement: Answer scoring — 70% Hebrew token match
The component SHALL score the answer by tokenising both the user input and `exercise.hebrewSentence` (split on whitespace, punctuation stripped), then comparing token sets. The answer is correct if the intersection covers ≥ 70% of the reference tokens.

#### Scenario: Exact Hebrew translation is correct
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

#### Scenario: Correct feedback with Hebrew revealed
- **WHEN** the user submits a correct answer
- **THEN** a correct indicator is shown and `exercise.hebrewSentence` is revealed

#### Scenario: Incorrect feedback with Hebrew revealed
- **WHEN** the user submits an incorrect answer
- **THEN** an incorrect indicator is shown and `exercise.hebrewSentence` is revealed

#### Scenario: Input disabled after submission
- **WHEN** the user has submitted
- **THEN** the text input is disabled

### Requirement: Next button triggers onComplete callback
After submission the component SHALL show a "Next" button. Clicking it SHALL call `onComplete(correct)`.

#### Scenario: Next button calls onComplete
- **WHEN** the user clicks "Next" after submitting
- **THEN** `onComplete` is called with `true` if correct, `false` otherwise
