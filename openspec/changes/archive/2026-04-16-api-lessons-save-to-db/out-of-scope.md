# Out-of-Scope Notes

## Service role client not configured

The spec states "Use the Supabase service role client for server-side inserts." However, `SUPABASE_SERVICE_ROLE_KEY` is not present in `.env.local`, and no service-role client setup exists in the project. The existing anon-key client (`lib/supabase.ts`) is used by the health route to read/write `vocabulary_items` without error, indicating RLS is not enforced on these tables.

Implementation uses the existing `supabase` (anon key) client. To switch to the service role client:
1. Add `SUPABASE_SERVICE_ROLE_KEY=<key>` to `.env.local`
2. Create a `lib/supabaseAdmin.ts` that calls `createClient(url, serviceRoleKey, { auth: { persistSession: false } })`
3. Import that client in `app/api/lessons/route.ts` instead of `@/lib/supabase`

This is infrastructure configuration work, not an API route concern, and is deferred to a future task.
