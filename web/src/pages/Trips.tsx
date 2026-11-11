import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { supabase } from '../lib/supabase'
import type { Booking, BookingStatus } from '../lib/types'
import { usd } from '../lib/pricing'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import RequireAuth from './RequireAuth'
import ReviewModal from '../components/ReviewModal'
import { Star } from 'lucide-react'
const badge: Record<BookingStatus, string> = { paid: 'bg-emerald-100 text-emerald-800', pending: 'bg-amber-100 text-amber-800', cancelled: 'bg-neutral-200 text-neutral-600' }
const label: Record<BookingStatus, string> = { paid: 'Confirmed', pending: 'Pending payment', cancelled: 'Cancelled' }
// PostgREST returns a 1:1 embed (unique booking_id) as an object; normalise to the first review
const reviewOf = (b: Booking) => Array.isArray(b.reviews) ? b.reviews[0] : b.reviews
function TripsInner() {
  const { user } = useAuth(); const toast = useToast(); const [params, setParams] = useSearchParams()
  const [bookings, setBookings] = useState<Booking[] | null>(null); const confirmed = useRef(false)
  const [reviewing, setReviewing] = useState<Booking | null>(null); const [today] = useState(() => format(new Date(), 'yyyy-MM-dd'))
  useEffect(() => {
    if (!user) return
    const load = () => supabase.from('bookings').select('*, listings(*), reviews(id, rating)').eq('user_id', user.id).order('created_at', { ascending: false }).then(({ data }) => setBookings((data as Booking[]) ?? []))
    const bookingId = params.get('booking')
    if (params.get('success') === '1' && bookingId && !confirmed.current) {
      confirmed.current = true
      supabase.functions.invoke('confirm-booking', { body: { booking_id: bookingId } }).then(({ error }) => {
        if (error) toast('We could not confirm your payment yet. Refresh in a moment.', 'error'); else toast('Booking confirmed! Pack your bags.')
        setParams({}, { replace: true }); load()
      })
    } else if (params.get('canceled') === '1' || params.get('cancelled') === '1') { toast('Checkout cancelled', 'error'); setParams({}, { replace: true }); load() }
    else load()
  }, [user, params, setParams, toast])
  return <main className="mx-auto max-w-5xl px-4 py-10 sm:px-8">
    <h1 className="text-3xl font-semibold">Trips</h1>
    {!bookings ? <div className="mt-8 space-y-4">{[0, 1, 2].map(i => <div key={i} className="h-32 animate-pulse rounded-2xl bg-neutral-200" />)}</div>
      : bookings.length === 0 ? <div className="mt-8 border-y border-neutral-200 py-10"><h2 className="text-xl font-semibold">No trips booked...yet!</h2><p className="mt-2 text-neutral-600">Time to dust off your bags and start planning your next adventure.</p><Link to="/" className="mt-6 inline-block rounded-lg border border-neutral-900 px-5 py-3 font-semibold hover:bg-neutral-50">Start searching</Link></div>
      : <ul className="mt-8 space-y-4">{bookings.map(b => <li key={b.id}>
        <Link to={b.listings ? `/listings/${b.listing_id}` : '#'} className="flex gap-4 rounded-2xl border border-neutral-200 p-3 transition hover:shadow-md">
          <img src={b.listings?.images?.[0]} alt="" className="h-28 w-28 shrink-0 rounded-xl bg-neutral-200 object-cover sm:w-40" />
          <div className="flex min-w-0 flex-1 flex-col justify-between py-1">
            <div><div className="flex items-start justify-between gap-2"><h3 className="truncate font-semibold">{b.listings?.title ?? 'Listing'}</h3><span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${badge[b.status]}`}>{label[b.status]}</span></div>
              <p className="text-sm text-neutral-500">{b.listings ? `${b.listings.location}, ${b.listings.country}` : ''}</p></div>
            <p className="text-sm">{format(parseISO(b.check_in), 'MMM d')} – {format(parseISO(b.check_out), 'MMM d, yyyy')} · {b.guests} guest{b.guests > 1 ? 's' : ''} · <span className="font-semibold">{usd(b.total_price)}</span></p>
            {b.status === 'paid' && (() => {
              const r = reviewOf(b)
              if (r) return <span className="mt-1 inline-flex w-fit items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold">Reviewed <Star className="h-3 w-3 fill-current" />{r.rating}</span>
              if (b.check_out > today) return <p className="mt-1 text-sm text-neutral-500">Upcoming stay</p>
              return <button type="button" onClick={e => { e.preventDefault(); e.stopPropagation(); setReviewing(b) }} className="mt-1 w-fit rounded-lg border border-neutral-900 px-3 py-1.5 text-sm font-semibold hover:bg-neutral-50">Leave a review</button>
            })()}
          </div>
        </Link></li>)}</ul>}
    {reviewing && <ReviewModal booking={reviewing} onClose={() => setReviewing(null)} onSubmitted={r => { const id = reviewing.id; setBookings(bs => bs?.map(x => x.id === id ? { ...x, reviews: [r] } : x) ?? bs) }} />}
  </main>
}
export default function Trips() { return <RequireAuth title="Trips"><TripsInner /></RequireAuth> }
