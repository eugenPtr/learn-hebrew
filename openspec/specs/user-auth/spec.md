### Requirement: Unauthenticated requests are redirected to login
The system SHALL redirect any unauthenticated request to `/login` before serving any page or API route response. The `/login` page and `/auth/callback` route SHALL be exempt from this redirect.

#### Scenario: Unauthenticated visit to home page
- **WHEN** a user with no session visits `/`
- **THEN** the system redirects them to `/login`

#### Scenario: Unauthenticated API call
- **WHEN** an HTTP client with no session cookie calls `/api/extract`
- **THEN** the system redirects to `/login` (middleware intercepts before the handler runs)

#### Scenario: Login page is accessible without auth
- **WHEN** a user with no session visits `/login`
- **THEN** the login page is served without redirect

### Requirement: Owner can log in with email and password
The system SHALL provide a login page at `/login` with an email field, a password field, and a submit button. On successful authentication the user SHALL be redirected to `/`.

#### Scenario: Successful login
- **WHEN** the owner submits valid email and password on `/login`
- **THEN** a Supabase session cookie is set and the user is redirected to `/`

#### Scenario: Invalid credentials
- **WHEN** the owner submits incorrect email or password
- **THEN** an error message is displayed and no redirect occurs

#### Scenario: Already authenticated visit to login page
- **WHEN** a user with a valid session visits `/login`
- **THEN** they are redirected to `/`

### Requirement: Owner can sign out
The system SHALL provide a sign-out control accessible from the main layout. On sign-out the session SHALL be invalidated and the user SHALL be redirected to `/login`.

#### Scenario: Sign-out
- **WHEN** the authenticated owner clicks the sign-out button
- **THEN** the Supabase session is invalidated, cookies are cleared, and the user is redirected to `/login`

### Requirement: Session is verified server-side on every request
The middleware SHALL call `supabase.auth.getUser()` (not `getSession()`) to verify the session on every request, refreshing the session cookie when needed.

#### Scenario: Valid session is refreshed
- **WHEN** a user with a valid but near-expiry session cookie makes a request
- **THEN** middleware refreshes the cookie and the request proceeds normally

#### Scenario: Expired or invalid session
- **WHEN** a user presents an expired or tampered session cookie
- **THEN** middleware redirects to `/login`
