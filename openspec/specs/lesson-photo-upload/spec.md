## Requirements

### Requirement: User can select or capture a photo to start a lesson
The system SHALL provide a `/lesson/new` page with a file input (`accept="image/*"`, `capture="environment"`) that allows the user to select a photo from their gallery or capture one with their camera.

#### Scenario: User selects a photo from gallery
- **WHEN** the user taps the file input and selects an image from their gallery
- **THEN** the image SHALL be processed and submitted automatically without any further user action

#### Scenario: User captures a photo with camera
- **WHEN** the user taps the file input and takes a photo with their camera
- **THEN** the captured image SHALL be processed and submitted automatically

### Requirement: Image is converted to JPEG base64 before submission
The system SHALL convert the selected image to JPEG format via an off-screen canvas before encoding as base64 and POSTing to `/api/extract`. The data URI prefix SHALL be stripped — only the raw base64 string is sent.

#### Scenario: PNG image is selected
- **WHEN** the user selects a PNG image
- **THEN** the image SHALL be converted to JPEG and sent as raw base64 to `/api/extract`

#### Scenario: HEIC image is selected (iOS)
- **WHEN** the user captures a HEIC photo on iOS
- **THEN** the browser SHALL draw it to canvas and export as JPEG before sending

### Requirement: Loading state is shown during extraction
The system SHALL display a loading indicator while the POST to `/api/extract` is in flight, and SHALL disable the file input to prevent duplicate submissions.

#### Scenario: Extraction is in progress
- **WHEN** the image has been submitted and the API call is pending
- **THEN** a loading spinner or skeleton SHALL be visible and the file input SHALL be disabled

### Requirement: Successful extraction navigates to review screen
The system SHALL navigate to `/lesson/review` and pass the extracted items when `/api/extract` returns a successful response.

#### Scenario: Extraction returns items
- **WHEN** `/api/extract` responds with `{ items: [...] }`
- **THEN** the user SHALL be navigated to `/lesson/review` with the extracted items available

#### Scenario: Extraction returns empty items
- **WHEN** `/api/extract` responds with `{ items: [] }`
- **THEN** the user SHALL be shown an error message indicating nothing was found, with a retry option

### Requirement: Extraction failure shows recoverable error
The system SHALL display an error message with a retry option if `/api/extract` returns an error response, without crashing or requiring a page reload.

#### Scenario: API returns an error
- **WHEN** `/api/extract` returns a non-200 response
- **THEN** an error message SHALL be shown and the file input SHALL be re-enabled so the user can try again
