import { useCallback, useEffect, useRef, useState } from 'react'
import {
  DEFAULT_PREFS,
  fetchPrefs,
  loadLocalPrefs,
  persistPrefs,
  saveLocalPrefs,
  type Prefs,
} from '../lib/prefs'

const SAVE_DEBOUNCE_MS = 600

/**
 * localStorage is the fast path for first paint; user_prefs is the source of
 * truth so the layout follows you between devices. Writes are debounced.
 */
export function usePrefs(userId: string) {
  const [prefs, setPrefs] = useState<Prefs>(() => loadLocalPrefs())
  const [loaded, setLoaded] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const firstServerLoad = useRef(true)

  useEffect(() => {
    let alive = true
    fetchPrefs(userId).then((remote) => {
      if (!alive) return
      if (remote) {
        setPrefs(remote)
        saveLocalPrefs(remote)
      }
      setLoaded(true)
    })
    return () => {
      alive = false
    }
  }, [userId])

  // Persist changes, but not the initial hydration from the server.
  useEffect(() => {
    if (!loaded) return
    if (firstServerLoad.current) {
      firstServerLoad.current = false
      return
    }
    saveLocalPrefs(prefs)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => void persistPrefs(userId, prefs), SAVE_DEBOUNCE_MS)
    return () => clearTimeout(timer.current)
  }, [prefs, loaded, userId])

  const update = useCallback((patch: Partial<Prefs>) => {
    setPrefs((p) => ({ ...p, ...patch }))
  }, [])

  const reset = useCallback(() => setPrefs(DEFAULT_PREFS), [])

  return { prefs, update, reset }
}
