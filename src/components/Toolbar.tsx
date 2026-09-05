export function Toolbar({
  showDone,
  onToggleShowDone,
  onAdd,
  onRollForward,
  staleCount,
}: {
  showDone: boolean
  onToggleShowDone: (v: boolean) => void
  onAdd: () => void
  onRollForward: () => void
  staleCount: number
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-zinc-800 px-4 py-2">
      <label className="flex items-center gap-1.5 text-sm text-zinc-400">
        <input
          type="checkbox"
          checked={showDone}
          onChange={(e) => onToggleShowDone(e.target.checked)}
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

      <button
        onClick={onAdd}
        className="ml-auto rounded-md bg-teal-500 px-3 py-1 text-sm font-medium text-zinc-950 hover:bg-teal-400"
      >
        + Add
      </button>
    </div>
  )
}
