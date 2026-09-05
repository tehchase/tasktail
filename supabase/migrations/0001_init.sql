-- Phase 2: tasks + user_prefs, locked to the signed-in user via RLS.

create type task_area as enum ('work', 'home');
create type task_status as enum ('todo', 'in_progress', 'done');

create table tasks (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  title        text not null check (length(trim(title)) > 0),
  area         task_area not null,
  project      text,
  plan_date    date,          -- the day you plan to work on it
  due_date     date,          -- when it is actually due
  notes        text,
  priority     smallint check (priority between 1 and 3),
  status       task_status not null default 'todo',
  tags         text[] not null default '{}',
  deleted_at   timestamptz,   -- soft delete; 30-day undo window
  created_at   timestamptz not null default now(),
  completed_at timestamptz,
  updated_at   timestamptz not null default now()
);

-- The default sort (plan_date asc nulls last, priority, created_at) and the
-- "hide deleted" predicate are on every read, so index for them.
create index tasks_user_live_idx
  on tasks (user_id, plan_date nulls last, priority, created_at)
  where deleted_at is null;

create table user_prefs (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  prefs      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- updated_at on every write; completed_at follows status in/out of 'done'.
create or replace function touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function sync_completed_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  if new.status = 'done' and (old.status is distinct from 'done') then
    new.completed_at := now();
  elsif new.status <> 'done' then
    new.completed_at := null;
  end if;
  return new;
end;
$$;

create trigger tasks_set_updated_at
  before insert or update on tasks
  for each row execute function sync_completed_at();

create trigger user_prefs_set_updated_at
  before update on user_prefs
  for each row execute function touch_updated_at();

alter table tasks enable row level security;
alter table user_prefs enable row level security;

create policy tasks_select on tasks for select using (user_id = auth.uid());
create policy tasks_insert on tasks for insert with check (user_id = auth.uid());
create policy tasks_update on tasks for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy tasks_delete on tasks for delete using (user_id = auth.uid());

create policy prefs_select on user_prefs for select using (user_id = auth.uid());
create policy prefs_insert on user_prefs for insert with check (user_id = auth.uid());
create policy prefs_update on user_prefs for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());
