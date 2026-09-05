import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useSession } from './hooks/useSession'
import { SignIn } from './pages/SignIn'
import { List } from './pages/List'

export function App() {
  const { session, loading, error } = useSession()

  if (loading) {
    return (
      <div className="min-h-dvh grid place-items-center">
        <p className="text-sm text-zinc-500">Loading…</p>
      </div>
    )
  }

  return (
    <HashRouter>
      <Routes>
        <Route
          path="/signin"
          element={
            session ? <Navigate to="/" replace /> : <SignIn initialError={error} />
          }
        />
        <Route
          path="/"
          element={
            session ? <List session={session} /> : <Navigate to="/signin" replace />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  )
}
