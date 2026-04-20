## 1. Server-Side Data Fetching

- [ ] 1.1 In `app/page.tsx`, convert the component to an `async` server component and import the Supabase server client
- [ ] 1.2 Fetch all lessons with embedded vocabulary items using `select('*, vocabulary_items(*)')` ordered by `created_at` ascending, `id` ascending as tiebreak
- [ ] 1.3 Pass the fetched data as a prop to the `<LessonsDashboard>` client component

## 2. LessonsDashboard Client Component

- [ ] 2.1 Create `components/LessonsDashboard.tsx` as a `'use client'` component that accepts the lessons+vocab data as a prop
- [ ] 2.2 Implement expand/collapse state using `useState<Set<string>>` keyed by lesson ID
- [ ] 2.3 Render the "Add Lesson" button (links to `/lesson/new`) above the cards list
- [ ] 2.4 Render the stacked list of lesson cards with "Lesson N" headers (1-based index)
- [ ] 2.5 Wire card header click to toggle expand/collapse state for that lesson
- [ ] 2.6 In expanded state, render vocabulary rows: Hebrew word (bold, large) and English translation below (small, gray) — no edit/delete controls
- [ ] 2.7 Render empty state message when no lessons exist
- [ ] 2.8 Render the disabled "Generate Practice Session" button at the bottom with `opacity-40 cursor-not-allowed` styling

## 3. Layout & Styling

- [ ] 3.1 Apply `max-w-lg mx-auto p-6` to the page container, matching review page conventions
- [ ] 3.2 Style lesson cards with `rounded-xl border border-gray-200 bg-white` and a clickable header
- [ ] 3.3 Style vocabulary rows to match review page row style: Hebrew in `font-medium text-lg text-gray-700`, English in `text-sm text-gray-500`

## 4. Cleanup

- [ ] 4.1 Remove all default Next.js boilerplate from `app/page.tsx` (Image imports, placeholder links, etc.)
