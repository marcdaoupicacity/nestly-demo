# SCRUM-5: Guest can leave a review after a completed stay

## Problem
Nestly shows a rating and review count on every listing, but they are hardcoded seed values: there is no way for a guest to leave a review, and no reviews exist anywhere. Guests choosing a place have no real, verifiable feedback from people who stayed there, and hosts' ratings never change.

## Who is affected
- Guests who completed a paid stay (want to share feedback).
- Guests browsing listings (want trustworthy ratings and written reviews).

## Success criteria (measurable)
- [ ] SC1: On `/trips`, a "Leave a review" button appears only for bookings with `status = 'paid'` and `check_out <= today`, and only if that booking has no review yet.
- [ ] SC2: The review form requires a 1–5 star rating and a comment of at least 20 characters; invalid input shows an inline error and is not submitted.
- [ ] SC3: One review per booking, enforced in the database (unique `booking_id`); a second submit shows a friendly "already reviewed" message.
- [ ] SC4: The database rejects a review for a booking that is not the caller's own, not `paid`, or whose `check_out` is in the future (verified by SQL tests run as another user).
- [ ] SC5: `/listings/:id` shows the listing's reviews newest first (rating, comment, reviewer name, date); the "N reviews" link scrolls to them.
- [ ] SC6: After a review is submitted, the listing's `rating` and `review_count` update immediately (DB trigger) and are visible on the card and detail page.
- [ ] SC7: `npm run build` and `npm run lint` pass; Supabase security advisors report no new issues.

## Constraints
- Stack: React+Vite+Tailwind (web/), Supabase (supabase/), Stripe test mode, Vercel.
- Reviews are inserted by the client under RLS; no new edge function.
- **Security prerequisite (in scope):** the existing `bookings insert own` policy lets a guest insert a booking already marked `paid` with a past check-out, which would bypass the review gate. The migration must restrict client inserts to `status = 'pending'` (or drop the policy; only `create-checkout`, which uses the service role, inserts bookings).
- Seeded ratings must not be wiped: keep seed values as a baseline (`base_rating`, `base_review_count`) and combine them with real reviews (recommended option A).
- DECIDED (human, accepted): option A — seed baseline + real reviews.
- DECIDED (human, accepted): reviews are not editable/deletable in v1.

## Non-goals
- Host replies to reviews, review moderation, photos in reviews.
- Editing or deleting reviews.
- Fixing the missing Stripe webhook (bookings stuck in `pending`) — separate task.
- Double-booking prevention (SCRUM-9).

## Source
- Jira: [SCRUM-5](https://marc7182.atlassian.net/browse/SCRUM-5)

## Codebase notes
- Affected files: `web/src/pages/Trips.tsx` (button + form; row is a `<Link>`, so stopPropagation), `web/src/pages/ListingDetail.tsx` (reviews section after amenities, `#reviews` anchor on line 41), `web/src/lib/types.ts` (`Review` type), new `web/src/components/ReviewForm.tsx`, `ReviewList.tsx` (modal style from `AuthModal.tsx`).
- Data model: new `reviews` table (booking_id unique, listing_id, user_id → profiles, rating 1–5, comment ≥20 chars, created_at) with public-read + insert-after-completed-stay RLS; security-definer trigger recomputes `listings.rating/review_count`; `listings.base_rating/base_review_count` backfilled.
- Patterns: direct `supabase.from()` in `useEffect`, `useToast()` for errors, `bg-brand` buttons, `animate-pulse` skeletons, lucide icons.
- Risks: bookings insert policy hole (above); UTC vs local "today"; paid bookings stuck `pending` can't be reviewed; no automated tests exist.
- Likely deploy targets: supabase-migrations, vercel.
