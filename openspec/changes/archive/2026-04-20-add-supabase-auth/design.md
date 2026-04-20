## Context

The app uses Supabase for its database (anon key, Row Level Security not yet configured) and OpenAI for several expensive API routes. There is no auth layer — any HTTP client can hit `/api/extract`, `/api/session`, `/api/tts`, and `/api/lessons` directly.

This is a single-owner personal app; no multi-user registration is needed. The owner creates one account manually in the Supabase dashboard and logs in via an email/password form.

## Goals / Non-Goals

**Goals:**
- Gate every page and API route behind a Supabase session
- Minimal login UX: email + password form, redirect on success
- Sign-out accessible from the main layout
- Zero changes to existing API route logic

**Non-Goals:**
- Multi-user support or registration flow
- OAuth / social login
- Role-based access control
- Row Level Security changes (separate concern)

## Decisions

### Use `@supabase/ssr` instead of `@supabase/auth-helpers-nextjs`

`@supabase/auth-helpers-nextjs` is deprecated. `@supabase/ssr` is the current official package for cookie-based Supabase auth in Next.js App Router. It provides `createServerClient` (for Server Components, Route Handlers, middleware) and `createBrowserClient` (for Client Components).

### Single middleware file for all protection

Next.js `middleware.ts` runs before every matched request, making it the correct place to enforce auth. A single session check here covers all routes without touching individual files. The matcher will exclude static assets and Next.js internals.

### Session refresh in middleware

`@supabase/ssr` requires middleware to call `supabase.auth.getUser()` (not `getSession()`) and refresh the session cookie on each request. `getSession()` reads from the cookie without server verification — `getUser()` verifies against Supabase Auth server, preventing spoofed cookies.

### No email confirmation for the single owner account

The owner's account is created via the Supabase dashboard with email confirmation disabled (or pre-confirmed). The login form calls `signInWithPassword` directly — no magic links or OTP.

### Auth callback route for PKCE flow

Even with password auth, Supabase SSR uses a PKCE code exchange. The `/auth/callback` route handles the `code` query param returned after sign-in and exchanges it for a session cookie.

## Risks / Trade-offs

- **Cookie size**: Supabase session cookies are large (~2KB). Not a concern for this app's traffic.
- **Middleware latency**: Every request hits Supabase Auth to verify the session. Adds ~50–100ms cold; subsequent requests use the refreshed cookie. Acceptable for a personal app.
- **Account lockout**: If the Supabase project is paused (free tier auto-pause), login will fail. → Mitigation: keep the project active or upgrade.

## Migration Plan

1. Deploy with auth enabled — first visit redirects to `/login`
2. Owner logs in with the pre-created Supabase account
3. No data migration needed; existing DB data is unaffected
4. Rollback: remove `middleware.ts` and revert `lib/supabase.ts`
