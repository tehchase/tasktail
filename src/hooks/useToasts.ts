import { useCallback, useRef, useState } from 'react'

export type Toast = {
  id: number
  message: string
  tone: 'info' | 'error'
  action?: { label: string; run: () => void }
}

const DEFAULT_MS = 5000 // SPEC 4.2: 5-second undo window

export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(1)

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const push = useCallback(
    (message: string, opts: { tone?: Toast['tone']; action?: Toast['action'] } = {}) => {
      const id = nextId.current++
      setToasts((prev) => [...prev, { id, message, tone: opts.tone ?? 'info', action: opts.action }])
      setTimeout(() => dismiss(id), DEFAULT_MS)
      return id
    },
    [dismiss],
  )

  return { toasts, push, dismiss }
}
