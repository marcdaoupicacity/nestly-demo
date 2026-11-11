# SCRUM-5 plan: Guest can leave a review after a completed stay
Spec: [spec.md](./spec.md) · Branch: `feat/SCRUM-5-guest-review-after-stay`

## Files to touch
| File | Change | WP |
|---|---|---|
| `supabase/migrations/20261111120000_reviews.sql` | new — exactly the SQL in spec.md "Data model changes" | WP1 |
| `supabase/tests/scrum5_reviews_rls.sql` | new — SQL checks for R3/R4/R5/R7 (run in a transaction, rolled back) | WP1 |
| `web/src/lib/types.ts` | `Review` type; `Booking.reviews?` | WP2 |
| `web/src/components/ReviewModal.tsx` | new — star picker, textarea + counter, validation, submit, error mapping (23505, 42501) | WP2 |
| `web/src/pages/Trips.tsx` | select `reviews(id, rating)`; button / chip / "Upcoming stay"; open modal; update row on submit | WP2 |
| `web/src/components/ReviewList.tsx` | new — header, 2-col grid, newest first, 6 then "Show all", empty state, skeleton | WP3 |
| `web/src/pages/ListingDetail.tsx` | render `<ReviewList>` after amenities; "N reviews" → `#reviews` | WP3 |
| `web/src/components/ListingCard.tsx` | "New" when no rating | WP3 |

## Work packages
- **Wave 1 (parallel, disjoint files):**
  - **WP1 — Database** (implementer A): write migration + SQL test file. Do NOT apply to any remote project (deploy stage does that).
  - **WP2 — Write path** (implementer B): types.ts, ReviewModal, Trips. Owns `types.ts`; WP3 imports `Review` from it (type shape fixed in spec).
  - **WP3 — Read path** (implementer C): ReviewList, ListingDetail, ListingCard.
- **Wave 2 (me):** integrate, `npm run build` + `npm run lint` in `web/`, run `code-reviewer`, fix blocking findings (max 2 rounds), commit, push, open PR.

## Steps and tests
1. WP1 migration → test: `scrum5_reviews_rls.sql` asserts (a) insert as non-owner fails, (b) pending booking fails, (c) future check_out fails, (d) duplicate booking_id → 23505, (e) client insert of `status='paid'` booking fails, (f) rating/review_count match formula after insert and delete. Executed in stage 4 against a Supabase branch / after deploy to preview DB.
2. WP2 → build + lint; E2E in stage 4: button visibility rules, validation errors, success toast, chip after submit.
3. WP3 → build + lint; E2E in stage 4: reviews order, "Show all", empty state, `#reviews` anchor, "New" label.
4. Integration → `npm run build && npm run lint` clean; code-reviewer APPROVE.

## Rollback
- Frontend: revert the PR merge commit; Vercel redeploys previous build (or promote previous deployment).
- Database: down-migration (not auto-run) —
  `drop trigger reviews_recompute, reviews_fill on reviews; drop table reviews; drop function recompute_listing_rating, reviews_fill_from_booking; update listings set rating = base_rating, review_count = base_review_count; alter table listings drop column base_rating, drop column base_review_count; drop policy "bookings insert own pending" on bookings; create policy "bookings insert own" on bookings for insert with check (auth.uid() = user_id);`
  (Restoring the old bookings policy reopens the loophole — prefer keeping R5.)

## Deploy targets
- `supabase-migrations`: `20261111120000_reviews.sql`
- `vercel`: `web/`
- `supabase-functions`: none
