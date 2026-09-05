import { supabase } from './supabase'
import type { TaskArea } from './types'

/** Column ids the user can show/hide/reorder. `actions` is pinned and excluded. */
export const ALL_COLUMNS = [
  'status',
  'title',
  'priority',
  'project',
  'plan_date',
  'due_date',
  'tags',
  'notes',
] as const

export type ColumnId = (typeof ALL_COLUMNS)[number]

export type SortState = { id: ColumnId; desc: boolean } | null

export type Prefs = {
  columns: ColumnId[]
  hidden: ColumnId[]
  areaFilter: 'all' | TaskArea
  sort: SortState
  showDone: boolean
}

export const DEFAULT_PREFS: Prefs = {
  columns: [...ALL_COLUMNS],
  hidden: [],
  areaFilter: 'all',
  sort: null,
  showDone: false,
}

const LS_KEY = 'tasktail.prefs'

/** Drop unknown ids and append any column added since these prefs were saved. */
function normalize(raw: Partial<Prefs> | null | undefined): Prefs {
  const known = new Set<string>(ALL_COLUMNS)
  const columns = (raw?.columns ?? []).filter((c): c is ColumnId => known.has(c))
  for (const c of ALL_COLUMNS) if (!columns.includes(c)) columns.push(c)
  return {
    columns,
    hidden: (raw?.hidden ?? []).filter((c): c is ColumnId => known.has(c)),
    areaFilter: raw?.areaFilter ?? DEFAULT_PREFS.areaFilter,
    sort: raw?.sort && known.has(raw.sort.id) ? raw.sort : null,
    showDone: raw?.showDone ?? false,
  }
}

/** Read the mirror so the first paint has the right layout before the fetch lands. */
export function loadLocalPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? normalize(JSON.parse(raw)) : DEFAULT_PREFS
  } catch {
    return DEFAULT_PREFS
  }
}

export function saveLocalPrefs(prefs: Prefs) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(prefs))
  } catch {
    // private mode / storage disabled — the server copy is the real one
  }
}

export async function fetchPrefs(userId: string): Promise<Prefs | null> {
  const { data, error } = await supabase
    .from('user_prefs')
    .select('prefs')
    .eq('user_id', userId)
    .maybeSingle()
  if (error || !data) return null
  return normalize(data.prefs as Partial<Prefs>)
}

export async function persistPrefs(userId: string, prefs: Prefs) {
  const { error } = await supabase
    .from('user_prefs')
    .upsert({ user_id: userId, prefs }, { onConflict: 'user_id' })
  return error?.message ?? null
}
