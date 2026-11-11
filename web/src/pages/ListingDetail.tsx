import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { format, addDays } from 'date-fns'
import { Star, Share, Heart, Check, MapPin, Users, BedDouble, Bath, DoorOpen } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { Listing } from '../lib/types'
import { nightsBetween, priceBreakdown, usd } from '../lib/pricing'
import { useAuth } from '../context/AuthContext'
import { useWishlist } from '../context/WishlistContext'
import { useToast } from '../context/ToastContext'
import ReviewList from '../components/ReviewList'
const fmt = (d: Date) => format(d, 'yyyy-MM-dd')
export default function ListingDetail() {
  const { id } = useParams<{ id: string }>(); const { user, openAuth } = useAuth(); const { ids, toggle } = useWishlist(); const toast = useToast()
  const [listing, setListing] = useState<Listing | null>(null); const [notFound, setNotFound] = useState(false)
  const today = fmt(new Date())
  const [checkIn, setCheckIn] = useState(fmt(addDays(new Date(), 7))); const [checkOut, setCheckOut] = useState(fmt(addDays(new Date(), 12)))
  const [guests, setGuests] = useState(1); const [busy, setBusy] = useState(false); const [err, setErr] = useState<string | null>(null)
  useEffect(() => {
    if (!id) return
    supabase.from('listings').select('*').eq('id', id).maybeSingle().then(({ data }) => { if (data) setListing(data as Listing); else setNotFound(true) })
  }, [id])
  if (notFound) return <div className="py-32 text-center text-lg">Listing not found.</div>
  if (!listing) return <div className="mx-auto max-w-6xl animate-pulse px-6 py-8"><div className="h-8 w-1/2 rounded bg-neutral-200" /><div className="mt-6 h-[420px] rounded-2xl bg-neutral-200" /></div>
  const nights = nightsBetween(checkIn, checkOut); const { subtotal, fee, total } = priceBreakdown(listing.price_per_night, nights)
  const saved = ids.has(listing.id); const imgs = [...listing.images, ...Array(5).fill('https://placehold.co/800x600?text=Nestly')].slice(0, 5)
  const share = async () => { try { await navigator.clipboard.writeText(window.location.href); toast('Link copied') } catch { toast('Could not copy link', 'error') } }
  const reserve = async () => {
    setErr(null); if (!user) { openAuth('login'); return }
    if (nights < 1) { setErr('Choose a check-out date after check-in.'); return }
    if (guests > listing.guests) { setErr(`This place allows up to ${listing.guests} guests.`); return }
    setBusy(true)
    const { data, error } = await supabase.functions.invoke<{ url: string }>('create-checkout', { body: { listing_id: listing.id, check_in: checkIn, check_out: checkOut, guests, origin: window.location.origin } })
    if (error || !data?.url) { setErr(error?.message ?? 'Could not start checkout'); setBusy(false); return }
    window.location.href = data.url
  }
  const osm = `https://www.openstreetmap.org/export/embed.html?bbox=${listing.lng - 0.05},${listing.lat - 0.03},${listing.lng + 0.05},${listing.lat + 0.03}&layer=mapnik&marker=${listing.lat},${listing.lng}`
  const dateInput = 'w-full bg-transparent text-sm outline-none'
  return <main className="mx-auto max-w-6xl px-4 py-6 sm:px-8">
    <h1 className="text-2xl font-semibold sm:text-3xl">{listing.title}</h1>
    <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm">
      <div className="flex items-center gap-1 font-medium"><Star className="h-4 w-4 fill-current" />{listing.rating ? Number(listing.rating).toFixed(2) : 'New'} · <a href="#reviews" className="underline">{listing.review_count ?? 0} reviews</a> · <span className="underline">{listing.location}, {listing.country}</span></div>
      <div className="flex gap-2">
        <button onClick={share} className="flex items-center gap-2 rounded-lg px-3 py-2 font-medium underline hover:bg-neutral-100"><Share className="h-4 w-4" />Share</button>
        <button onClick={() => toggle(listing.id)} className="flex items-center gap-2 rounded-lg px-3 py-2 font-medium underline hover:bg-neutral-100"><Heart className={`h-4 w-4 ${saved ? 'fill-brand text-brand' : ''}`} />{saved ? 'Saved' : 'Save'}</button>
      </div>
    </div>
    <div className="mt-6 grid h-[300px] grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-2xl sm:h-[440px]">
      {imgs.map((src, i) => <img key={i} src={src} alt="" className={`h-full w-full object-cover transition hover:brightness-90 ${i === 0 ? 'col-span-4 row-span-2 md:col-span-2' : 'hidden md:block'}`} />)}
    </div>
    <div className="mt-10 grid gap-12 md:grid-cols-[1fr_380px]">
      <div>
        <div className="flex items-center justify-between border-b border-neutral-200 pb-6">
          <div><h2 className="text-xl font-semibold">Entire home hosted by {listing.host_name}</h2>
            <p className="mt-1 flex flex-wrap gap-x-4 text-neutral-600"><span className="flex items-center gap-1"><Users className="h-4 w-4" />{listing.guests} guests</span><span className="flex items-center gap-1"><DoorOpen className="h-4 w-4" />{listing.bedrooms} bedrooms</span><span className="flex items-center gap-1"><BedDouble className="h-4 w-4" />{listing.beds} beds</span><span className="flex items-center gap-1"><Bath className="h-4 w-4" />{listing.baths} baths</span></p></div>
          <img src={listing.host_avatar} alt={listing.host_name} className="h-14 w-14 rounded-full bg-neutral-200 object-cover" />
        </div>
        <p className="whitespace-pre-line border-b border-neutral-200 py-8 leading-relaxed text-neutral-700">{listing.description}</p>
        <div className="border-b border-neutral-200 py-8"><h2 className="mb-4 text-xl font-semibold">What this place offers</h2>
          <ul className="grid gap-3 sm:grid-cols-2">{listing.amenities.map(a => <li key={a} className="flex items-center gap-3"><Check className="h-5 w-5" />{a}</li>)}</ul></div>
        <ReviewList listingId={listing.id} rating={listing.rating} reviewCount={listing.review_count} />
        <div className="py-8"><h2 className="mb-4 flex items-center gap-2 text-xl font-semibold"><MapPin className="h-5 w-5" />Where you'll be</h2>
          <iframe title="Map" src={osm} className="h-80 w-full rounded-2xl border-0" loading="lazy" />
          <p className="mt-3 font-medium">{listing.location}, {listing.country}</p></div>
      </div>
      <aside><div className="sticky top-28 rounded-2xl border border-neutral-200 p-6 shadow-xl">
        <p className="mb-4"><span className="text-2xl font-semibold">{usd(listing.price_per_night)}</span> night</p>
        <div className="overflow-hidden rounded-xl border border-neutral-400">
          <div className="grid grid-cols-2">
            <label className="border-r border-neutral-400 p-3"><span className="block text-[10px] font-bold uppercase">Check-in</span><input type="date" min={today} value={checkIn} onChange={e => setCheckIn(e.target.value)} className={dateInput} /></label>
            <label className="p-3"><span className="block text-[10px] font-bold uppercase">Checkout</span><input type="date" min={checkIn || today} value={checkOut} onChange={e => setCheckOut(e.target.value)} className={dateInput} /></label>
          </div>
          <label className="block border-t border-neutral-400 p-3"><span className="block text-[10px] font-bold uppercase">Guests</span>
            <select value={guests} onChange={e => setGuests(Number(e.target.value))} className={dateInput}>{Array.from({ length: listing.guests }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1} guest{i ? 's' : ''}</option>)}</select></label>
        </div>
        <button onClick={reserve} disabled={busy} className="mt-4 w-full rounded-lg bg-gradient-to-r from-brand to-pink-600 py-3.5 font-semibold text-white hover:brightness-95 disabled:opacity-60">{busy ? 'Redirecting…' : 'Reserve'}</button>
        {err && <p className="mt-3 text-sm text-rose-700" role="alert">{err}</p>}
        <p className="mt-3 text-center text-sm text-neutral-500">You won't be charged yet</p>
        {nights > 0 && <div className="mt-4 space-y-3 text-neutral-700">
          <div className="flex justify-between"><span className="underline">{usd(listing.price_per_night)} x {nights} night{nights > 1 ? 's' : ''}</span><span>{usd(subtotal)}</span></div>
          <div className="flex justify-between"><span className="underline">Nestly service fee</span><span>{usd(fee)}</span></div>
          <div className="flex justify-between border-t border-neutral-200 pt-4 font-semibold text-neutral-900"><span>Total</span><span>{usd(total)}</span></div>
        </div>}
      </div></aside>
    </div>
  </main>
}
