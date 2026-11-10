import { useState, type FormEvent } from 'react'
import { X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { useToast } from '../context/ToastContext'
export default function AuthModal() {
  const { authOpen, closeAuth, openAuth } = useAuth(); const toast = useToast()
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [fullName, setFullName] = useState('')
  const [error, setError] = useState<string | null>(null); const [busy, setBusy] = useState(false)
  if (!authOpen) return null
  const signup = authOpen === 'signup'
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setError(null); setBusy(true)
    try {
      if (signup) {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } })
        if (error) throw error
        toast(data.session ? 'Welcome to Nestly!' : 'Check your email to confirm your account.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password }); if (error) throw error
        toast('Welcome back!')
      }
      setPassword(''); closeAuth()
    } catch (err) { setError(err instanceof Error ? err.message : 'Something went wrong') } finally { setBusy(false) }
  }
  const input = 'w-full rounded-lg border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900'
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onMouseDown={closeAuth}>
    <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl" onMouseDown={e => e.stopPropagation()} role="dialog" aria-modal>
      <div className="relative border-b border-neutral-200 py-4 text-center font-semibold">
        <button onClick={closeAuth} className="absolute left-4 top-3 rounded-full p-1.5 hover:bg-neutral-100" aria-label="Close"><X className="h-4 w-4" /></button>
        {signup ? 'Sign up' : 'Log in'}
      </div>
      <form onSubmit={submit} className="space-y-3 p-6">
        <h2 className="mb-4 text-xl font-semibold">Welcome to Nestly</h2>
        {signup && <input className={input} placeholder="Full name" required value={fullName} onChange={e => setFullName(e.target.value)} />}
        <input className={input} type="email" placeholder="Email" required value={email} onChange={e => setEmail(e.target.value)} />
        <input className={input} type="password" placeholder="Password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} />
        {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">{error}</p>}
        <button disabled={busy} className="w-full rounded-lg bg-brand py-3 font-semibold text-white hover:bg-brand-dark disabled:opacity-60">{busy ? 'Please wait…' : 'Continue'}</button>
        <p className="pt-2 text-center text-sm text-neutral-600">
          {signup ? 'Already have an account? ' : "Don't have an account? "}
          <button type="button" className="font-semibold underline" onClick={() => { setError(null); openAuth(signup ? 'login' : 'signup') }}>{signup ? 'Log in' : 'Sign up'}</button>
        </p>
      </form>
    </div>
  </div>
}
