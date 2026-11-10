export type Category = 'beach' | 'cabins' | 'amazing-views' | 'countryside' | 'lakefront' | 'tiny-homes' | 'mansions' | 'trending'
export interface Listing {
  id: string; title: string; description: string; location: string; country: string; category: Category
  price_per_night: number; guests: number; bedrooms: number; beds: number; baths: number
  rating: number; review_count: number; images: string[]; amenities: string[]
  host_name: string; host_avatar: string; lat: number; lng: number
}
export type BookingStatus = 'pending' | 'paid' | 'cancelled'
export interface Booking {
  id: string; listing_id: string; user_id: string; check_in: string; check_out: string; guests: number
  total_price: number; status: BookingStatus; stripe_session_id: string | null; created_at: string
  listings?: Listing | null
}
export interface Profile { id: string; full_name: string | null; avatar_url: string | null }
