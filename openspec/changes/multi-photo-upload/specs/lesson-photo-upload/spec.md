## MODIFIED Requirements

### Requirement: User can select or capture one or more photos to start a lesson
The system SHALL provide a `/lesson/new` page with a file input (`accept="image/*"`, `multiple`) that allows the user to select one or more photos from their gallery or capture one with their camera. The `capture` attribute SHALL NOT be set, so the OS presents both camera and gallery options on mobile.

#### Scenario: User selects a single photo from gallery
- **WHEN** the user taps the file input and selects one image from their gallery
- **THEN** the image SHALL be processed and the extracted items navigated to the review screen

#### Scenario: User selects multiple photos from gallery
- **WHEN** the user taps the file input and selects multiple images from their gallery
- **THEN** all images SHALL be processed sequentially and the merged extracted items navigated to the review screen

#### Scenario: User captures a photo with camera
- **WHEN** the user taps the file input and takes a photo with their camera
- **THEN** the captured image SHALL be processed and the extracted items navigated to the review screen

#### Scenario: Gallery option is available on mobile
- **WHEN** the user taps the file input on a mobile device
- **THEN** the OS SHALL present an option to choose from the gallery (not only the camera)

## MODIFIED Requirements

### Requirement: Loading state is shown during multi-photo extraction
The system SHALL display a loading indicator while photos are being processed. When multiple photos are selected, the indicator SHALL show the current photo index and total count (e.g. "Processing photo 2 of 3…").

#### Scenario: Single photo extraction is in progress
- **WHEN** one image has been submitted and the API call is pending
- **THEN** a loading spinner SHALL be visible and the file input SHALL be disabled

#### Scenario: Multi-photo extraction is in progress
- **WHEN** multiple images are being processed sequentially
- **THEN** the loading state SHALL read "Processing photo N of M…" updating as each photo completes

## MODIFIED Requirements

### Requirement: Successful extraction navigates to review screen with merged items
The system SHALL merge all vocabulary items extracted from all selected photos into a single flat list and navigate to `/lesson/review`. The merged list SHALL be written to `sessionStorage.extractedItems`.

#### Scenario: All photos extract items successfully
- **WHEN** all selected photos return items from `/api/extract`
- **THEN** the user SHALL be navigated to `/lesson/review` with all items merged into one list

#### Scenario: Some photos return empty results
- **WHEN** one or more photos return `{ items: [] }` but at least one returns items
- **THEN** the user SHALL be navigated to `/lesson/review` with the non-empty results merged, and a warning SHALL be shown indicating how many photos were skipped

#### Scenario: All photos return empty results
- **WHEN** all selected photos return `{ items: [] }`
- **THEN** the user SHALL be shown the existing "nothing found" error state with a retry option

## ADDED Requirements

### Requirement: Partial extraction failure is surfaced non-blocking
If one or more photos fail to extract (API error or conversion error), the system SHALL continue processing remaining photos. After all photos complete, if at least one photo succeeded, the user SHALL be navigated to the review screen with a non-blocking warning showing how many photos failed.

#### Scenario: One photo fails, others succeed
- **WHEN** one photo returns an error from `/api/extract` and others succeed
- **THEN** the user SHALL reach the review screen with the successful results and a warning: "1 of N photos could not be processed"

#### Scenario: All photos fail
- **WHEN** all photos return errors from `/api/extract`
- **THEN** the existing error state SHALL be shown with a retry option
