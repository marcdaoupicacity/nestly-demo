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
