import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Listing } from '../lib/types'
import CategoryBar from '../components/CategoryBar'
import ListingCard, { GRID, ListingCardSkeleton } from '../components/ListingCard'
export default function Home() {
  const [params, setParams] = useSearchParams()
  const category = params.get('category'); const where = params.get('where'); const guests = Number(params.get('guests') || 0)
  const [listings, setListings] = useState<Listing[] | null>(null); const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    let cancel = false; setListings(null); setError(null)
    let q = supabase.from('listings').select('*').order('rating', { ascending: false })
    if (category) q = q.eq('category', category)
    if (where) { const s = where.replace(/[%,()]/g, ' '); q = q.or(`location.ilike.%${s}%,country.ilike.%${s}%,title.ilike.%${s}%`) }
    if (guests > 0) q = q.gte('guests', guests)
    q.then(({ data, error }) => { if (cancel) return; if (error) setError(error.message); setListings((data as Listing[]) ?? []) })
    return () => { cancel = true }
  }, [category, where, guests])
  return <>
    <CategoryBar />
    <main className="mx-auto max-w-[1760px] px-4 pt-8 sm:px-8 xl:px-20">
      {error && <p className="mb-6 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">Couldn't load listings: {error}</p>}
      {listings && listings.length === 0 && !error ? <div className="py-24 text-center">
        <h2 className="text-xl font-semibold">No exact matches</h2>
        <p className="mt-2 text-neutral-500">Try changing or removing some of your filters.</p>
        <button onClick={() => setParams({})} className="mt-6 rounded-lg border border-neutral-900 px-5 py-2.5 font-semibold hover:bg-neutral-50">Remove all filters</button>
      </div> : <div className={GRID}>
        {listings ? listings.map(l => <ListingCard key={l.id} listing={l} />) : Array.from({ length: 10 }, (_, i) => <ListingCardSkeleton key={i} />)}
      </div>}
    </main>
  </>
}
