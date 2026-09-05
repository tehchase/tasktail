import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useMemo, useState } from 'react'
import type { Task } from '../lib/types'
import { formatPlanDate, isOverdue } from '../lib/dates'

const col = createColumnHelper<Task>()

function AreaChip({ area }: { area: Task['area'] }) {
  return (
    <span
      className={`rounded px-1.5 py-0.5 text-xs ${
        area === 'work'
          ? 'bg-teal-500/10 text-teal-300'
          : 'bg-amber-500/10 text-amber-300'
      }`}
    >
      {area}
    </span>
  )
}

export function TaskTable({
  tasks,
  onToggleDone,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  tasks: Task[]
  onToggleDone: (t: Task) => void
  onEdit: (t: Task) => void
  onDuplicate: (t: Task) => void
  onDelete: (t: Task) => void
}) {
  const [menuFor, setMenuFor] = useState<string | null>(null)

  const columns = useMemo(
    () => [
      col.accessor('status', {
        header: '',
        cell: (c) => (
          <input
            type="checkbox"
            checked={c.getValue() === 'done'}
            onChange={() => onToggleDone(c.row.original)}
            aria-label={`Mark ${c.row.original.title} done`}
            className="size-4 accent-teal-500"
          />
        ),
      }),
      col.accessor('title', {
        header: 'Task',
        cell: (c) => (
          <span
            className={
              c.row.original.status === 'done' ? 'text-zinc-500 line-through' : 'text-zinc-100'
            }
          >
            {c.getValue()}
            {c.row.original.status === 'in_progress' && (
              <span className="ml-2 rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-400">
                in progress
              </span>
            )}
          </span>
        ),
      }),
      col.accessor('priority', {
        header: 'P',
        cell: (c) => {
          const p = c.getValue()
          if (p === null) return <span className="text-zinc-700">—</span>
          return (
            <span className={p === 1 ? 'font-medium text-red-400' : 'text-zinc-400'}>{p}</span>
          )
        },
      }),
      col.accessor('project', {
        header: 'Project',
        cell: (c) => <span className="text-zinc-400">{c.getValue() ?? ''}</span>,
      }),
      col.accessor('plan_date', {
        header: 'Plan',
        cell: (c) => {
          const v = c.getValue()
          const overdue = isOverdue(v) && c.row.original.status !== 'done'
          return (
            <span className={overdue ? 'text-red-400' : 'text-zinc-300'}>
              {formatPlanDate(v)}
            </span>
          )
        },
      }),
      col.accessor('due_date', {
        header: 'Due',
        cell: (c) => <span className="text-zinc-400">{formatPlanDate(c.getValue())}</span>,
      }),
      col.accessor('tags', {
        header: 'Tags',
        cell: (c) => (
          <span className="flex flex-wrap gap-1">
            {c.getValue().map((t) => (
              <span key={t} className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-400">
                {t}
              </span>
            ))}
          </span>
        ),
      }),
      col.accessor('notes', {
        header: 'Notes',
        cell: (c) => (
          <span className="line-clamp-1 text-zinc-500" title={c.getValue() ?? ''}>
            {c.getValue() ?? ''}
          </span>
        ),
      }),
      col.display({
        id: 'actions',
        header: '',
        cell: (c) => {
          const t = c.row.original
          const open = menuFor === t.id
          return (
            <div className="relative text-right">
              <button
                onClick={() => setMenuFor(open ? null : t.id)}
                aria-label="Row actions"
                className="rounded px-1.5 text-zinc-600 hover:bg-zinc-800 hover:text-zinc-300"
              >
                ⋯
              </button>
              {open && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuFor(null)} />
                  <div className="absolute right-0 z-20 mt-1 w-32 rounded-md border border-zinc-800 bg-zinc-900 py-1 text-left shadow-xl">
                    {[
                      ['Edit', () => onEdit(t)],
                      ['Duplicate', () => onDuplicate(t)],
                      ['Delete', () => onDelete(t)],
                    ].map(([name, run]) => (
                      <button
                        key={name as string}
                        onClick={() => {
                          setMenuFor(null)
                          ;(run as () => void)()
                        }}
                        className={`block w-full px-3 py-1.5 text-sm hover:bg-zinc-800 ${
                          name === 'Delete' ? 'text-red-400' : 'text-zinc-300'
                        }`}
                      >
                        {name as string}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )
        },
      }),
    ],
    [menuFor, onToggleDone, onEdit, onDuplicate, onDelete],
  )

  const table = useReactTable({
    data: tasks,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  // SPEC 4.2: in the All view, group by area with a divider before sorting.
  const rows = table.getRowModel().rows
  let lastArea: string | null = null

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-3xl border-collapse text-sm">
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id} className="border-b border-zinc-800">
              {hg.headers.map((h) => (
                <th
                  key={h.id}
                  className="px-3 py-2 text-left text-xs font-medium text-zinc-500"
                >
                  {h.isPlaceholder
                    ? null
                    : flexRender(h.column.columnDef.header, h.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {rows.map((row) => {
            const area = row.original.area
            const newGroup = area !== lastArea
            lastArea = area
            return (
              <tr key={row.id} className="group border-b border-zinc-900 hover:bg-zinc-900/50">
                {row.getVisibleCells().map((cell, i) => (
                  <td
                    key={cell.id}
                    className={`px-3 py-2 align-middle ${
                      newGroup ? 'border-t-2 border-t-zinc-800' : ''
                    }`}
                  >
                    {i === 1 && newGroup ? (
                      <span className="flex items-center gap-2">
                        <AreaChip area={area} />
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </span>
                    ) : (
                      flexRender(cell.column.columnDef.cell, cell.getContext())
                    )}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
