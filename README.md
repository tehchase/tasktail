# tasktail

Personal task manager. Replaces the work + home tabs of a Google Sheet.
See [SPEC.md](SPEC.md) for the data model, behavior, and build phases.

Live: https://tehchase.github.io/tasktail/

## Local development

```sh
npm install
cp .env.example .env.local   # then fill in the two values
npm run dev                  # http://localhost:5173/tasktail/
```

`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` come from the Supabase dashboard
under **Project Settings → API**. The anon key is public by design; RLS is the
security boundary. The `service_role` key must never land in this repo.

## Deploy

Pushing to `main` runs `.github/workflows/deploy.yml`, which builds with the repo
**variables** `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` and publishes `dist`
to GitHub Pages.
