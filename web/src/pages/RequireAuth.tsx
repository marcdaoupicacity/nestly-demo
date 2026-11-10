import type { ReactNode } from 'react'
import { useAuth } from '../context/AuthContext'
export default function RequireAuth({ children, title }: { children: ReactNode; title: string }) {
  const { user, loading, openAuth } = useAuth()
  if (loading) return <div className="py-32 text-center text-neutral-500">Loading…</div>
  if (!user) return <main className="mx-auto max-w-3xl px-6 py-20"><h1 className="text-3xl font-semibold">{title}</h1><p className="mt-4 text-neutral-600">Log in to see your {title.toLowerCase()}.</p><button onClick={() => openAuth('login')} className="mt-6 rounded-lg bg-brand px-6 py-3 font-semibold text-white">Log in</button></main>
  return <>{children}</>
}
