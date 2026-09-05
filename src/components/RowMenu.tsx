import { useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

type Item = { label: string; run: () => void; danger?: boolean }

/**
 * Rendered into document.body: the table scrolls horizontally, and an
 * overflow-x container clips on the y-axis too, which would cut the menu off.
 */
export function RowMenu({ items }: { items: Item[] }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const btn = useRef<HTMLButtonElement>(null)

  useLayoutEffect(() => {
    if (!open || !btn.current) return
    const r = btn.current.getBoundingClientRect()
    const width = 132
    setPos({
      top: Math.min(r.bottom + 4, window.innerHeight - 8 - items.length * 32),
      left: Math.max(8, Math.min(r.right - width, window.innerWidth - width - 8)),
    })
  }, [open, items.length])

  useLayoutEffect(() => {
    if (!open) return
    const close = () => setOpen(false)
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    return () => {
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
    }
  }, [open])

  return (
    <div className="text-right">
      <button
        ref={btn}
        onClick={() => setOpen((o) => !o)}
        aria-label="Row actions"
        aria-expanded={open}
        className="rounded px-1.5 text-zinc-600 hover:bg-zinc-800 hover:text-zinc-300"
      >
        ⋯
      </button>
      {open &&
        createPortal(
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div
              style={{ top: pos.top, left: pos.left }}
              className="fixed z-50 w-33 rounded-md border border-zinc-800 bg-zinc-900 py-1 text-left shadow-xl"
            >
              {items.map((it) => (
                <button
                  key={it.label}
                  onClick={() => {
                    setOpen(false)
                    it.run()
                  }}
                  className={`block w-full px-3 py-1.5 text-sm hover:bg-zinc-800 ${
                    it.danger ? 'text-red-400' : 'text-zinc-300'
                  }`}
                >
                  {it.label}
                </button>
              ))}
            </div>
          </>,
          document.body,
        )}
    </div>
  )
}
