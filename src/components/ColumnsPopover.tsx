import { useEffect, useRef, useState } from 'react'
import type { ColumnId, Prefs } from '../lib/prefs'

const LABELS: Record<ColumnId, string> = {
  status: 'Done',
  title: 'Task',
  priority: 'Priority',
  project: 'Project',
  plan_date: 'Plan date',
  due_date: 'Due date',
  tags: 'Tags',
  notes: 'Notes',
}

export function ColumnsPopover({
  prefs,
  onChange,
  onReset,
}: {
  prefs: Prefs
  onChange: (patch: Partial<Prefs>) => void
  onReset: () => void
}) {
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  function toggle(id: ColumnId) {
    const hidden = prefs.hidden.includes(id)
      ? prefs.hidden.filter((h) => h !== id)
      : [...prefs.hidden, id]
    onChange({ hidden })
  }

  function move(id: ColumnId, dir: -1 | 1) {
    const cols = [...prefs.columns]
    const i = cols.indexOf(id)
    const j = i + dir
    if (i < 0 || j < 0 || j >= cols.length) return
    ;[cols[i], cols[j]] = [cols[j], cols[i]]
    onChange({ columns: cols })
  }

  return (
    <div ref={box} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="rounded-md border border-zinc-800 px-2.5 py-1 text-sm text-zinc-300 hover:border-zinc-700"
      >
        Columns
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-1 w-60 rounded-lg border border-zinc-800 bg-zinc-900 p-2 shadow-xl">
          {prefs.columns.map((id, i) => (
            <div key={id} className="flex items-center gap-2 rounded px-1 py-1 hover:bg-zinc-800/60">
              <input
                type="checkbox"
                id={`col-${id}`}
                checked={!prefs.hidden.includes(id)}
                onChange={() => toggle(id)}
                className="size-3.5 accent-teal-500"
              />
              <label htmlFor={`col-${id}`} className="flex-1 text-sm text-zinc-300">
                {LABELS[id]}
              </label>
              <button
                onClick={() => move(id, -1)}
                disabled={i === 0}
                aria-label={`Move ${LABELS[id]} up`}
                className="px-1 text-zinc-500 hover:text-zinc-200 disabled:opacity-25"
              >
                ▲
              </button>
              <button
                onClick={() => move(id, 1)}
                disabled={i === prefs.columns.length - 1}
                aria-label={`Move ${LABELS[id]} down`}
                className="px-1 text-zinc-500 hover:text-zinc-200 disabled:opacity-25"
              >
                ▼
              </button>
            </div>
          ))}
          <button
            onClick={onReset}
            className="mt-1 w-full rounded px-1 py-1 text-left text-xs text-teal-400 hover:bg-zinc-800/60"
          >
            Reset to default
          </button>
        </div>
      )}
    </div>
  )
}
