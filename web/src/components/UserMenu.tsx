import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, CircleUserRound } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
export default function UserMenu() {
  const { user, openAuth, signOut } = useAuth(); const [open, setOpen] = useState(false); const ref = useRef<HTMLDivElement>(null)
  useEffect(() => { const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }; document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h) }, [])
  const name = (user?.user_metadata?.full_name as string | undefined) ?? user?.email
  const item = 'block w-full px-4 py-3 text-left text-sm hover:bg-neutral-50'
  return <div className="relative" ref={ref}>
    <button onClick={() => setOpen(o => !o)} className="flex items-center gap-3 rounded-full border border-neutral-200 py-1.5 pl-3 pr-1.5 transition hover:shadow-md" aria-label="User menu">
      <Menu className="h-4 w-4" />
      {user ? <span className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-800 text-sm font-semibold text-white">{(name ?? '?')[0].toUpperCase()}</span> : <CircleUserRound className="h-8 w-8 text-neutral-500" />}
    </button>
    {open && <div className="absolute right-0 mt-2 w-60 overflow-hidden rounded-xl border border-neutral-100 bg-white py-2 shadow-xl" onClick={() => setOpen(false)}>
      {user ? <>
        <div className="truncate px-4 py-2 text-xs text-neutral-500">{name}</div>
        <Link to="/trips" className={`${item} font-semibold`}>Trips</Link>
        <Link to="/wishlists" className={`${item} font-semibold`}>Wishlists</Link>
        <hr className="my-2 border-neutral-100" />
        <button className={item} onClick={() => signOut()}>Log out</button>
      </> : <>
        <button className={`${item} font-semibold`} onClick={() => openAuth('signup')}>Sign up</button>
        <button className={item} onClick={() => openAuth('login')}>Log in</button>
      </>}
    </div>}
  </div>
}
