import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export function List({ session }: { session: Session }) {
  return (
    <div className="min-h-dvh">
      <header className="flex items-center gap-4 border-b border-zinc-800 px-4 py-3">
        <span className="font-semibold tracking-tight">
          task<span className="text-teal-400">tail</span>
        </span>
        <span className="ml-auto truncate text-sm text-zinc-400">
          {session.user.email}
        </span>
        <button
          onClick={() => supabase.auth.signOut()}
          className="rounded-md border border-zinc-800 px-2.5 py-1 text-sm text-zinc-300 hover:border-zinc-700 hover:text-zinc-100"
        >
          Sign out
        </button>
      </header>

      <main className="grid place-items-center px-4 py-24">
        <p className="text-zinc-500">Phase 2 goes here</p>
      </main>
    </div>
  )
}
