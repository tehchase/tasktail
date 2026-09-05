import { useEffect, useRef, useState } from 'react'

type Kind = 'text' | 'date' | 'priority' | 'tags' | 'combobox'

/**
 * Click to edit. Enter or blur commits, Esc cancels. The parent applies the
 * change optimistically, so there's no saving state here.
 */
export function EditableCell({
  kind,
  value,
  display,
  options,
  onCommit,
}: {
  kind: Kind
  value: string
  display: React.ReactNode
  options?: string[]
  onCommit: (next: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const ref = useRef<HTMLInputElement | HTMLSelectElement>(null)

  useEffect(() => {
    if (editing) {
      setDraft(value)
      // focus after the input mounts
      queueMicrotask(() => ref.current?.focus())
    }
  }, [editing, value])

  function commit() {
    setEditing(false)
    if (draft !== value) onCommit(draft)
  }

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="-mx-1 block w-full rounded px-1 text-left hover:bg-zinc-800/60"
        title="Click to edit"
      >
        {display}
      </button>
    )
  }

  const common = {
    ref: ref as never,
    value: draft,
    onBlur: commit,
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        commit()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        setEditing(false)
      }
    },
    className:
      'w-full min-w-24 rounded border border-teal-600 bg-zinc-900 px-1 py-0.5 text-sm text-zinc-100 outline-none',
  }

  if (kind === 'priority') {
    return (
      <select {...common} onChange={(e) => setDraft(e.target.value)}>
        <option value="">—</option>
        <option value="1">1</option>
        <option value="2">2</option>
        <option value="3">3</option>
      </select>
    )
  }

  const listId = kind === 'combobox' ? 'inline-project-options' : undefined
  return (
    <>
      <input
        {...common}
        type={kind === 'date' ? 'date' : 'text'}
        list={listId}
        placeholder={kind === 'tags' ? 'comma, separated' : undefined}
        onChange={(e) => setDraft(e.target.value)}
      />
      {listId && (
        <datalist id={listId}>
          {(options ?? []).map((o) => (
            <option key={o} value={o} />
          ))}
        </datalist>
      )}
    </>
  )
}
