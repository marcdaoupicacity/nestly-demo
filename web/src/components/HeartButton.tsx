import { Heart } from 'lucide-react'
import { useWishlist } from '../context/WishlistContext'
export default function HeartButton({ listingId, className = '' }: { listingId: string; className?: string }) {
  const { ids, toggle } = useWishlist(); const on = ids.has(listingId)
  return <button aria-label={on ? 'Remove from wishlist' : 'Save to wishlist'} onClick={e => { e.preventDefault(); e.stopPropagation(); void toggle(listingId) }} className={`transition active:scale-90 ${className}`}>
    <Heart className={`h-6 w-6 drop-shadow ${on ? 'fill-brand text-brand' : 'fill-black/40 text-white'}`} strokeWidth={2} />
  </button>
}
