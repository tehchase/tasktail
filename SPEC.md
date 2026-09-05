# tasktail — Spec & Project Plan v1.2

*Replaces the "work" + "home" tabs of the Google Sheet. Built for Claude Code. Dark mode only. Ship fast, polish later.*

**v1.2 change:** hosting moved from Vercel to **GitHub Pages** — only `github.io` and `supabase.co` are permitted at runtime.

**v1.1 changes:** dropped `flex`; `workday` → `plan_date` (a real date: the day you'll work on it, distinct from due date); added soft-delete + undo, `tags`, quick capture via iOS Shortcut; dropped manual `sort_order` in favor of a fixed default sort.

---

## 1. Goal

One task list that works on every device — laptop, home Mac, iPhone and iPad — with the same data everywhere. Same columns as the work tab (minus flex), plus a few things the sheet couldn't do: hide/reorder columns, add via modal, filter Work vs Home, mark done, sort, search.

Non-goals for v1: multiple users, sharing, recurring tasks, drag-and-drop, calendar views, notifications. (v1.3 ideas can come later.)

## 2. Medium & stack (decided)

This is a standalone web app.

| Layer | Choice | Why |
|---|---|---|
| Frontend | Vite + React + TypeScript + Tailwind | Fast, familiar, Claude Code handles it well |
| Table | TanStack Table v8 (headless) | Column visibility, ordering and sorting are built in |
| Data + auth | Supabase (Postgres + Auth, magic link) | Free tier, row-level security, realtime if wanted later |
| Hosting | GitHub Pages, deployed by a GitHub Actions workflow on push to `main` | Free, static, and on the runtime allow-list. URL: `https://<user>.github.io/tasktail/` |
| Mobile | PWA (manifest + icon) | "Add to Home Screen" on iPhone/iPad, feels like an app |

Caveats to know going in:
- Supabase free projects pause after ~7 days with no activity. Daily use avoids it; if it pauses, it's one click to resume.
- Only `github.io` + `supabase.co` may be contacted at runtime. Don't add any third-party service without verifying it works on every device you use first.
- GitHub Pages is static, so: Vite `base: '/tasktail/'`, a hash router (`/#/archive`) so deep links and refreshes don't 404, and the Supabase anon key ships in the bundle (that's by design — RLS is the security boundary).
- The repo can stay public or private; Pages works on private repos with a free account only if the repo is public, so plan on a public repo with no secrets in it (anon key is fine; service key never).
- Single user. Every table is locked to `auth.uid()` via RLS, so the public URL is safe.

## 3. Data model

### `tasks`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, pk | default `gen_random_uuid()` |
| `user_id` | uuid | `auth.uid()`, RLS-enforced |
| `title` | text, required | the sheet's "task" |
| `area` | enum `work` \| `home` | drives the Work/Home filter |
| `project` | text, nullable | free text with autocomplete from existing values |
| `plan_date` | date, nullable | **the day you plan to work on it** (the sheet's "workday"). Null = unscheduled / reprioritize. UI shows Today / Tomorrow / Thu / Next week |
| `due_date` | date, nullable | when it's actually due (often empty) |
| `notes` | text, nullable | |
| `priority` | smallint 1–3, nullable | 1 = high. The home tab's "P" |
| `status` | enum `todo` \| `in_progress` \| `done` | default `todo` |
| `tags` | text[] | default `{}`; cross-cutting labels (waiting, meeting-prep, errand). Chip input with autocomplete |
| `deleted_at` | timestamptz, nullable | soft delete; rows with a value are hidden everywhere except a 30-day undo window |
| `created_at` | timestamptz | default `now()` |
| `completed_at` | timestamptz, nullable | set when status → done, cleared if reopened |
| `updated_at` | timestamptz | trigger |

### `user_prefs`

One row per user, `prefs jsonb`. Holds column visibility + order, default area filter, sort. Stored server-side so the layout follows you across devices; mirrored in localStorage for instant first paint.

```json
{
  "columns": ["status", "title", "priority", "project", "plan_date", "due_date", "tags", "notes"],
  "hidden": ["due_date"],
  "areaFilter": "work",
  "sort": null,
  "showDone": false
}
```

### RLS
`tasks` and `user_prefs`: select/insert/update/delete only where `user_id = auth.uid()`.

## 4. Screens & behavior

### 4.1 Sign-in
Email field → Supabase magic link → session persisted per device. Only screen an unauthenticated visitor sees.

### 4.2 Main list (the one screen)

Top bar: app name · Area segmented control (**All / Work / Home**) · search box · **Columns** button · **+ Add** button · avatar/sign-out.

Table (desktop ≥ 768px):
- Columns = everything in `tasks` except ids/timestamps, in the user's chosen order, hidden ones omitted.
- Click a header to sort (asc → desc → off). Default (sort = null): `plan_date` asc with nulls last, then `priority`, then `created_at`. In the **All** view, group by area with a divider before applying that sort. No manual drag ordering in v1.
- Inline edit: click a cell → editor for that type (text, date picker, select, combobox). Enter/blur saves, Esc cancels. Optimistic update, toast on failure.
- Status cell is a checkbox-style toggle (todo ⇄ done; in_progress via the select in edit mode or the modal).
- Done rows hide by default (**Show done** toggle in the toolbar).
- Row hover: ⋯ menu → Edit (opens modal), Duplicate, Delete. Delete is soft (`deleted_at`) with a 5-second **Undo** toast; no confirm dialog.
- Toolbar button **Roll forward**: sets `plan_date = today` on every open task whose plan_date is in the past. One click, undoable.

Card list (mobile < 768px):
- Same data, one card per task: title, then project · plan date · due · priority as small chips. Tap card → edit modal. Swipe or checkbox to mark done. Area control and search stay at top; Columns button hidden (layout is fixed on mobile).

### 4.3 Add / Edit modal
Fields in this order: Title (autofocus) · Area (defaults to current filter; if filter is All, defaults to last used) · Project (combobox) · Plan date (date picker with Today / Tomorrow / Next Mon / Unscheduled shortcuts) · Due date · Priority · Status · Tags (chip input) · Notes (textarea).
Keyboard: `n` opens Add from anywhere; `⌘/Ctrl+Enter` saves; Esc closes. "Save & add another" secondary button.

### 4.4 Columns popover
Checklist of all columns with ▲▼ buttons (or drag handle) to reorder. Changes apply live and save to `user_prefs` (debounced). "Reset to default".

### 4.5 Archive
Route `/archive`: done tasks, newest `completed_at` first, same Area filter and search. Row action: Reopen, Delete. A **Recently deleted** section at the bottom (last 30 days) with Restore. Nothing fancy.

### 4.6 Empty / loading / error
Skeleton rows on load; friendly empty state per filter ("Nothing for Home. Nice."); toast + retry on network errors. Offline: reads from cache are fine to skip in v1 — just show a "you're offline" banner.

### 4.7 Quick capture (iOS Shortcut)
A Supabase Edge Function `POST /capture` that accepts `{ title, area? }` with a per-user secret token in the header and inserts a `todo` task (area defaults to `home`, no plan date). An iOS Shortcut ("Add to tasktail") prompts for text and posts it, so you can add from the lock screen, Siri, or the share sheet. Token lives in the Shortcut only; rotate it from a tiny settings page.

## 5. Visual
Dark only. Neutral zinc background, one accent color (pick at build: teal or amber), Work/Home as subtle colored chips. Dense but readable rows (~40px). Inter or system font. No light mode toggle.

## 6. Import of existing sheet tasks
One-time script `scripts/import.ts` reading `data/seed.csv` (title, area, project, plan_date, due_date, notes, priority) and inserting via the Supabase service key from a local `.env` (never committed). The CSV is prepared from the sheet: 36 work rows → `area=work`, with the sheet's day words mapped to the next matching calendar date ("friday" → next Friday, "next week" → next Monday, "reprioritize" → null); home tab dated rows → `area=home` the same way. The habits / things-to-do / house lists are **not** imported by default — they aren't really tasks and would clutter Home. Flip `IMPORT_LISTS=true` to bring them in as `project` = Habits / Fun / House, unscheduled. Delete the script's service key after running.

## 7. Repo layout

```
tasktail/
  src/
    lib/supabase.ts        client + typed helpers
    lib/prefs.ts           load/save user_prefs (+ localStorage mirror)
    hooks/useTasks.ts      CRUD, optimistic updates
    components/
      TaskTable.tsx        TanStack table, inline editing
      TaskCards.tsx        mobile list
      TaskModal.tsx
      ColumnsPopover.tsx
      Toolbar.tsx
    pages/ SignIn, List, Archive, Settings (capture token)
  supabase/migrations/0001_init.sql   tables, enums, RLS, updated_at trigger
  supabase/functions/capture/         quick-capture edge function
  scripts/import.ts
  data/seed.csv
  public/manifest.webmanifest, icons
  SPEC.md                (this file)
```

## 8. Build plan — phases with go/no-go checkpoints

Each phase ends with something you can open in a browser. Don't start the next phase until the checkpoint passes.

**Phase 0 — Accounts (you, ~30 min, no code)**
Create GitHub and Supabase (sign in with GitHub). In Supabase: new project, note the URL + anon key, enable Email auth with magic links, add `https://<user>.github.io/tasktail/` and `http://localhost:5173` to redirect URLs. No Vercel account.
✅ Checkpoint: two dashboards open.

**Phase 1 — Skeleton + sign-in + deploy (Claude Code, ~1 session)**
Scaffold Vite/React/TS/Tailwind (`base: '/tasktail/'`, hash router), add Supabase client, magic-link sign-in page, protected empty list page, GitHub Actions workflow that builds and publishes to Pages, Supabase URL + anon key as repo variables.
✅ Checkpoint: sign in on the Mac, on the iPhone, **and on every other device you use**. The magic link must land on the `github.io` URL, not localhost.

**Phase 2 — Tasks CRUD + table + modal**
Migration `0001_init.sql`, `useTasks`, TanStack table with all columns, Add/Edit modal, mark done, soft delete + undo toast, default sort, Roll forward.
✅ Checkpoint: add a task on the phone, see it on the Mac.

**Phase 3 — Sheet parity + better**
Area filter, search, header sort, inline editing, Columns popover with prefs synced via `user_prefs`.
✅ Checkpoint: hide two columns on the Mac, reorder them, open the phone — layout matches.

**Phase 4 — Archive, mobile cards, PWA, quick capture**
`/archive` route (with Recently deleted), card layout under 768px, manifest + icons, "Add to Home Screen" tested on iPhone and iPad, `capture` edge function + iOS Shortcut.
✅ Checkpoint: app icon on the phone home screen, opens full-screen; "Hey Siri, add to tasktail" creates a task.

**Phase 5 — Import**
Prepare `seed.csv`, run the import, spot-check ~10 tasks against the sheet, retire the sheet (keep it read-only for a week).
✅ Checkpoint: you stop opening the Google Sheet.

**Phase 6 — Polish (only what bugs you)**
Keyboard shortcuts, "Save & add another", empty states, duplicate task, project/tag autocomplete tuning.

## 9. Open questions (answer whenever)
1. Accent color: teal or amber?
2. Import the habits / things-to-do / house lists, or leave them in the sheet? (Spec default: leave them.)
3. Group the **All** view by area with a divider, or just interleave sorted by plan date? (Spec default: group.)

## 10. Later (not v1)
Recurring tasks · drag-and-drop manual ordering · weekly / 3-day view · realtime sync between open tabs · offline mode · subtasks · the habit tracker tab from the sheet · edit history.
