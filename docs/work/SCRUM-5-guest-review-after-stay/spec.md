# SCRUM-5 spec: Guest can leave a review after a completed stay
Intent: [intent.md](./intent.md) · Jira: [SCRUM-5](https://marc7182.atlassian.net/browse/SCRUM-5) · Figma: https://www.figma.com/design/d3FvJD9PjvxRRUqAnxD5c0

## Requirements
| ID | Requirement | Traces to |
|----|-------------|-----------|
| R1 | `/trips` loads bookings with their review (`reviews(id, rating)`); shows "Leave a review" only when `status='paid'`, `check_out <= today` (local date) and no review; shows "Reviewed ★N" chip if reviewed; "Upcoming stay" text if check_out in future | SC1 |
| R2 | Review modal: 1–5 star picker (required), comment textarea with live counter, submit disabled until rating set and comment ≥ 20 chars (trimmed); inline rose error on invalid submit; "Submitting…" disabled state; success toast "Thanks! Your review is live." and row switches to chip | SC2 |
| R3 | `reviews.booking_id` UNIQUE; on Postgres 23505 show "You've already reviewed this stay." | SC3 |
| R4 | RLS insert policy: caller owns booking, booking `paid`, `check_out <= current_date`, listing matches; BEFORE INSERT trigger forces `listing_id`/`user_id` from the booking | SC4 |
| R5 | Tighten `bookings insert own` policy to `status='pending' and stripe_session_id is null` so guests cannot self-create paid bookings | SC4 |
| R6 | Listing detail `#reviews` section below amenities: header "★ 4.83 · 278 reviews" (or "★ New" when 0), 2-column card grid (initial avatar, first name, "Month YYYY", stars, comment), newest first, first 6 then "Show all N reviews" loads the rest; empty state "No reviews yet"; header "N reviews" link scrolls to `#reviews` | SC5 |
| R7 | AFTER INSERT/DELETE trigger recomputes `listings.review_count = base_review_count + count`, `rating = round((base_rating*base_review_count + sum)/nullif(review_count,0),2)` | SC6 |
| R8 | ListingCard / detail show "New" instead of "0.00" when rating is null/0 | SC6 |
| R9 | build + lint pass; `get_advisors` security shows no new findings | SC7 |

## UI design
Direction: **A — inline Trips button + centred modal (AuthModal style; bottom sheet at 390px)**, reviews as a 2-column grid on the listing. Reuses existing patterns, no new route. Alternatives considered: B separate `/trips/:id/review` page (extra route, no full-page forms in app); C inline expanding row form (messy rows, bad on mobile).

| Screen / state | Node id | Link |
|---|---|---|
| Trips / default (3 row states) | 2:2 | https://www.figma.com/design/d3FvJD9PjvxRRUqAnxD5c0?node-id=2-2 |
| Review modal / default | 2:52 | https://www.figma.com/design/d3FvJD9PjvxRRUqAnxD5c0?node-id=2-52 |
| Review modal / validation error | 2:84 | https://www.figma.com/design/d3FvJD9PjvxRRUqAnxD5c0?node-id=2-84 |
| Review modal / submitting | 2:119 | https://www.figma.com/design/d3FvJD9PjvxRRUqAnxD5c0?node-id=2-119 |
| Review modal / success toast | 2:151 | https://www.figma.com/design/d3FvJD9PjvxRRUqAnxD5c0?node-id=2-151 |
| Listing detail / reviews | 2:157 | https://www.figma.com/design/d3FvJD9PjvxRRUqAnxD5c0?node-id=2-157 |
| Listing detail / reviews empty | 2:234 | https://www.figma.com/design/d3FvJD9PjvxRRUqAnxD5c0?node-id=2-234 |
| Review modal mobile / default | 2:253 | https://www.figma.com/design/d3FvJD9PjvxRRUqAnxD5c0?node-id=2-253 |
| Review modal mobile / validation error | 2:285 | https://www.figma.com/design/d3FvJD9PjvxRRUqAnxD5c0?node-id=2-285 |

Implementation notes: Figma uses Unicode ★/✓/✕ and grey photo placeholders — use lucide `Star`, `Check`, `X` and real listing images. Tokens: brand #e11d48/#be123c, rounded-lg buttons/inputs, rounded-2xl modal/rows, rose-50 error box.

## Interfaces & APIs
- `web/src/lib/types.ts`: `Review { id; booking_id; listing_id; user_id; rating: number; comment: string; created_at: string; profiles?: { full_name: string | null } }`; `Booking.reviews?: { id: string; rating: number }[]`.
- `web/src/components/ReviewModal.tsx`: props `{ booking: Booking; onClose(): void; onSubmitted(r: { id: string; rating: number }): void }`. Insert: `supabase.from('reviews').insert({ booking_id, listing_id, user_id, rating, comment }).select('id, rating').single()`.
- `web/src/components/ReviewList.tsx`: props `{ listingId: string; rating: number | null; reviewCount: number | null }`. Query: `supabase.from('reviews').select('id, rating, comment, created_at, profiles(full_name)').eq('listing_id', id).order('created_at', { ascending: false }).range(0, 5)` then "Show all" fetches the rest.
- `web/src/pages/Trips.tsx`: select `'*, listings(*), reviews(id, rating)'`; button inside the row `<Link>` must `preventDefault()` + `stopPropagation()`; local date via `format(new Date(), 'yyyy-MM-dd')` compared to `check_out`.
- `web/src/pages/ListingDetail.tsx`: render `<ReviewList>` after amenities; "N reviews" becomes `<a href="#reviews">`.
- `web/src/components/ListingCard.tsx`: "New" when `!rating`.
- Edge functions: none.

## Data model changes
`supabase/migrations/20261111120000_reviews.sql`
```sql
-- baseline for seeded ratings (decision: option A)
alter table public.listings
  add column base_rating numeric(3,2) not null default 0,
  add column base_review_count int not null default 0;
update public.listings set base_rating = coalesce(rating,0), base_review_count = coalesce(review_count,0);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings on delete cascade,
  listing_id uuid not null references public.listings on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text not null check (char_length(btrim(comment)) between 20 and 2000),
  created_at timestamptz not null default now()
);
create index reviews_listing_created_idx on public.reviews (listing_id, created_at desc);
alter table public.reviews enable row level security;
create policy "reviews public read" on public.reviews for select using (true);
create policy "reviews insert after completed stay" on public.reviews for insert to authenticated
  with check ((select auth.uid()) = user_id and exists (
    select 1 from public.bookings b where b.id = booking_id and b.user_id = (select auth.uid())
      and b.listing_id = reviews.listing_id and b.status = 'paid' and b.check_out <= current_date));
-- no update/delete policies (decision: not editable in v1)

-- force listing_id/user_id from the booking
create function public.reviews_fill_from_booking() returns trigger language plpgsql set search_path = '' as $$
begin
  select b.listing_id, b.user_id into new.listing_id, new.user_id from public.bookings b where b.id = new.booking_id;
  return new;
end $$;
create trigger reviews_fill before insert on public.reviews for each row execute function public.reviews_fill_from_booking();

-- recompute listing rating
create function public.recompute_listing_rating() returns trigger language plpgsql security definer set search_path = '' as $$
declare lid uuid := coalesce(new.listing_id, old.listing_id);
begin
  update public.listings l set
    review_count = l.base_review_count + s.cnt,
    rating = case when l.base_review_count + s.cnt = 0 then null
             else round((l.base_rating*l.base_review_count + s.total)::numeric / (l.base_review_count + s.cnt), 2) end
  from (select count(*) cnt, coalesce(sum(rating),0) total from public.reviews where listing_id = lid) s
  where l.id = lid;
  return null;
end $$;
revoke execute on function public.recompute_listing_rating() from public, anon, authenticated;
create trigger reviews_recompute after insert or delete on public.reviews for each row execute function public.recompute_listing_rating();

-- R5: close the paid-booking loophole
drop policy "bookings insert own" on public.bookings;
create policy "bookings insert own pending" on public.bookings for insert to authenticated
  with check ((select auth.uid()) = user_id and status = 'pending' and stripe_session_id is null);
```
Note: the RLS subquery on `bookings` runs under the caller's RLS ("select own"), which is the intended restriction. The fill trigger runs before RLS `with check`, so the policy validates the forced values.

## Edge cases
- Stay ending today: client uses local date, DB uses UTC `current_date` → near midnight the button may show but insert fails; show "You can review this stay from tomorrow" on RLS error (42501).
- Paid bookings stuck `pending` (no webhook) cannot be reviewed — known, out of scope.
- Duplicate submit / double click → 23505 message; button disabled while submitting.
- Several stays at the same listing → one review per booking, all allowed.
- Booking/listing deleted → cascade + DELETE trigger keeps counts correct.
- Profile with null `full_name` → show "Guest".
- Logged-out visitors see reviews, never the form.

## Risks
- Migration drops/recreates a bookings policy — `create-checkout` uses the service role and is unaffected; verify checkout still works in preview.
- `security definer` function — mitigated by `search_path = ''` and revoked execute.
- No automated tests exist — mitigated by SQL RLS checks + Playwright E2E.

## Test strategy
| Req | Test type | What it asserts |
|---|---|---|
| R1 | Playwright E2E | button visible only on paid+past booking without review; chip after review |
| R2 | Playwright E2E | <20 chars / no rating blocks submit with inline error; success toast |
| R3 | SQL + E2E | second insert for same booking → 23505 → friendly message |
| R4 | SQL (as another user, pending booking, future check_out) | each insert rejected by RLS |
| R5 | SQL | client insert of `status='paid'` booking rejected; checkout flow still creates pending booking |
| R6 | Playwright E2E | reviews newest first, 6 then "Show all", empty state, #reviews anchor |
| R7 | SQL | after insert/delete, rating/review_count match formula |
| R8 | Visual/E2E | "New" shown when no rating |
| R9 | CI commands | `npm run build`, `npm run lint`, Supabase advisors |

## Decisions / Open questions
- DECIDED: seeded ratings kept as baseline (option A); reviews not editable/deletable in v1.
- DECIDED (designer defaults): "★ New" when no reviews; reviewer shown as first name + month/year; 6 reviews then "Show all".
- Figma file lives in the personal "Marc Daou" Figma plan.

Traceability: all SCs covered ✅ (SC1 R1 · SC2 R2 · SC3 R3 · SC4 R4,R5 · SC5 R6 · SC6 R7,R8 · SC7 R9)
