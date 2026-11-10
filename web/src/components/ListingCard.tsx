import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Star } from 'lucide-react'
import type { Listing } from '../lib/types'
import HeartButton from './HeartButton'
export default function ListingCard({ listing }: { listing: Listing }) {
  const imgs = listing.images?.length ? listing.images : ['https://placehold.co/600x600?text=Nestly']
  const [i, setI] = useState(0)
  const go = (e: React.MouseEvent, d: number) => { e.preventDefault(); e.stopPropagation(); setI(v => (v + d + imgs.length) % imgs.length) }
  const arrow = 'absolute top-1/2 -translate-y-1/2 hidden h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow hover:scale-105 group-hover:flex'
  return <Link to={`/listings/${listing.id}`} className="group block">
    <div className="relative aspect-square overflow-hidden rounded-xl bg-neutral-100">
      <img src={imgs[i]} alt={listing.title} loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]" />
      <HeartButton listingId={listing.id} className="absolute right-3 top-3" />
      {imgs.length > 1 && <>
        {i > 0 && <button aria-label="Previous image" className={`${arrow} left-3`} onClick={e => go(e, -1)}><ChevronLeft className="h-4 w-4" /></button>}
        {i < imgs.length - 1 && <button aria-label="Next image" className={`${arrow} right-3`} onClick={e => go(e, 1)}><ChevronRight className="h-4 w-4" /></button>}
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1">
          {imgs.slice(0, 5).map((_, d) => <span key={d} className={`h-1.5 w-1.5 rounded-full ${d === Math.min(i, 4) ? 'bg-white' : 'bg-white/60'}`} />)}
        </div>
      </>}
    </div>
    <div className="mt-3 flex justify-between gap-2 text-[15px]">
      <h3 className="truncate font-semibold">{listing.location}, {listing.country}</h3>
      <span className="flex shrink-0 items-center gap-1"><Star className="h-3.5 w-3.5 fill-current" />{Number(listing.rating).toFixed(2)}</span>
    </div>
    <p className="truncate text-[15px] text-neutral-500">{listing.title}</p>
    <p className="mt-1 text-[15px]"><span className="font-semibold">${listing.price_per_night}</span> night</p>
  </Link>
}
export function ListingCardSkeleton() {
  return <div className="animate-pulse"><div className="aspect-square rounded-xl bg-neutral-200" /><div className="mt-3 h-4 w-3/4 rounded bg-neutral-200" /><div className="mt-2 h-4 w-1/2 rounded bg-neutral-200" /><div className="mt-2 h-4 w-1/3 rounded bg-neutral-200" /></div>
}
export const GRID = 'grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5'
