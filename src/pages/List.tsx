import { useEffect, useMemo, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { useTasks } from '../hooks/useTasks'
import { useToasts } from '../hooks/useToasts'
import { Toasts } from '../components/Toasts'
import { Toolbar } from '../components/Toolbar'
import { TaskTable } from '../components/TaskTable'
import { TaskModal } from '../components/TaskModal'
import type { Task, TaskDraft } from '../lib/types'
import { today } from '../lib/dates'

export function List({ session }: { session: Session }) {
  const t = useTasks(session.user.id)
  const { toasts, push, dismiss } = useToasts()
  const [showDone, setShowDone] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Task | null>(null)

  // Surface hook failures once each.
  useEffect(() => {
    if (!t.error) return
    push(t.error, { tone: 'error' })
    t.clearError()
  }, [t.error, push, t])

  // `n` opens Add from anywhere (SPEC 4.3).
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

  const visible = useMemo(
    () => (showDone ? t.tasks : t.tasks.filter((x) => x.status !== 'done')),
    [t.tasks, showDone],
  )

  const staleCount = useMemo(() => {
    const d = today()
    return t.tasks.filter(
      (x) => x.status !== 'done' && x.plan_date !== null && x.plan_date < d,
    ).length
  }, [t.tasks])

  async function handleSave(draft: TaskDraft, addAnother: boolean) {
    if (editing) {
      await t.update(editing.id, draft)
    } else {
      await t.add(draft)
    }
    if (!addAnother) {
      setModalOpen(false)
      setEditing(null)
    }
  }

  function handleDelete(task: Task) {
    void t.softDelete(task.id)
    push('Task deleted', { action: { label: 'Undo', run: () => void t.restore(task.id) } })
  }

  async function handleDuplicate(task: Task) {
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
  }

  async function handleRollForward() {
    const before = await t.rollForward()
    if (before.length === 0) return
    push(`Moved ${before.length} task${before.length === 1 ? '' : 's'} to today`, {
      action: { label: 'Undo', run: () => void t.undoRollForward(before) },
    })
  }

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
        showDone={showDone}
        onToggleShowDone={setShowDone}
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
            Nothing here yet. Press <kbd className="text-zinc-400">n</kbd> to add a task.
          </p>
        ) : (
          <TaskTable
            tasks={visible}
            onToggleDone={(task) => void t.toggleDone(task)}
            onEdit={(task) => {
              setEditing(task)
              setModalOpen(true)
            }}
            onDuplicate={(task) => void handleDuplicate(task)}
            onDelete={handleDelete}
          />
        )}
      </main>

      <TaskModal
        open={modalOpen}
        task={editing}
        defaultArea={editing?.area ?? 'work'}
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
