## ADDED Requirements

### Requirement: End practice button is always visible during active practice phases
Both the flashcard practice page and the sentence practice page SHALL display an "End practice" button during all active phases (running, revealed, and feedback). The button SHALL be fixed at the top of the viewport so it remains accessible regardless of scroll position or on-screen keyboard state.

#### Scenario: Button visible during flashcard running phase
- **WHEN** the flashcard practice is in the `running` or `revealed` state
- **THEN** the "End practice" button is visible and tappable

#### Scenario: Button visible during sentence running phase
- **WHEN** the sentence practice is in the `running`, `revealed`, or `feedback` state
- **THEN** the "End practice" button is visible and tappable

#### Scenario: Button is NOT shown in picking or summary states
- **WHEN** the practice is in the `picking`, `loading`, or `summary` state
- **THEN** the "End practice" button is NOT shown

### Requirement: End practice routes to home
Tapping "End practice" SHALL navigate the user to `/` immediately without a confirmation dialog. Any in-progress session results are discarded; no results are submitted to the API.

#### Scenario: User taps End practice during flashcard session
- **WHEN** the user taps "End practice" during an active flashcard session
- **THEN** the user is navigated to `/` and no results are posted to `/api/flashcard`

#### Scenario: User taps End practice during sentence session
- **WHEN** the user taps "End practice" during an active sentence session
- **THEN** the user is navigated to `/` and no rating or submission occurs for the current sentence
