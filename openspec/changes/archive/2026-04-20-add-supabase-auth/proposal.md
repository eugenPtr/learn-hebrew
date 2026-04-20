## Why

The deployed app has no authentication — all API routes are publicly accessible, meaning anyone can trigger OpenAI API calls and consume the owner's credits. Adding Supabase email/password auth gates the entire app behind a login wall with zero per-user complexity.

## What Changes

- Install `@supabase/ssr` package for cookie-based server-side auth
- Update `lib/supabase.ts` to export a server-side client (alongside the existing browser client)
- Add `middleware.ts` at the project root to enforce auth on every request
- Add `/login` page with email/password form
- Add `/auth/callback` route for Supabase SSR code exchange
- Add sign-out button in the app layout

## Capabilities

### New Capabilities

- `user-auth`: Email/password authentication using Supabase SSR — login page, session enforcement via middleware, and sign-out. Single-user; account is created manually in the Supabase dashboard.

### Modified Capabilities

<!-- none — no existing capability requirements are changing -->

## Impact

- **New files**: `middleware.ts`, `app/login/page.tsx`, `app/auth/callback/route.ts`
- **Modified files**: `lib/supabase.ts`, `app/layout.tsx`
- **New dependency**: `@supabase/ssr`
- **All existing routes and pages** become protected by middleware; no individual route changes needed
- **No breaking changes** to existing API contracts — protection is additive
