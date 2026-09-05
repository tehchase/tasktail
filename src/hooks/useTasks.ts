import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Task, TaskDraft } from '../lib/types'
import { today } from '../lib/dates'

/**
 * Default sort (SPEC 4.2): plan_date asc nulls last, then priority, then
 * created_at. Applied client-side too so optimistic edits re-sort the same way
 * the server would.
 */
function compareTasks(a: Task, b: Task): number {
  if (a.plan_date !== b.plan_date) {
    if (a.plan_date === null) return 1
    if (b.plan_date === null) return -1
    return a.plan_date < b.plan_date ? -1 : 1
  }
  if (a.priority !== b.priority) {
    if (a.priority === null) return 1
    if (b.priority === null) return -1
    return a.priority - b.priority
  }
  return a.created_at < b.created_at ? -1 : 1
}

export function useTasks(userId: string) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .is('deleted_at', null)
    if (error) setError(error.message)
    else setTasks((data as Task[]).sort(compareTasks))
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const add = useCallback(
    async (draft: TaskDraft) => {
      const { data, error } = await supabase
        .from('tasks')
        .insert({ ...draft, user_id: userId })
        .select()
        .single()
      if (error) {
        setError(error.message)
        return null
      }
      setTasks((prev) => [...prev, data as Task].sort(compareTasks))
      return data as Task
    },
    [userId],
  )

  /** Optimistic: apply locally, roll back and surface the error if it fails. */
  const update = useCallback(async (id: string, patch: Partial<Task>) => {
    let rollback: Task[] = []
    setTasks((prev) => {
      rollback = prev
      return prev
        .map((t) => (t.id === id ? { ...t, ...patch } : t))
        .sort(compareTasks)
    })
    const { data, error } = await supabase
      .from('tasks')
      .update(patch)
      .eq('id', id)
      .select()
      .single()
    if (error) {
      setTasks(rollback)
      setError(error.message)
      return
    }
    // Take the server row back so trigger-managed fields stay truthful.
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? (data as Task) : t)).sort(compareTasks),
    )
  }, [])

  const toggleDone = useCallback(
    (task: Task) => update(task.id, { status: task.status === 'done' ? 'todo' : 'done' }),
    [update],
  )

  /** Soft delete. Row leaves the list immediately; restore() is the undo. */
  const softDelete = useCallback(async (id: string) => {
    let removed: Task | undefined
    setTasks((prev) => {
      removed = prev.find((t) => t.id === id)
      return prev.filter((t) => t.id !== id)
    })
    const { error } = await supabase
      .from('tasks')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
    if (error) {
      if (removed) setTasks((prev) => [...prev, removed!].sort(compareTasks))
      setError(error.message)
    }
  }, [])

  const restore = useCallback(async (id: string) => {
    const { data, error } = await supabase
      .from('tasks')
      .update({ deleted_at: null })
      .eq('id', id)
      .select()
      .single()
    if (error) setError(error.message)
    else setTasks((prev) => [...prev, data as Task].sort(compareTasks))
  }, [])

  /** Every open task whose plan_date is in the past moves to today. Undoable. */
  const rollForward = useCallback(async () => {
    const t = today()
    const stale = tasks.filter(
      (x) => x.status !== 'done' && x.plan_date !== null && x.plan_date < t,
    )
    if (stale.length === 0) return []
    const before = stale.map((x) => ({ id: x.id, plan_date: x.plan_date }))
    setTasks((prev) =>
      prev
        .map((x) => (stale.some((s) => s.id === x.id) ? { ...x, plan_date: t } : x))
        .sort(compareTasks),
    )
    const { error } = await supabase
      .from('tasks')
      .update({ plan_date: t })
      .in('id', stale.map((x) => x.id))
    if (error) {
      setError(error.message)
      void load()
      return []
    }
    return before
  }, [tasks, load])

  /** Restore the plan_dates captured by rollForward(). */
  const undoRollForward = useCallback(
    async (before: { id: string; plan_date: string | null }[]) => {
      for (const row of before) {
        await supabase.from('tasks').update({ plan_date: row.plan_date }).eq('id', row.id)
      }
      void load()
    },
    [load],
  )

  const projects = useMemo(
    () =>
      Array.from(new Set(tasks.map((t) => t.project).filter((p): p is string => !!p))).sort(),
    [tasks],
  )

  const allTags = useMemo(
    () => Array.from(new Set(tasks.flatMap((t) => t.tags))).sort(),
    [tasks],
  )

  return {
    tasks,
    loading,
    error,
    clearError: () => setError(null),
    add,
    update,
    toggleDone,
    softDelete,
    restore,
    rollForward,
    undoRollForward,
    projects,
    allTags,
    reload: load,
  }
}
