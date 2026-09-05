import { useEffect, useState, type FormEvent } from 'react'
import type { Task, TaskDraft } from '../lib/types'
import { AREAS, STATUSES, emptyDraft } from '../lib/types'
import { today, addDays, nextMonday } from '../lib/dates'

const field =
  'w-full rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-sm text-zinc-100 outline-none focus:border-teal-500'
const label = 'block text-xs font-medium text-zinc-400'

export function TaskModal({
  open,
  task,
  defaultArea,
  projects,
  onSave,
  onClose,
}: {
  open: boolean
  task: Task | null
  defaultArea: TaskDraft['area']
  projects: string[]
  onSave: (draft: TaskDraft, addAnother: boolean) => Promise<void>
  onClose: () => void
}) {
  const [draft, setDraft] = useState<TaskDraft>(emptyDraft(defaultArea))
  const [tagText, setTagText] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setDraft(
      task
        ? {
            title: task.title,
            area: task.area,
            project: task.project,
            plan_date: task.plan_date,
            due_date: task.due_date,
            notes: task.notes,
            priority: task.priority,
            status: task.status,
            tags: task.tags,
          }
        : emptyDraft(defaultArea),
    )
    setTagText('')
  }, [open, task, defaultArea])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      // Cmd/Ctrl+Enter saves from anywhere in the form.
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        void submit(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (!open) return null

  const set = <K extends keyof TaskDraft>(k: K, v: TaskDraft[K]) =>
    setDraft((d) => ({ ...d, [k]: v }))

  function commitTag() {
    const raw = tagText.trim().replace(/,$/, '')
    if (raw && !draft.tags.includes(raw)) set('tags', [...draft.tags, raw])
    setTagText('')
  }

  async function submit(addAnother: boolean) {
    if (!draft.title.trim() || saving) return
    setSaving(true)
    await onSave({ ...draft, title: draft.title.trim() }, addAnother)
    setSaving(false)
    if (addAnother) {
      setDraft({ ...emptyDraft(draft.area), area: draft.area, project: draft.project })
      setTagText('')
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    void submit(false)
  }

  return (
    <div
      className="fixed inset-0 z-40 grid place-items-start justify-center overflow-y-auto bg-black/60 p-4 pt-[8vh]"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <form
        onSubmit={onSubmit}
        className="w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-950 p-4 shadow-2xl"
      >
        <h2 className="text-sm font-semibold text-zinc-300">
          {task ? 'Edit task' : 'New task'}
        </h2>

        <input
          autoFocus
          required
          placeholder="Title"
          value={draft.title}
          onChange={(e) => set('title', e.target.value)}
          className={`${field} mt-3 text-base`}
        />

        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <label className={label}>Area</label>
            <select
              value={draft.area}
              onChange={(e) => set('area', e.target.value as TaskDraft['area'])}
              className={`${field} mt-1`}
            >
              {AREAS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Project</label>
            <input
              list="project-options"
              value={draft.project ?? ''}
              onChange={(e) => set('project', e.target.value || null)}
              className={`${field} mt-1`}
            />
            <datalist id="project-options">
              {projects.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
          </div>
        </div>

        <div className="mt-3">
          <label className={label}>Plan date</label>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {(
              [
                ['Today', today()],
                ['Tomorrow', addDays(today(), 1)],
                ['Next Mon', nextMonday()],
                ['Unscheduled', null],
              ] as const
            ).map(([name, value]) => (
              <button
                key={name}
                type="button"
                onClick={() => set('plan_date', value)}
                className={`rounded-md border px-2 py-1 text-xs ${
                  draft.plan_date === value
                    ? 'border-teal-500 bg-teal-500/10 text-teal-300'
                    : 'border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                {name}
              </button>
            ))}
          </div>
          <input
            type="date"
            value={draft.plan_date ?? ''}
            onChange={(e) => set('plan_date', e.target.value || null)}
            className={`${field} mt-2`}
          />
        </div>

        <div className="mt-3 grid grid-cols-3 gap-3">
          <div>
            <label className={label}>Due date</label>
            <input
              type="date"
              value={draft.due_date ?? ''}
              onChange={(e) => set('due_date', e.target.value || null)}
              className={`${field} mt-1`}
            />
          </div>
          <div>
            <label className={label}>Priority</label>
            <select
              value={draft.priority ?? ''}
              onChange={(e) => set('priority', e.target.value ? Number(e.target.value) : null)}
              className={`${field} mt-1`}
            >
              <option value="">—</option>
              <option value="1">1 (high)</option>
              <option value="2">2</option>
              <option value="3">3</option>
            </select>
          </div>
          <div>
            <label className={label}>Status</label>
            <select
              value={draft.status}
              onChange={(e) => set('status', e.target.value as TaskDraft['status'])}
              className={`${field} mt-1`}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-3">
          <label className={label}>Tags</label>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1.5">
            {draft.tags.map((t) => (
              <span
                key={t}
                className="flex items-center gap-1 rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-300"
              >
                {t}
                <button
                  type="button"
                  onClick={() => set('tags', draft.tags.filter((x) => x !== t))}
                  className="text-zinc-500 hover:text-zinc-200"
                >
                  ✕
                </button>
              </span>
            ))}
            <input
              value={tagText}
              onChange={(e) => setTagText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault()
                  commitTag()
                } else if (e.key === 'Backspace' && !tagText && draft.tags.length) {
                  set('tags', draft.tags.slice(0, -1))
                }
              }}
              onBlur={commitTag}
              placeholder={draft.tags.length ? '' : 'waiting, errand…'}
              className="min-w-24 flex-1 bg-transparent text-sm text-zinc-100 outline-none"
            />
          </div>
        </div>

        <div className="mt-3">
          <label className={label}>Notes</label>
          <textarea
            rows={3}
            value={draft.notes ?? ''}
            onChange={(e) => set('notes', e.target.value || null)}
            className={`${field} mt-1 resize-y`}
          />
        </div>

        <div className="mt-4 flex items-center gap-2">
          <button
            type="submit"
            disabled={saving || !draft.title.trim()}
            className="rounded-md bg-teal-500 px-3 py-1.5 text-sm font-medium text-zinc-950 hover:bg-teal-400 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          {!task && (
            <button
              type="button"
              onClick={() => void submit(true)}
              disabled={saving || !draft.title.trim()}
              className="rounded-md border border-zinc-800 px-3 py-1.5 text-sm text-zinc-300 hover:border-zinc-700 disabled:opacity-50"
            >
              Save &amp; add another
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="ml-auto text-sm text-zinc-500 hover:text-zinc-300"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
