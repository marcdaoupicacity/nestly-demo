import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
interface Ctx { ids: Set<string>; toggle: (listingId: string) => Promise<void> }
const WishlistContext = createContext<Ctx | null>(null)
export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user, openAuth } = useAuth()
  const [ids, setIds] = useState<Set<string>>(new Set())
  useEffect(() => {
    if (!user) { setIds(new Set()); return }
    supabase.from('wishlists').select('listing_id').eq('user_id', user.id).then(({ data }) => setIds(new Set((data ?? []).map((r: { listing_id: string }) => r.listing_id))))
  }, [user])
  const toggle = useCallback(async (listingId: string) => {
    if (!user) { openAuth('login'); return }
    const has = ids.has(listingId)
    setIds(prev => { const n = new Set(prev); if (has) n.delete(listingId); else n.add(listingId); return n })
    const { error } = has
      ? await supabase.from('wishlists').delete().eq('user_id', user.id).eq('listing_id', listingId)
      : await supabase.from('wishlists').insert({ user_id: user.id, listing_id: listingId })
    if (error) setIds(prev => { const n = new Set(prev); if (has) n.add(listingId); else n.delete(listingId); return n })
  }, [user, ids, openAuth])
  return <WishlistContext.Provider value={{ ids, toggle }}>{children}</WishlistContext.Provider>
}
// eslint-disable-next-line react-refresh/only-export-components
export function useWishlist() { const c = useContext(WishlistContext); if (!c) throw new Error('useWishlist outside provider'); return c }
