import { useState, type FormEvent } from 'react'
import { Star, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { Booking } from '../lib/types'
import { useToast } from '../context/ToastContext'
const MIN = 20, MAX = 2000
export default function ReviewModal({ booking, onClose, onSubmitted }: { booking: Booking; onClose(): void; onSubmitted(r: { id: string; rating: number }): void }) {
  const toast = useToast()
  const [rating, setRating] = useState(0); const [hover, setHover] = useState(0); const [comment, setComment] = useState('')
  const [error, setError] = useState<string | null>(null); const [busy, setBusy] = useState(false)
  const len = comment.trim().length; const valid = rating > 0 && len >= MIN
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setError(null)
    if (!rating) return setError('Please choose a star rating.')
    if (len < MIN) return setError(`Please write at least ${MIN} characters.`)
    setBusy(true)
    const { data, error } = await supabase.from('reviews').insert({ booking_id: booking.id, listing_id: booking.listing_id, user_id: booking.user_id, rating, comment: comment.trim() }).select('id, rating').single()
    setBusy(false)
    if (error) {
      setError(error.code === '23505' ? "You've already reviewed this stay." : error.code === '42501' ? 'You can review this stay from tomorrow.' : error.message || 'Something went wrong')
      return
    }
    toast('Thanks! Your review is live.'); onSubmitted(data as { id: string; rating: number }); onClose()
  }
  const shown = hover || rating
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4" onMouseDown={onClose}>
    <div className="w-full max-w-md rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl" onMouseDown={e => e.stopPropagation()} role="dialog" aria-modal aria-labelledby="review-title">
      <div className="relative border-b border-neutral-200 py-4 text-center font-semibold">
        <button onClick={onClose} className="absolute left-4 top-3 rounded-full p-1.5 hover:bg-neutral-100" aria-label="Close"><X className="h-4 w-4" /></button>
        <span id="review-title">Leave a review</span>
      </div>
      <form onSubmit={submit} className="space-y-4 p-6">
        <div><h2 className="text-xl font-semibold">How was your stay?</h2><p className="text-sm text-neutral-500">{booking.listings?.title ?? 'Listing'}</p></div>
        <div className="flex gap-1" onMouseLeave={() => setHover(0)} role="radiogroup" aria-label="Rating">
          {[1, 2, 3, 4, 5].map(n => <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} star${n > 1 ? 's' : ''}`} onMouseEnter={() => setHover(n)} onClick={() => { setRating(n); setError(null) }} className="rounded p-0.5">
            <Star className={`h-8 w-8 ${n <= shown ? 'fill-brand text-brand' : 'text-neutral-300'}`} /></button>)}
        </div>
        <div>
          <textarea className="h-32 w-full resize-none rounded-lg border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900" placeholder="Share what you loved and what could be better…" maxLength={MAX} value={comment} onChange={e => setComment(e.target.value)} aria-label="Comment" />
          <p className={`mt-1 text-right text-xs ${len < MIN ? 'text-neutral-500' : 'text-emerald-700'}`}>{len}/{MAX}{len < MIN ? ` · min ${MIN}` : ''}</p>
        </div>
        {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">{error}</p>}
        <button disabled={busy || !valid} className="w-full rounded-lg bg-brand py-3 font-semibold text-white hover:bg-brand-dark disabled:opacity-60">{busy ? 'Submitting…' : 'Submit review'}</button>
      </form>
    </div>
  </div>
}
