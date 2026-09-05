// Mirrors supabase/migrations/0001_init.sql. Keep the two in sync by hand.

export type TaskArea = 'work' | 'home'
export type TaskStatus = 'todo' | 'in_progress' | 'done'

export type Task = {
  id: string
  user_id: string
  title: string
  area: TaskArea
  project: string | null
  plan_date: string | null // date, 'YYYY-MM-DD'
  due_date: string | null
  notes: string | null
  priority: number | null // 1 = high .. 3
  status: TaskStatus
  tags: string[]
  deleted_at: string | null
  created_at: string
  completed_at: string | null
  updated_at: string
}

/** What the Add/Edit modal produces. The DB fills the rest. */
export type TaskDraft = {
  title: string
  area: TaskArea
  project: string | null
  plan_date: string | null
  due_date: string | null
  notes: string | null
  priority: number | null
  status: TaskStatus
  tags: string[]
}

export const AREAS: TaskArea[] = ['work', 'home']
export const STATUSES: TaskStatus[] = ['todo', 'in_progress', 'done']

export function emptyDraft(area: TaskArea = 'work'): TaskDraft {
  return {
    title: '',
    area,
    project: null,
    plan_date: null,
    due_date: null,
    notes: null,
    priority: null,
    status: 'todo',
    tags: [],
  }
}
