create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz default now()
);

create table public.listings (
  id uuid primary key default gen_random_uuid(),
  title text, description text, location text, country text,
  category text check (category in ('beach','cabins','amazing-views','countryside','lakefront','tiny-homes','mansions','trending')),
  price_per_night integer, guests int, bedrooms int, beds int, baths numeric,
  rating numeric(3,2), review_count int, images text[], amenities text[],
  host_name text, host_avatar text, lat double precision, lng double precision,
  created_at timestamptz default now()
);
create index listings_category_idx on public.listings(category);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.listings on delete cascade,
  user_id uuid references auth.users on delete cascade,
  check_in date, check_out date, guests int, total_price integer,
  status text default 'pending' check (status in ('pending','paid','cancelled')),
  stripe_session_id text,
  created_at timestamptz default now()
);
create index bookings_user_idx on public.bookings(user_id);
create index bookings_listing_idx on public.bookings(listing_id);

create table public.wishlists (
  user_id uuid references auth.users on delete cascade,
  listing_id uuid references public.listings on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, listing_id)
);
create index wishlists_listing_idx on public.wishlists(listing_id);

alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.bookings enable row level security;
alter table public.wishlists enable row level security;

create policy "listings public read" on public.listings for select using (true);
create policy "profiles read all" on public.profiles for select using (true);
create policy "profiles update own" on public.profiles for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "bookings select own" on public.bookings for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "bookings insert own" on public.bookings for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "wishlists own" on public.wishlists for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end; $$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
