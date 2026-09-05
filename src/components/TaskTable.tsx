import { useMemo } from 'react'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
  type VisibilityState,
} from '@tanstack/react-table'
import type { Task } from '../lib/types'
import { ALL_COLUMNS, type ColumnId, type Prefs, type SortState } from '../lib/prefs'
import { formatPlanDate, isOverdue } from '../lib/dates'
import { RowMenu } from './RowMenu'
import { EditableCell } from './EditableCell'

const col = createColumnHelper<Task>()

function AreaChip({ area }: { area: Task['area'] }) {
  return (
    <span
      className={`rounded px-1.5 py-0.5 text-xs ${
        area === 'work' ? 'bg-teal-500/10 text-teal-300' : 'bg-amber-500/10 text-amber-300'
      }`}
    >
      {area}
    </span>
  )
}

const Dash = () => <span className="text-zinc-700">—</span>

export function TaskTable({
  tasks,
  prefs,
  grouped,
  projects,
  onSort,
  onToggleDone,
  onPatch,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  tasks: Task[]
  prefs: Prefs
  grouped: boolean
  projects: string[]
  onSort: (next: SortState) => void
  onToggleDone: (t: Task) => void
  onPatch: (id: string, patch: Partial<Task>) => void
  onEdit: (t: Task) => void
  onDuplicate: (t: Task) => void
  onDelete: (t: Task) => void
}) {
  // accessors return undefined (not null) so TanStack's sortUndefined can park
  // empty values at the bottom in both directions
  const columns = useMemo(
    () => [
      col.accessor((t) => t.status, {
        id: 'status',
        header: '',
        enableSorting: false,
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
      col.accessor((t) => t.title.toLowerCase(), {
        id: 'title',
        header: 'Task',
        cell: (c) => {
          const t = c.row.original
          return (
            <EditableCell
              kind="text"
              value={t.title}
              onCommit={(v) => v.trim() && onPatch(t.id, { title: v.trim() })}
              display={
                <span
                  className={t.status === 'done' ? 'text-zinc-500 line-through' : 'text-zinc-100'}
                >
                  {t.title}
                  {t.status === 'in_progress' && (
                    <span className="ml-2 rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-400">
                      in progress
                    </span>
                  )}
                </span>
              }
            />
          )
        },
      }),
      col.accessor((t) => t.priority ?? undefined, {
        id: 'priority',
        header: 'P',
        sortUndefined: 'last',
        cell: (c) => {
          const t = c.row.original
          return (
            <EditableCell
              kind="priority"
              value={t.priority?.toString() ?? ''}
              onCommit={(v) => onPatch(t.id, { priority: v ? Number(v) : null })}
              display={
                t.priority === null ? (
                  <Dash />
                ) : (
                  <span className={t.priority === 1 ? 'font-medium text-red-400' : 'text-zinc-400'}>
                    {t.priority}
                  </span>
                )
              }
            />
          )
        },
      }),
      col.accessor((t) => t.project?.toLowerCase() ?? undefined, {
        id: 'project',
        header: 'Project',
        sortUndefined: 'last',
        cell: (c) => {
          const t = c.row.original
          return (
            <EditableCell
              kind="combobox"
              value={t.project ?? ''}
              options={projects}
              onCommit={(v) => onPatch(t.id, { project: v.trim() || null })}
              display={<span className="text-zinc-400">{t.project ?? <Dash />}</span>}
            />
          )
        },
      }),
      col.accessor((t) => t.plan_date ?? undefined, {
        id: 'plan_date',
        header: 'Plan',
        sortUndefined: 'last',
        cell: (c) => {
          const t = c.row.original
          return (
            <EditableCell
              kind="date"
              value={t.plan_date ?? ''}
              onCommit={(v) => onPatch(t.id, { plan_date: v || null })}
              display={
                <span
                  className={
                    isOverdue(t.plan_date) && t.status !== 'done' ? 'text-red-400' : 'text-zinc-300'
                  }
                >
                  {formatPlanDate(t.plan_date) || <Dash />}
                </span>
              }
            />
          )
        },
      }),
      col.accessor((t) => t.due_date ?? undefined, {
        id: 'due_date',
        header: 'Due',
        sortUndefined: 'last',
        cell: (c) => {
          const t = c.row.original
          return (
            <EditableCell
              kind="date"
              value={t.due_date ?? ''}
              onCommit={(v) => onPatch(t.id, { due_date: v || null })}
              display={
                <span className="text-zinc-400">{formatPlanDate(t.due_date) || <Dash />}</span>
              }
            />
          )
        },
      }),
      col.accessor((t) => (t.tags.length ? t.tags.join(',').toLowerCase() : undefined), {
        id: 'tags',
        header: 'Tags',
        sortUndefined: 'last',
        cell: (c) => {
          const t = c.row.original
          return (
            <EditableCell
              kind="tags"
              value={t.tags.join(', ')}
              onCommit={(v) =>
                onPatch(t.id, { tags: v.split(',').map((x) => x.trim()).filter(Boolean) })
              }
              display={
                t.tags.length === 0 ? (
                  <Dash />
                ) : (
                  <span className="flex flex-wrap gap-1">
                    {t.tags.map((x) => (
                      <span
                        key={x}
                        className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-400"
                      >
                        {x}
                      </span>
                    ))}
                  </span>
                )
              }
            />
          )
        },
      }),
      col.accessor((t) => t.notes?.toLowerCase() ?? undefined, {
        id: 'notes',
        header: 'Notes',
        sortUndefined: 'last',
        cell: (c) => {
          const t = c.row.original
          return (
            <EditableCell
              kind="text"
              value={t.notes ?? ''}
              onCommit={(v) => onPatch(t.id, { notes: v.trim() || null })}
              display={
                <span className="line-clamp-1 text-zinc-500" title={t.notes ?? ''}>
                  {t.notes || <Dash />}
                </span>
              }
            />
          )
        },
      }),
      col.display({
        id: 'actions',
        header: '',
        cell: (c) => {
          const t = c.row.original
          return (
            <RowMenu
              items={[
                { label: 'Edit', run: () => onEdit(t) },
                { label: 'Duplicate', run: () => onDuplicate(t) },
                { label: 'Delete', run: () => onDelete(t), danger: true },
              ]}
            />
          )
        },
      }),
    ],
    [projects, onToggleDone, onPatch, onEdit, onDuplicate, onDelete],
  )

  const sorting: SortingState = prefs.sort ? [{ id: prefs.sort.id, desc: prefs.sort.desc }] : []

  const columnVisibility: VisibilityState = useMemo(() => {
    const v: VisibilityState = {}
    for (const id of ALL_COLUMNS) v[id] = !prefs.hidden.includes(id)
    return v
  }, [prefs.hidden])

  // user order, then the pinned actions column
  const columnOrder = useMemo(() => [...prefs.columns, 'actions'], [prefs.columns])

  const table = useReactTable({
    data: tasks,
    columns,
    state: { sorting, columnVisibility, columnOrder },
    onSortingChange: (updater) => {
      const next = typeof updater === 'function' ? updater(sorting) : updater
      onSort(next.length === 0 ? null : { id: next[0].id as ColumnId, desc: next[0].desc })
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableSortingRemoval: true, // asc -> desc -> off
  })

  const rows = table.getRowModel().rows
  let lastArea: string | null = null

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-3xl border-collapse text-sm">
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id} className="border-b border-zinc-800">
              {hg.headers.map((h) => {
                const sorted = h.column.getIsSorted()
                return (
                  <th key={h.id} className="px-3 py-2 text-left text-xs font-medium text-zinc-500">
                    {h.isPlaceholder ? null : h.column.getCanSort() ? (
                      <button
                        onClick={h.column.getToggleSortingHandler()}
                        className={`hover:text-zinc-300 ${sorted ? 'text-teal-400' : ''}`}
                      >
                        {flexRender(h.column.columnDef.header, h.getContext())}
                        {sorted === 'asc' ? ' ↑' : sorted === 'desc' ? ' ↓' : ''}
                      </button>
                    ) : (
                      flexRender(h.column.columnDef.header, h.getContext())
                    )}
                  </th>
                )
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {rows.map((row) => {
            const area = row.original.area
            const newGroup = grouped && area !== lastArea
            lastArea = area
            const cells = row.getVisibleCells()
            const chipAt = cells.findIndex((c) => c.column.id !== 'status')
            return (
              <tr key={row.id} className="border-b border-zinc-900 hover:bg-zinc-900/50">
                {cells.map((cell, i) => (
                  <td
                    key={cell.id}
                    className={`px-3 py-2 align-middle ${
                      newGroup ? 'border-t-2 border-t-zinc-800' : ''
                    }`}
                  >
                    {newGroup && i === chipAt ? (
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
