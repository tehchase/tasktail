// Captured at module load, before supabase-js's detectSessionInUrl exchanges the
// code and strips it from the URL. supabase.ts imports this first so the read is
// guaranteed to happen before createClient() runs.
const params = new URLSearchParams(window.location.search)

/** True if we landed here from a magic link and an exchange is likely in flight. */
export const hadPkceCode = params.has('code')

/** Supabase reports expired/invalid links as query params rather than a code. */
export const pkceUrlError =
  params.get('error_description') ?? params.get('error') ?? null
