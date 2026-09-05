# tasktail — instructions for Claude Code

Personal task manager for one user (Chase). Replaces a Google Sheet. Read `SPEC.md` before doing anything; it is the source of truth for data model, behavior, and phases.

## How we work
- **One phase per session.** SPEC.md §8 lists phases with checkpoints. Build only the current phase, then stop and tell me how to verify the checkpoint. Do not start the next phase until I say go.
- Ship fast, polish later. Prefer the simplest thing that works. No abstractions for hypothetical future needs.
- Before any structural decision not covered by SPEC.md, ask one short question rather than guessing.
- Keep a `CHANGELOG.md` with one line per phase completed.

## Stack (fixed — don't swap libraries)
- Vite + React 18 + TypeScript + Tailwind
- `@tanstack/react-table` v8 for the table
- `@supabase/supabase-js` v2, **PKCE auth flow** (default) so magic links use `?code=` and don't fight the hash router
- `react-router-dom` with **`HashRouter`** (GitHub Pages is static)
- Vite `base: '/tasktail/'`
- Dark mode only; Tailwind `zinc` palette, one accent color

## Hosting
- GitHub Pages via `.github/workflows/deploy.yml` on push to `main` (actions/upload-pages-artifact + actions/deploy-pages)
- Supabase URL and anon key come from GitHub Actions **variables** `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, exposed to the build as env vars. Locally they live in `.env.local` (gitignored).
- The anon key is public by design; RLS is the security boundary. The `service_role` key must never appear in the repo, the workflow, or the built bundle.

## Runtime network constraints
- The app may only contact `github.io` and `supabase.co` at runtime. Do not add CDNs, fonts, analytics, or any other third-party request. Bundle everything.

## Conventions
- Small commits with plain-English messages.
- `npm run build` must pass before every commit.
- Types for DB rows live in `src/lib/types.ts` and mirror `supabase/migrations/*.sql`.
