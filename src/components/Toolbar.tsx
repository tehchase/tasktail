import type { Prefs } from '../lib/prefs'
import { ColumnsPopover } from './ColumnsPopover'

const AREAS = [
  { id: 'all', label: 'All' },
  { id: 'work', label: 'Work' },
  { id: 'home', label: 'Home' },
] as const

export function Toolbar({
  prefs,
  onChange,
  onReset,
  search,
  onSearch,
  onAdd,
  onRollForward,
  staleCount,
}: {
  prefs: Prefs
  onChange: (patch: Partial<Prefs>) => void
  onReset: () => void
  search: string
  onSearch: (v: string) => void
  onAdd: () => void
  onRollForward: () => void
  staleCount: number
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800 px-4 py-2">
      <div className="flex rounded-md border border-zinc-800 p-0.5">
        {AREAS.map((a) => (
          <button
            key={a.id}
            onClick={() => onChange({ areaFilter: a.id })}
            className={`rounded px-2.5 py-0.5 text-sm ${
              prefs.areaFilter === a.id
                ? 'bg-teal-500 font-medium text-zinc-950'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {a.label}
          </button>
        ))}
      </div>

      <input
        type="search"
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        placeholder="Search…"
        className="w-44 rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-teal-500"
      />

      <label className="flex items-center gap-1.5 text-sm text-zinc-400">
        <input
          type="checkbox"
          checked={prefs.showDone}
          onChange={(e) => onChange({ showDone: e.target.checked })}
          className="size-3.5 accent-teal-500"
        />
        Show done
      </label>

      <button
        onClick={onRollForward}
        disabled={staleCount === 0}
        title={
          staleCount === 0
            ? 'Nothing is overdue'
            : `Move ${staleCount} overdue task${staleCount === 1 ? '' : 's'} to today`
        }
        className="rounded-md border border-zinc-800 px-2.5 py-1 text-sm text-zinc-300 hover:border-zinc-700 disabled:opacity-40"
      >
        Roll forward{staleCount > 0 && ` (${staleCount})`}
      </button>

      <div className="ml-auto flex items-center gap-2">
        <ColumnsPopover prefs={prefs} onChange={onChange} onReset={onReset} />
        <button
          onClick={onAdd}
          className="rounded-md bg-teal-500 px-3 py-1 text-sm font-medium text-zinc-950 hover:bg-teal-400"
        >
          + Add
        </button>
      </div>
    </div>
  )
}
