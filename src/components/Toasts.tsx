import type { Toast } from '../hooks/useToasts'

export function Toasts({
  toasts,
  onDismiss,
}: {
  toasts: Toast[]
  onDismiss: (id: number) => void
}) {
  if (toasts.length === 0) return null
  return (
    <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-sm shadow-lg ${
            t.tone === 'error'
              ? 'border-red-900 bg-red-950 text-red-200'
              : 'border-zinc-700 bg-zinc-900 text-zinc-100'
          }`}
        >
          <span>{t.message}</span>
          {t.action && (
            <button
              onClick={() => {
                t.action!.run()
                onDismiss(t.id)
              }}
              className="font-medium text-teal-400 hover:text-teal-300"
            >
              {t.action.label}
            </button>
          )}
          <button
            onClick={() => onDismiss(t.id)}
            aria-label="Dismiss"
            className="text-zinc-500 hover:text-zinc-300"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
