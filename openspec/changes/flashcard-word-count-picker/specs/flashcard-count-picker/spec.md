## ADDED Requirements

### Requirement: Count-picking screen appears after lesson selection
After the user selects a lesson, the system SHALL display a count-picking screen showing the lesson name, the lesson's total word count, and four count options: 10, 20, 30, and All(N) where N is the lesson word count. A back arrow SHALL be present to return to the lesson list.

#### Scenario: Count screen shows lesson context
- **WHEN** the user taps a lesson on the lesson-picking screen
- **THEN** the count-picking screen is shown with the selected lesson's name and total word count displayed as a subtitle

#### Scenario: Back arrow returns to lesson list
- **WHEN** the user taps the back arrow on the count-picking screen
- **THEN** the page returns to the lesson-picking screen without refetching lessons

### Requirement: Count options are disabled when they exceed lesson word count
The system SHALL render all four count buttons (10, 20, 30, All(N)). Any fixed count option (10 / 20 / 30) whose value exceeds the lesson's word count SHALL be rendered in a disabled state and be non-interactive. The "All(N)" button SHALL always be enabled.

#### Scenario: All options enabled for a large lesson
- **WHEN** the selected lesson has 30 or more words
- **THEN** all four buttons (10, 20, 30, All(N)) are enabled and tappable

#### Scenario: Options exceeding word count are disabled
- **WHEN** the selected lesson has 14 words
- **THEN** the 20 and 30 buttons are disabled, and the 10 and "All (14)" buttons are enabled

#### Scenario: Only All(N) enabled for very small lessons
- **WHEN** the selected lesson has 7 words
- **THEN** the 10, 20, and 30 buttons are all disabled, and "All (7)" is enabled

#### Scenario: All(N) label shows lesson word count
- **WHEN** the selected lesson has N words
- **THEN** the button is labelled "All (N)" (e.g. "All (14)")

### Requirement: Selecting a count starts the session
Tapping an enabled count option SHALL fetch `GET /api/flashcard?lessonId=<id>&count=<count>` and transition to the session's loading state. For the "All(N)" option, `count` equals the lesson's word count.

#### Scenario: User taps a fixed count
- **WHEN** the user taps "10" on the count-picking screen
- **THEN** the page fetches `GET /api/flashcard?lessonId=<id>&count=10` and transitions to loading

#### Scenario: User taps All(N)
- **WHEN** the user taps "All (N)" on the count-picking screen
- **THEN** the page fetches `GET /api/flashcard?lessonId=<id>&count=N` where N is the lesson's word count
