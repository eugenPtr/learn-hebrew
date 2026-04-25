## ADDED Requirements

### Requirement: On-screen Hebrew keyboard rendered on non-touch devices
The system SHALL render an on-screen Hebrew keyboard in the flashcard running state when `'ontouchstart' in window` evaluates to `false` at mount time.

#### Scenario: Keyboard shown on desktop
- **WHEN** the flashcard running state mounts on a device without touch support
- **THEN** the Hebrew keyboard is visible below the text input

#### Scenario: Keyboard hidden on touch devices
- **WHEN** the flashcard running state mounts on a device where `'ontouchstart' in window` is true
- **THEN** the Hebrew keyboard is not rendered

### Requirement: Keyboard covers all 27 Hebrew characters
The keyboard SHALL include 22 base Hebrew letters (א–ת) and 5 final forms (ך, ם, ן, ף, ץ), arranged in a 3-row grid.

#### Scenario: All base letters are present
- **WHEN** the keyboard is rendered
- **THEN** buttons for all 22 Hebrew base letters are visible

#### Scenario: All final forms are present
- **WHEN** the keyboard is rendered
- **THEN** buttons for ך, ם, ן, ף, ץ are visible

### Requirement: Keyboard key press inserts character into text input
Clicking a keyboard key SHALL append the corresponding Hebrew character to the current value of the Hebrew text input and keep focus on that input.

#### Scenario: Key appends character
- **WHEN** the text input contains "של" and the user clicks the "ו" key
- **THEN** the text input value becomes "שלו"

### Requirement: Keyboard includes a backspace key
The keyboard SHALL include a backspace button that removes the last character from the text input.

#### Scenario: Backspace removes last character
- **WHEN** the text input contains "של" and the user clicks backspace
- **THEN** the text input value becomes "ש"

#### Scenario: Backspace on empty input does nothing
- **WHEN** the text input is empty and the user clicks backspace
- **THEN** the text input remains empty and no error occurs
