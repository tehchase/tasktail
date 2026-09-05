import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'

export function SignIn({ initialError }: { initialError?: string | null }) {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(initialError ?? null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setSending(true)
    setError(null)
    // origin + BASE_URL => http://localhost:5173/tasktail/ in dev,
    // https://<user>.github.io/tasktail/ in production.
    const emailRedirectTo = window.location.origin + import.meta.env.BASE_URL
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo },
    })
    setSending(false)
    if (error) setError(error.message)
    else setSent(true)
  }

  return (
    <div className="min-h-dvh grid place-items-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold tracking-tight">
          task<span className="text-teal-400">tail</span>
        </h1>

        {sent ? (
          <div className="mt-6">
            <p className="text-zinc-100">Check your email.</p>
            <p className="mt-2 text-sm text-zinc-400">
              We sent a sign-in link to{' '}
              <span className="text-zinc-200">{email}</span>. Open it on this
              device.
            </p>
            <button
              type="button"
              onClick={() => setSent(false)}
              className="mt-4 text-sm text-teal-400 hover:text-teal-300"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 space-y-3">
            <label htmlFor="email" className="block text-sm text-zinc-400">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoFocus
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-100 placeholder-zinc-600 outline-none focus:border-teal-500"
              placeholder="you@example.com"
            />
            <button
              type="submit"
              disabled={sending}
              className="w-full rounded-md bg-teal-500 px-3 py-2 font-medium text-zinc-950 hover:bg-teal-400 disabled:opacity-50"
            >
              {sending ? 'Sending…' : 'Send magic link'}
            </button>
          </form>
        )}

        {error && (
          <p role="alert" className="mt-4 text-sm text-red-400">
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
