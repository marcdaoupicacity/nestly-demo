import { useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Search } from 'lucide-react'
export default function SearchBar() {
  const [params] = useSearchParams(); const nav = useNavigate()
  const [where, setWhere] = useState(params.get('where') ?? '')
  const [checkIn, setCheckIn] = useState(params.get('checkIn') ?? '')
  const [checkOut, setCheckOut] = useState(params.get('checkOut') ?? '')
  const [guests, setGuests] = useState(params.get('guests') ?? '')
  const submit = (e: FormEvent) => {
    e.preventDefault(); const p = new URLSearchParams()
    const cat = params.get('category'); if (cat) p.set('category', cat)
    if (where.trim()) p.set('where', where.trim()); if (checkIn) p.set('checkIn', checkIn); if (checkOut) p.set('checkOut', checkOut)
    if (guests && Number(guests) > 0) p.set('guests', guests)
    nav(`/?${p.toString()}`)
  }
  const cell = 'flex flex-col rounded-full px-5 py-2 hover:bg-neutral-100 text-left'
  const lbl = 'text-[11px] font-semibold'
  const inp = 'bg-transparent text-sm text-neutral-600 outline-none placeholder:text-neutral-400'
  return <form onSubmit={submit} className="flex w-full max-w-3xl items-center rounded-full border border-neutral-200 bg-white shadow-sm transition hover:shadow-md">
    <label className={`${cell} flex-[1.4]`}><span className={lbl}>Where</span><input className={inp} placeholder="Search destinations" value={where} onChange={e => setWhere(e.target.value)} /></label>
    <span className="hidden h-8 w-px bg-neutral-200 md:block" />
    <label className={`${cell} hidden flex-1 md:flex`}><span className={lbl}>Check in</span><input type="date" className={inp} value={checkIn} onChange={e => setCheckIn(e.target.value)} /></label>
    <span className="hidden h-8 w-px bg-neutral-200 md:block" />
    <label className={`${cell} hidden flex-1 md:flex`}><span className={lbl}>Check out</span><input type="date" className={inp} min={checkIn || undefined} value={checkOut} onChange={e => setCheckOut(e.target.value)} /></label>
    <span className="hidden h-8 w-px bg-neutral-200 sm:block" />
    <label className={`${cell} hidden flex-1 sm:flex`}><span className={lbl}>Who</span><input type="number" min={1} className={`${inp} w-24`} placeholder="Add guests" value={guests} onChange={e => setGuests(e.target.value)} /></label>
    <button type="submit" aria-label="Search" className="m-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-white hover:bg-brand-dark"><Search className="h-4 w-4" strokeWidth={3} /></button>
  </form>
}
