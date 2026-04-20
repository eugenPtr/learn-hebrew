## Why

The app currently shows the default Next.js placeholder page, giving users no entry point into their lesson content. A lessons dashboard replaces it with a real home page that surfaces all lessons and vocabulary at a glance.

## What Changes

- Replace `app/page.tsx` (or equivalent home route) with a server-side lessons dashboard
- Fetch all lessons and their vocabulary items in a single joined Supabase query, ordered by `created_at` ascending
- Render expandable lesson cards (one per lesson) that toggle to show vocabulary rows
- Add an "Add Lesson" button linking to `/lesson/new`
- Add a disabled "Generate Practice Session" button (coming soon placeholder)
- Show a friendly empty state when no lessons exist

## Capabilities

### New Capabilities
- `home-dashboard`: Lessons dashboard page — server-side data fetch, expandable lesson cards, Add Lesson navigation, and disabled Generate Practice Session button

### Modified Capabilities
<!-- No existing spec-level requirements are changing -->

## Impact

- `app/page.tsx` — replaced entirely
- Supabase query touches `lessons` and `vocabulary_items` tables (read-only)
- No new dependencies; reuses existing Tailwind conventions and Supabase client patterns from the review page
