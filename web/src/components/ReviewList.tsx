import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { Star } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { Review } from '../lib/types'
const PAGE = 6
const SELECT = 'id, rating, comment, created_at, profiles(full_name)'
const firstName = (r: Review) => r.profiles?.full_name?.trim().split(/\s+/)[0] || 'Guest'
export default function ReviewList({ listingId, rating, reviewCount }: { listingId: string; rating: number | null; reviewCount: number | null }) {
  const [reviews, setReviews] = useState<Review[] | null>(null); const [all, setAll] = useState(false); const [busy, setBusy] = useState(false); const [total, setTotal] = useState(0)
  useEffect(() => {
    let live = true
    supabase.from('reviews').select(SELECT, { count: 'exact' }).eq('listing_id', listingId).order('created_at', { ascending: false }).range(0, PAGE - 1)
      .then(({ data, count }) => { if (live) { setReviews((data ?? []) as unknown as Review[]); setTotal(count ?? 0); setAll(false) } })
    return () => { live = false }
  }, [listingId])
  const count = reviewCount ?? 0; const hasRating = !!rating && count > 0
  const showAll = async () => {
    setBusy(true)
    const { data } = await supabase.from('reviews').select(SELECT).eq('listing_id', listingId).order('created_at', { ascending: false }).range(PAGE, 9999)
    setReviews(r => [...(r ?? []), ...((data ?? []) as unknown as Review[])]); setAll(true); setBusy(false)
  }
  const fetched = reviews?.length ?? 0
  return <section id="reviews" className="scroll-mt-28 border-b border-neutral-200 py-8">
    <h2 className="mb-6 flex items-center gap-2 text-xl font-semibold"><Star className="h-5 w-5 fill-current" />{hasRating ? <>{Number(rating).toFixed(2)} · {count} review{count === 1 ? '' : 's'}</> : 'New'}</h2>
    {!reviews ? <div className="grid animate-pulse gap-8 sm:grid-cols-2">{Array.from({ length: 4 }, (_, i) => <div key={i}><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-full bg-neutral-200" /><div className="h-4 w-1/3 rounded bg-neutral-200" /></div><div className="mt-3 h-4 w-full rounded bg-neutral-200" /><div className="mt-2 h-4 w-2/3 rounded bg-neutral-200" /></div>)}</div>
      : !fetched ? <p className="text-neutral-600">No reviews yet</p>
      : <>
        <ul className="grid gap-8 sm:grid-cols-2">{reviews.map(r => { const name = firstName(r); return <li key={r.id}>
          <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-800 font-semibold text-white">{name[0].toUpperCase()}</span>
            <div><p className="font-semibold">{name}</p><p className="text-sm text-neutral-500">{format(new Date(r.created_at), 'MMMM yyyy')}</p></div></div>
          <div className="mt-2 flex gap-0.5" aria-label={`${r.rating} out of 5 stars`}>{Array.from({ length: 5 }, (_, i) => <Star key={i} className={`h-3 w-3 ${i < r.rating ? 'fill-current' : 'text-neutral-300'}`} />)}</div>
          <p className="mt-2 whitespace-pre-line leading-relaxed text-neutral-700">{r.comment}</p>
        </li> })}</ul>
        {!all && total > fetched && <button onClick={showAll} disabled={busy} className="mt-8 rounded-lg border border-neutral-900 px-6 py-3 font-semibold hover:bg-neutral-100 disabled:opacity-60">{busy ? 'Loading…' : `Show all ${total} reviews`}</button>}
      </>}
  </section>
}
