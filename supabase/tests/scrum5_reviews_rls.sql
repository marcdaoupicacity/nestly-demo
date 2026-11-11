-- SCRUM-5 reviews RLS / trigger checks. Run as postgres (e.g. psql or SQL editor) after
-- applying 20261111120000_reviews.sql. Everything is rolled back.
begin;

-- Seed (as postgres): two users (profiles via on_auth_user_created trigger), one listing, bookings.
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'scrum5-a@test.local'),
  ('00000000-0000-0000-0000-0000000000b2', 'scrum5-b@test.local');
insert into public.profiles (id) values
  ('00000000-0000-0000-0000-0000000000a1'), ('00000000-0000-0000-0000-0000000000b2')
  on conflict (id) do nothing;

insert into public.listings (id, title, rating, review_count, base_rating, base_review_count)
values ('00000000-0000-0000-0000-00000000c001', 'SCRUM-5 test listing', 4.00, 10, 4.00, 10);

insert into public.bookings (id, listing_id, user_id, check_in, check_out, status) values
  ('00000000-0000-0000-0000-0000000d0001', '00000000-0000-0000-0000-00000000c001',
   '00000000-0000-0000-0000-0000000000a1', current_date - 10, current_date - 5, 'paid'),     -- paid past
  ('00000000-0000-0000-0000-0000000d0002', '00000000-0000-0000-0000-00000000c001',
   '00000000-0000-0000-0000-0000000000a1', current_date - 10, current_date - 5, 'pending'),  -- pending
  ('00000000-0000-0000-0000-0000000d0003', '00000000-0000-0000-0000-00000000c001',
   '00000000-0000-0000-0000-0000000000a1', current_date + 5, current_date + 10, 'paid');    -- paid future

-- Act as user B (non-owner)
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b2","role":"authenticated"}', true);

-- (a) non-owner cannot review user A's booking
do $$ begin
  begin
    insert into public.reviews (booking_id, listing_id, user_id, rating, comment)
    values ('00000000-0000-0000-0000-0000000d0001', '00000000-0000-0000-0000-00000000c001',
            '00000000-0000-0000-0000-0000000000b2', 5, 'Lovely place, would stay again for sure.');
    raise exception 'FAIL (a): non-owner insert succeeded';
  exception when insufficient_privilege then raise notice 'PASS (a)';
  end;
end $$;

-- Act as user A (owner)
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);

-- (b) pending booking
do $$ begin
  begin
    insert into public.reviews (booking_id, listing_id, user_id, rating, comment)
    values ('00000000-0000-0000-0000-0000000d0002', '00000000-0000-0000-0000-00000000c001',
            '00000000-0000-0000-0000-0000000000a1', 5, 'Lovely place, would stay again for sure.');
    raise exception 'FAIL (b): review on pending booking succeeded';
  exception when insufficient_privilege then raise notice 'PASS (b)';
  end;
end $$;

-- (c) future check_out
do $$ begin
  begin
    insert into public.reviews (booking_id, listing_id, user_id, rating, comment)
    values ('00000000-0000-0000-0000-0000000d0003', '00000000-0000-0000-0000-00000000c001',
            '00000000-0000-0000-0000-0000000000a1', 5, 'Lovely place, would stay again for sure.');
    raise exception 'FAIL (c): review on future stay succeeded';
  exception when insufficient_privilege then raise notice 'PASS (c)';
  end;
end $$;

-- valid insert (paid, past) must succeed
insert into public.reviews (booking_id, listing_id, user_id, rating, comment)
values ('00000000-0000-0000-0000-0000000d0001', '00000000-0000-0000-0000-00000000c001',
        '00000000-0000-0000-0000-0000000000a1', 5, 'Lovely place, would stay again for sure.');

-- (d) duplicate booking_id -> 23505
do $$ begin
  begin
    insert into public.reviews (booking_id, listing_id, user_id, rating, comment)
    values ('00000000-0000-0000-0000-0000000d0001', '00000000-0000-0000-0000-00000000c001',
            '00000000-0000-0000-0000-0000000000a1', 4, 'Second review attempt for same booking.');
    raise exception 'FAIL (d): duplicate review succeeded';
  exception when unique_violation then raise notice 'PASS (d)';
  end;
end $$;

-- (e) client cannot insert a paid booking (nor pending with stripe_session_id)
do $$ begin
  begin
    insert into public.bookings (listing_id, user_id, check_in, check_out, status)
    values ('00000000-0000-0000-0000-00000000c001', '00000000-0000-0000-0000-0000000000a1',
            current_date - 3, current_date - 1, 'paid');
    raise exception 'FAIL (e): client inserted paid booking';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.bookings (listing_id, user_id, check_in, check_out, status, stripe_session_id)
    values ('00000000-0000-0000-0000-00000000c001', '00000000-0000-0000-0000-0000000000a1',
            current_date + 3, current_date + 4, 'pending', 'cs_fake');
    raise exception 'FAIL (e): client inserted booking with stripe_session_id';
  exception when insufficient_privilege then null;
  end;
  -- plain pending insert is still allowed
  insert into public.bookings (listing_id, user_id, check_in, check_out, status)
  values ('00000000-0000-0000-0000-00000000c001', '00000000-0000-0000-0000-0000000000a1',
          current_date + 20, current_date + 22, 'pending');
  raise notice 'PASS (e)';
end $$;

-- (f) rating recompute: (4.00*10 + 5) / 11 = 4.09, count 11; after delete back to 4.00 / 10
reset role;
do $$ declare r numeric; c int; begin
  select rating, review_count into r, c from public.listings where id = '00000000-0000-0000-0000-00000000c001';
  if r is distinct from 4.09 or c is distinct from 11 then
    raise exception 'FAIL (f) after insert: rating=%, review_count=%', r, c;
  end if;
  delete from public.reviews where booking_id = '00000000-0000-0000-0000-0000000d0001';
  select rating, review_count into r, c from public.listings where id = '00000000-0000-0000-0000-00000000c001';
  if r is distinct from 4.00 or c is distinct from 10 then
    raise exception 'FAIL (f) after delete: rating=%, review_count=%', r, c;
  end if;
  raise notice 'PASS (f)';
end $$;

rollback;
