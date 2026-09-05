// Imported first: it must read window.location.search before createClient()
// starts the PKCE code exchange and rewrites the URL.
import './pkce'
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Fail loudly at startup rather than at the first request. In CI these come from
// GitHub Actions repo variables; locally from .env.local (gitignored).
const missing = [
  !url && 'VITE_SUPABASE_URL',
  !anonKey && 'VITE_SUPABASE_ANON_KEY',
].filter(Boolean)

if (missing.length > 0) {
  throw new Error(
    `Missing Supabase config: ${missing.join(', ')}. ` +
      `Set these in .env.local for local dev, or as GitHub Actions repository ` +
      `variables for the deployed build, then rebuild.`,
  )
}

export const supabase = createClient(url, anonKey, {
  auth: {
    // PKCE puts a ?code= on the redirect. detectSessionInUrl exchanges it for a
    // session and strips it, which keeps it from colliding with the hash router.
    flowType: 'pkce',
    detectSessionInUrl: true,
    persistSession: true,
    autoRefreshToken: true,
  },
})
