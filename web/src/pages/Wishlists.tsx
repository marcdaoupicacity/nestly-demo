import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Listing } from '../lib/types'
import { useAuth } from '../context/AuthContext'
import { useWishlist } from '../context/WishlistContext'
import ListingCard, { GRID, ListingCardSkeleton } from '../components/ListingCard'
import RequireAuth from './RequireAuth'
function Inner() {
  const { user } = useAuth(); const { ids } = useWishlist(); const [listings, setListings] = useState<Listing[] | null>(null)
  useEffect(() => {
    if (!user) return
    supabase.from('wishlists').select('listing_id, listings(*)').eq('user_id', user.id).then(({ data }) =>
      setListings(((data ?? []) as unknown as { listings: Listing | null }[]).map(r => r.listings).filter((l): l is Listing => !!l)))
  }, [user])
  const shown = listings?.filter(l => ids.has(l.id))
  return <main className="mx-auto max-w-[1760px] px-4 py-10 sm:px-8 xl:px-20">
    <h1 className="mb-8 text-3xl font-semibold">Wishlists</h1>
    {shown && shown.length === 0 ? <div><h2 className="text-xl font-semibold">Create your first wishlist</h2><p className="mt-2 text-neutral-600">As you search, tap the heart icon to save your favorite places.</p><Link to="/" className="mt-6 inline-block rounded-lg border border-neutral-900 px-5 py-3 font-semibold">Start exploring</Link></div>
      : <div className={GRID}>{shown ? shown.map(l => <ListingCard key={l.id} listing={l} />) : Array.from({ length: 5 }, (_, i) => <ListingCardSkeleton key={i} />)}</div>}
  </main>
}
export default function Wishlists() { return <RequireAuth title="Wishlists"><Inner /></RequireAuth> }
