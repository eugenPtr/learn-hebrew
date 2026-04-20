## 1. Dependencies

- [x] 1.1 Install `@supabase/ssr` with `pnpm add @supabase/ssr --save`

## 2. Supabase Client Setup

- [x] 2.1 Update `lib/supabase.ts` to export `createServerClient` helper (uses `@supabase/ssr` with cookie adapter for Server Components / Route Handlers)
- [x] 2.2 Export a `createBrowserClient` helper from `lib/supabase.ts` (uses `@supabase/ssr` `createBrowserClient` for Client Components)
- [x] 2.3 Keep or adapt the existing `supabase` singleton export so DB queries in Server Components still work

## 3. Middleware

- [x] 3.1 Create `middleware.ts` at project root using `@supabase/ssr` `createServerClient` with request/response cookie adapter
- [x] 3.2 Call `supabase.auth.getUser()` in middleware and redirect unauthenticated requests to `/login`
- [x] 3.3 Exempt `/login` and `/auth/callback` paths from the auth redirect
- [x] 3.4 Add `export const config` matcher to exclude `_next/static`, `_next/image`, and `favicon.ico`

## 4. Auth Callback Route

- [x] 4.1 Create `app/auth/callback/route.ts` — read `code` query param, call `supabase.auth.exchangeCodeForSession(code)`, redirect to `/`

## 5. Login Page

- [x] 5.1 Create `app/login/page.tsx` as a Client Component with email and password inputs and a submit button
- [x] 5.2 On submit, call `supabase.auth.signInWithPassword({ email, password })` using the browser client
- [x] 5.3 On success, redirect to `/` using `router.push('/')`
- [x] 5.4 On error, display an inline error message below the form

## 6. Sign-Out

- [x] 6.1 Add a sign-out button to `app/layout.tsx` (Client Component island or a Server Action)
- [x] 6.2 On click, call `supabase.auth.signOut()` and redirect to `/login`

## 7. Verification

- [x] 7.1 Confirm unauthenticated visit to `/` redirects to `/login`
- [x] 7.2 Confirm login with valid credentials redirects to `/` and sets session cookie
- [x] 7.3 Confirm invalid credentials shows error message without redirect
- [x] 7.4 Confirm sign-out clears session and redirects to `/login`
- [x] 7.5 Confirm direct `curl` to `/api/extract` without cookie is redirected
