import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
type Mode = 'login' | 'signup'
interface Ctx { user: User | null; session: Session | null; loading: boolean; authOpen: Mode | null; openAuth: (m?: Mode) => void; closeAuth: () => void; signOut: () => Promise<void> }
const AuthContext = createContext<Ctx | null>(null)
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [authOpen, setAuthOpen] = useState<Mode | null>(null)
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false) })
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])
  return <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, authOpen,
    openAuth: (m = 'login') => setAuthOpen(m), closeAuth: () => setAuthOpen(null),
    signOut: async () => { await supabase.auth.signOut() } }}>{children}</AuthContext.Provider>
}
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() { const c = useContext(AuthContext); if (!c) throw new Error('useAuth outside provider'); return c }
