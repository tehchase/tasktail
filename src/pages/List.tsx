import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { useTasks } from '../hooks/useTasks'
import { useToasts } from '../hooks/useToasts'
import { usePrefs } from '../hooks/usePrefs'
import { Toasts } from '../components/Toasts'
import { Toolbar } from '../components/Toolbar'
import { TaskTable } from '../components/TaskTable'
import { TaskModal } from '../components/TaskModal'
import type { Task, TaskDraft } from '../lib/types'
import type { SortState } from '../lib/prefs'
import { today } from '../lib/dates'

export function List({ session }: { session: Session }) {
  const t = useTasks(session.user.id)
  const { prefs, update, reset } = usePrefs(session.user.id)
  const { toasts, push, dismiss } = useToasts()
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Task | null>(null)

  useEffect(() => {
    if (!t.error) return
    push(t.error, { tone: 'error' })
    t.clearError()
  }, [t.error, push, t])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null
      const typing =
        el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT')
      if (e.key === 'n' && !typing && !modalOpen && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        setEditing(null)
        setModalOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [modalOpen])

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    let rows = t.tasks
    if (!prefs.showDone) rows = rows.filter((x) => x.status !== 'done')
    if (prefs.areaFilter !== 'all') rows = rows.filter((x) => x.area === prefs.areaFilter)
    if (q) {
      rows = rows.filter((x) =>
        [x.title, x.project ?? '', x.notes ?? '', x.tags.join(' ')]
          .join(' ')
          .toLowerCase()
          .includes(q),
      )
    }

    // TanStack sorts when a column sort is active. With none, useTasks already
    // holds the default order — just group Work above Home in the All view.
    if (prefs.sort === null && prefs.areaFilter === 'all') {
      return [...rows].sort((a, b) => (a.area === b.area ? 0 : a.area === 'work' ? -1 : 1))
    }
    return rows
  }, [t.tasks, prefs.showDone, prefs.areaFilter, prefs.sort, search])

  const staleCount = useMemo(() => {
    const d = today()
    return t.tasks.filter((x) => x.status !== 'done' && x.plan_date !== null && x.plan_date < d)
      .length
  }, [t.tasks])

  async function handleSave(draft: TaskDraft, addAnother: boolean) {
    if (editing) await t.update(editing.id, draft)
    else await t.add(draft)
    if (!addAnother) {
      setModalOpen(false)
      setEditing(null)
    }
  }

  const handleDelete = useCallback(
    (task: Task) => {
      void t.softDelete(task.id)
      push('Task deleted', { action: { label: 'Undo', run: () => void t.restore(task.id) } })
    },
    [t.softDelete, t.restore, push],
  )

  const handleEdit = useCallback((task: Task) => {
    setEditing(task)
    setModalOpen(true)
  }, [])

  const handleToggleDone = useCallback((task: Task) => void t.toggleDone(task), [t.toggleDone])

  const handlePatch = useCallback(
    (id: string, patch: Partial<Task>) => void t.update(id, patch),
    [t.update],
  )

  const handleDuplicate = useCallback(async (task: Task) => {
    await t.add({
      title: `${task.title} (copy)`,
      area: task.area,
      project: task.project,
      plan_date: task.plan_date,
      due_date: task.due_date,
      notes: task.notes,
      priority: task.priority,
      status: 'todo',
      tags: task.tags,
    })
  }, [t.add])

  async function handleRollForward() {
    const before = await t.rollForward()
    if (before.length === 0) return
    push(`Moved ${before.length} task${before.length === 1 ? '' : 's'} to today`, {
      action: { label: 'Undo', run: () => void t.undoRollForward(before) },
    })
  }

  const handleSort = useCallback((next: SortState) => update({ sort: next }), [update])

  const defaultArea = prefs.areaFilter === 'all' ? 'work' : prefs.areaFilter

  return (
    <div className="min-h-dvh">
      <header className="flex items-center gap-4 border-b border-zinc-800 px-4 py-3">
        <span className="font-semibold tracking-tight">
          task<span className="text-teal-400">tail</span>
        </span>
        <span className="ml-auto truncate text-sm text-zinc-400">{session.user.email}</span>
        <button
          onClick={() => supabase.auth.signOut()}
          className="rounded-md border border-zinc-800 px-2.5 py-1 text-sm text-zinc-300 hover:border-zinc-700 hover:text-zinc-100"
        >
          Sign out
        </button>
      </header>

      <Toolbar
        prefs={prefs}
        onChange={update}
        onReset={reset}
        search={search}
        onSearch={setSearch}
        onAdd={() => {
          setEditing(null)
          setModalOpen(true)
        }}
        onRollForward={() => void handleRollForward()}
        staleCount={staleCount}
      />

      <main className="px-1 py-2">
        {t.loading ? (
          <div className="space-y-2 px-3 py-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-8 animate-pulse rounded bg-zinc-900" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <p className="px-3 py-16 text-center text-zinc-500">
            {search.trim()
              ? `Nothing matches “${search.trim()}”.`
              : prefs.areaFilter === 'home'
                ? 'Nothing for Home. Nice.'
                : prefs.areaFilter === 'work'
                  ? 'Nothing for Work. Nice.'
                  : 'Nothing here yet. Press n to add a task.'}
          </p>
        ) : (
          <TaskTable
            tasks={visible}
            prefs={prefs}
            grouped={prefs.areaFilter === 'all' && prefs.sort === null}
            projects={t.projects}
            onSort={handleSort}
            onToggleDone={handleToggleDone}
            onPatch={handlePatch}
            onEdit={handleEdit}
            onDuplicate={handleDuplicate}
            onDelete={handleDelete}
          />
        )}
      </main>

      <TaskModal
        open={modalOpen}
        task={editing}
        defaultArea={editing?.area ?? defaultArea}
        projects={t.projects}
        onSave={handleSave}
        onClose={() => {
          setModalOpen(false)
          setEditing(null)
        }}
      />

      <Toasts toasts={toasts} onDismiss={dismiss} />
    </div>
  )
}
