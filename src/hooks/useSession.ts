import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { hadPkceCode, pkceUrlError } from '../lib/pkce'

// If the code exchange never resolves (bad link, clock skew, network), stop
// waiting so the user gets the sign-in page instead of a spinner forever.
const EXCHANGE_TIMEOUT_MS = 10_000

export type SessionState = {
  session: Session | null
  loading: boolean
  error: string | null
}

export function useSession(): SessionState {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(pkceUrlError)

  useEffect(() => {
    let mounted = true
    let timer: ReturnType<typeof setTimeout> | undefined

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setSession(data.session)
      // A ?code= in the URL means detectSessionInUrl is mid-exchange. Keep
      // loading so we don't flash /signin and then bounce back on success.
      if (!data.session && hadPkceCode && !pkceUrlError) {
        timer = setTimeout(() => {
          if (!mounted) return
          setError('Sign-in link could not be completed. Please request a new one.')
          setLoading(false)
        }, EXCHANGE_TIMEOUT_MS)
        return
      }
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      if (!mounted) return
      if (timer) clearTimeout(timer)
      setSession(next)
      if (next) setError(null)
      setLoading(false)
    })

    return () => {
      mounted = false
      if (timer) clearTimeout(timer)
      sub.subscription.unsubscribe()
    }
  }, [])

  return { session, loading, error }
}
