/** Local-time YYYY-MM-DD. Never use toISOString() here — it shifts across UTC. */
export function toISODate(d: Date): string {
  const m = `${d.getMonth() + 1}`.padStart(2, '0')
  const day = `${d.getDate()}`.padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

export function today(): string {
  return toISODate(new Date())
}

export function addDays(iso: string, n: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  return toISODate(new Date(y, m - 1, d + n))
}

/** Next Monday (or a week out if today is Monday). */
export function nextMonday(): string {
  const now = new Date()
  const delta = (8 - now.getDay()) % 7 || 7
  return addDays(today(), delta)
}

/** Today / Tomorrow / Thu / Mar 3 — the sheet's day-word feel. */
export function formatPlanDate(iso: string | null): string {
  if (!iso) return ''
  const t = today()
  if (iso === t) return 'Today'
  if (iso === addDays(t, 1)) return 'Tomorrow'
  if (iso === addDays(t, -1)) return 'Yesterday'
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const withinWeek = iso > t && iso < addDays(t, 7)
  return withinWeek
    ? date.toLocaleDateString(undefined, { weekday: 'short' })
    : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function isOverdue(iso: string | null): boolean {
  return iso !== null && iso < today()
}
