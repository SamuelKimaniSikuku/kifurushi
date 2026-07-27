-- Kifurushi production schema for Supabase (Postgres).
-- Every table has row-level security ON; users can only touch their own rows.
-- Run in the Supabase SQL editor, then wire the client via
-- NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY.

-- ============ PROFILES ============
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null check (char_length(full_name) between 2 and 80),
  phone text,
  id_verified boolean not null default false,
  rating numeric(2,1) not null default 5.0 check (rating between 0 and 5),
  deliveries_completed int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "profiles are viewable by authenticated users"
  on public.profiles for select to authenticated using (true);
create policy "users can insert their own profile"
  on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "users can update their own profile"
  on public.profiles for update to authenticated using (auth.uid() = id);
-- NOTE: id_verified / rating / deliveries_completed must only change via
-- security-definer functions or service-role jobs; revoke column updates:
revoke update (id_verified, rating, deliveries_completed) on public.profiles
  from authenticated;

-- ============ VERIFICATIONS (KYC outcomes only — never images) ============
-- ID/selfie images go browser -> KYC provider (Smile ID / Stripe Identity)
-- directly; we store only the provider's reference and result. The provider's
-- webhook (service role) writes the outcome and flips profiles.id_verified.
create table public.verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  provider text not null check (provider in ('smile_id','stripe_identity')),
  provider_ref text not null,        -- provider's session/job id
  phone text not null,
  id_type text not null check (id_type in ('passport','national_id','drivers_licence')),
  status text not null default 'pending' check (status in ('pending','verified','rejected')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
alter table public.verifications enable row level security;

create policy "users see their own verification"
  on public.verifications for select to authenticated using (auth.uid() = user_id);
create policy "users start their own verification"
  on public.verifications for insert to authenticated
  with check (auth.uid() = user_id and status = 'pending');
-- No UPDATE policy for clients: only the provider webhook (service role)
-- resolves a verification. It also sets profiles.id_verified = true on pass.

-- ============ TRIPS ============
create table public.trips (
  id uuid primary key default gen_random_uuid(),
  traveler_id uuid not null references public.profiles (id) on delete cascade,
  from_country char(2) not null,
  from_city text not null check (char_length(from_city) between 2 and 60),
  to_country char(2) not null,
  to_city text not null check (char_length(to_city) between 2 and 60),
  depart_date date not null check (depart_date >= current_date),
  space_kg numeric(4,1) not null check (space_kg between 0.5 and 46),
  price_per_kg numeric(6,2) not null check (price_per_kg between 1 and 100),
  notes text check (char_length(notes) <= 400),
  categories text[] not null default '{}',
  status text not null default 'open' check (status in ('open','closed')),
  created_at timestamptz not null default now(),
  check (from_country <> to_country)
);
alter table public.trips enable row level security;

create policy "open trips are viewable by authenticated users"
  on public.trips for select to authenticated using (true);
create policy "travelers manage their own trips"
  on public.trips for insert to authenticated with check (auth.uid() = traveler_id);
create policy "travelers update their own trips"
  on public.trips for update to authenticated using (auth.uid() = traveler_id);
create policy "travelers delete their own trips"
  on public.trips for delete to authenticated using (auth.uid() = traveler_id);

-- ============ PARCELS ============
create table public.parcels (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles (id) on delete cascade,
  from_country char(2) not null,
  from_city text not null check (char_length(from_city) between 2 and 60),
  to_country char(2) not null,
  to_city text not null check (char_length(to_city) between 2 and 60),
  needed_by date not null check (needed_by >= current_date),
  weight_kg numeric(4,1) not null check (weight_kg between 0.1 and 46),
  category text not null check (category in
    ('documents','clothing','electronics','food','medicine','gifts','books','other')),
  description text not null check (char_length(description) between 10 and 400),
  budget_usd numeric(7,2) not null check (budget_usd between 1 and 2000),
  status text not null default 'open' check (status in ('open','matched','closed')),
  created_at timestamptz not null default now(),
  check (from_country <> to_country)
);
alter table public.parcels enable row level security;

create policy "open parcels are viewable by authenticated users"
  on public.parcels for select to authenticated using (true);
create policy "senders manage their own parcels"
  on public.parcels for insert to authenticated with check (auth.uid() = sender_id);
create policy "senders update their own parcels"
  on public.parcels for update to authenticated using (auth.uid() = sender_id);
create policy "senders delete their own parcels"
  on public.parcels for delete to authenticated using (auth.uid() = sender_id);

-- ============ MATCHES (escrow state machine) ============
create table public.matches (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id),
  parcel_id uuid not null references public.parcels (id),
  status text not null default 'requested' check (status in
    ('requested','accepted','escrow_paid','picked_up','in_transit','delivered','released','disputed','cancelled')),
  delivery_code_hash text,          -- bcrypt hash of the one-time code; never store plaintext
  escrow_amount_usd numeric(7,2),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (trip_id, parcel_id)
);
alter table public.matches enable row level security;

-- Only the two parties to a match can see it.
create policy "match parties can view"
  on public.matches for select to authenticated using (
    auth.uid() in (
      (select traveler_id from public.trips t where t.id = trip_id),
      (select sender_id from public.parcels p where p.id = parcel_id)
    )
  );
create policy "either party can request a match"
  on public.matches for insert to authenticated with check (
    auth.uid() in (
      (select traveler_id from public.trips t where t.id = trip_id),
      (select sender_id from public.parcels p where p.id = parcel_id)
    )
  );
-- Status transitions ONLY via a security-definer function that enforces the
-- state machine (e.g. only the sender can fund escrow; only a valid delivery
-- code moves delivered -> released). No direct updates from clients:
-- (intentionally no UPDATE policy)

create or replace function public.advance_match(match_id uuid, supplied_code text default null)
returns public.matches
language plpgsql security definer set search_path = public
as $$
declare m public.matches;
begin
  select * into m from matches where id = match_id for update;
  if m is null then raise exception 'match not found'; end if;
  -- Enforce who may perform which transition; abbreviated example:
  if m.status = 'delivered' then
    if supplied_code is null or crypt(supplied_code, m.delivery_code_hash) <> m.delivery_code_hash then
      raise exception 'invalid delivery code';
    end if;
    update matches set status = 'released', updated_at = now() where id = match_id;
  end if;
  select * into m from matches where id = match_id;
  return m;
end $$;

-- ============ MESSAGES (masked until escrow) ============
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches (id) on delete cascade,
  sender_id uuid not null references public.profiles (id),
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);
alter table public.messages enable row level security;

create policy "match parties can read messages"
  on public.messages for select to authenticated using (
    exists (
      select 1 from public.matches m
      join public.trips t on t.id = m.trip_id
      join public.parcels p on p.id = m.parcel_id
      where m.id = match_id and auth.uid() in (t.traveler_id, p.sender_id)
    )
  );
create policy "match parties can send messages"
  on public.messages for insert to authenticated with check (
    auth.uid() = sender_id and exists (
      select 1 from public.matches m
      join public.trips t on t.id = m.trip_id
      join public.parcels p on p.id = m.parcel_id
      where m.id = match_id and auth.uid() in (t.traveler_id, p.sender_id)
    )
  );

-- ============ TRANSIT UPDATES (traveller journey log) ============
create table public.transit_updates (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches (id) on delete cascade,
  author_id uuid not null references public.profiles (id),
  note text not null check (char_length(note) between 3 and 200),
  created_at timestamptz not null default now()
);
alter table public.transit_updates enable row level security;

create policy "match parties can read transit updates"
  on public.transit_updates for select to authenticated using (
    exists (
      select 1 from public.matches m
      join public.trips t on t.id = m.trip_id
      join public.parcels p on p.id = m.parcel_id
      where m.id = match_id and auth.uid() in (t.traveler_id, p.sender_id)
    )
  );
-- Only the traveller may post, and only while the parcel is moving.
create policy "traveler posts updates while in transit"
  on public.transit_updates for insert to authenticated with check (
    auth.uid() = author_id and exists (
      select 1 from public.matches m
      join public.trips t on t.id = m.trip_id
      where m.id = match_id
        and t.traveler_id = auth.uid()
        and m.status in ('picked_up','in_transit')
    )
  );

-- ============ REVIEWS (after delivery, immutable) ============
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches (id),
  author_id uuid not null references public.profiles (id),
  subject_id uuid not null references public.profiles (id),
  rating int not null check (rating between 1 and 5),
  comment text check (char_length(comment) <= 300),
  created_at timestamptz not null default now(),
  unique (match_id, author_id)   -- one review per party per delivery
);
alter table public.reviews enable row level security;

create policy "reviews are public to authenticated users"
  on public.reviews for select to authenticated using (true);
-- Reviews only after the parcel was received, only by a party to the match,
-- and never about yourself.
create policy "match parties review received deliveries"
  on public.reviews for insert to authenticated with check (
    auth.uid() = author_id and auth.uid() <> subject_id and exists (
      select 1 from public.matches m
      join public.trips t on t.id = m.trip_id
      join public.parcels p on p.id = m.parcel_id
      where m.id = match_id
        and m.status in ('delivered','released')
        and auth.uid() in (t.traveler_id, p.sender_id)
        and subject_id in (t.traveler_id, p.sender_id)
    )
  );
-- No UPDATE/DELETE policies: reviews are immutable once posted.
-- profiles.rating is recomputed by a trigger, keeping it server-owned:
create or replace function public.refresh_rating() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update profiles set rating = (
    select round(avg(rating)::numeric, 1) from reviews where subject_id = new.subject_id
  ) where id = new.subject_id;
  return new;
end $$;
create trigger reviews_refresh_rating
  after insert on public.reviews
  for each row execute function public.refresh_rating();

-- Helpful indexes for corridor search
create index trips_route_idx on public.trips (from_country, to_country, depart_date);
create index parcels_route_idx on public.parcels (from_country, to_country, needed_by);
