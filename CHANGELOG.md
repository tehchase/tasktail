# Changelog

## Phase 1 — Skeleton, sign-in, deploy
Vite + React 18 + TypeScript + Tailwind scaffold with `base: '/tasktail/'` and a
hash router. Supabase client on the PKCE flow, magic-link sign-in page, protected
empty list page, PWA manifest and icons, and a GitHub Actions workflow that builds
and publishes to GitHub Pages on push to `main`.

## Phase 2 — Tasks CRUD, table, modal
`0001_init.sql` (tasks + user_prefs, enums, RLS, updated_at / completed_at
triggers), `useTasks` with optimistic updates, TanStack table with all columns
grouped by area, Add/Edit modal with plan-date shortcuts and tag chips, mark
done, soft delete with a 5-second undo toast, the default sort, and Roll forward
with undo.

## Phase 3 — Sheet parity + better
Work/Home/All filter, search across title, project, notes and tags, click-to-sort
headers (asc → desc → off, empties always last), inline cell editing, and a
Columns popover for hiding and reordering. Layout, filter, sort and show-done
live in `user_prefs` so they follow you between devices, mirrored to
localStorage for instant first paint.
