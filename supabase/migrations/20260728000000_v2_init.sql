-- ============================================================================
-- Kifurushi v2 schema — production migration
-- 20260728000000_v2_init.sql
--
-- Replaces the v1 draft (supabase/schema.sql) wholesale. The target database
-- contains only EMPTY v1 tables, so we drop everything and rebuild. This file
-- is safe to run on a completely fresh database (every drop is `if exists`).
--
-- Design sources:
--   * lib/types.ts        — MatchStatus keys are kept verbatim (STATUS_ORDER)
--   * lib/validation.ts   — SQL CHECKs mirror the zod ranges
--   * schema-parity audit — RLS/grant fixes (anon browsing, phone leak,
--                           column-grant no-op, membership enforcement,
--                           delivery-code lifecycle + brute-force lockout)
-- ============================================================================


-- ============================================================================
-- 0. EXTENSIONS
-- ============================================================================
create extension if not exists pgcrypto;
create extension if not exists moddatetime schema extensions;


-- ============================================================================
-- 1. DROP ALL v1 OBJECTS
-- Tables are dropped with cascade, which also removes their policies,
-- triggers, and indexes. Order is children-first out of politeness; cascade
-- would cope regardless. Everything is `if exists` so a fresh DB is fine.
-- ============================================================================

-- v1 trigger on auth.users (if a profile-creation trigger was ever installed)
drop trigger if exists on_auth_user_created on auth.users;

-- v1 / draft tables
drop table if exists public.parcel_contacts   cascade;
drop table if exists public.subscription_events cascade;
drop table if exists public.ratings           cascade;
drop table if exists public.bookings          cascade;
drop table if exists public.messages          cascade;
drop table if exists public.transit_updates   cascade;
drop table if exists public.reviews           cascade;
drop table if exists public.matches           cascade;
drop table if exists public.verifications     cascade;
drop table if exists public.memberships       cascade;
drop table if exists public.private_contacts  cascade;
drop table if exists public.parcels           cascade;
drop table if exists public.trips             cascade;
drop table if exists public.profiles          cascade;

-- v1 / draft functions (any signature that may have existed)
drop function if exists public.advance_match(uuid, text);
drop function if exists public.advance_match(uuid);
drop function if exists public.respond_match(uuid, boolean);
drop function if exists public.generate_delivery_code(uuid);
drop function if exists public.confirm_delivery(uuid, text);
drop function if exists public.cancel_match(uuid);
drop function if exists public.refresh_rating() cascade;
drop function if exists public.handle_new_user() cascade;
drop function if exists public.is_active_member(uuid);
drop function if exists public.is_match_party(uuid, uuid);
drop function if exists public.match_counterparty(uuid, uuid);
drop function if exists public.check_trip_depart_date() cascade;
drop function if exists public.check_parcel_needed_by() cascade;


-- ============================================================================
-- 2. PROFILES
-- Public trust data only. NO phone column here — the v1 schema leaked phone
-- to every authenticated user; contact details now live in private_contacts.
-- rating is NULL until the first review lands; the app renders
-- "New traveller" for null rating / zero deliveries.
-- ============================================================================
create table public.profiles (
  id                    uuid primary key references auth.users (id) on delete cascade,
  full_name             text not null check (char_length(full_name) between 2 and 80),
  id_verified           boolean not null default false,
  rating                numeric(2,1) check (rating between 0 and 5),  -- null until first review
  deliveries_completed  int not null default 0,
  created_at            timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Profile rows are created by a trigger on auth.users, never by the client.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
begin
  -- Prefer the name captured at sign-up; fall back to the email local part.
  v_name := nullif(trim(coalesce(new.raw_user_meta_data->>'full_name', '')), '');
  if v_name is null or char_length(v_name) < 2 then
    v_name := nullif(trim(split_part(coalesce(new.email, ''), '@', 1)), '');
  end if;
  if v_name is null or char_length(v_name) < 2 then
    v_name := 'New member';
  end if;

  insert into public.profiles (id, full_name)
  values (new.id, left(v_name, 80));

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- GRANTS: the v1 draft used `revoke update (col, ...)` which is a NO-OP under
-- Supabase's table-level GRANT ALL (column revokes only remove column-level
-- grants). Correct order: revoke the TABLE update, then grant back only the
-- safe column. id_verified / rating / deliveries_completed become
-- server-owned (webhooks, triggers, RPCs — all run as owner/service role).
-- ---------------------------------------------------------------------------
revoke update on public.profiles from authenticated;
grant update (full_name) on public.profiles to authenticated;
-- Clients never insert or delete profiles (the auth trigger owns inserts,
-- deleting the auth user cascades).
revoke insert, delete on public.profiles from authenticated;

-- RLS: public profiles power listing cards and the /people pages, so
-- signed-out visitors must be able to read them (the free tier's promise).
create policy "profiles are publicly readable"
  on public.profiles for select
  to anon, authenticated
  using (true);

create policy "users update their own profile"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());
-- No INSERT/DELETE policies: blocked for clients.


-- ============================================================================
-- 3. PRIVATE_CONTACTS
-- Owner-only contact details (fixes the v1 phone-leak: profiles.phone was
-- readable by every authenticated user). Sharing a phone number with a match
-- counterparty, when built, goes through a security-definer RPC — not RLS.
-- ============================================================================
create table public.private_contacts (
  user_id     uuid primary key references public.profiles (id) on delete cascade,
  phone       text,
  created_at  timestamptz not null default now()
);

alter table public.private_contacts enable row level security;

create policy "owners manage their own contact details"
  on public.private_contacts for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());


-- ============================================================================
-- 4. MEMBERSHIPS
-- Server-side enforcement of the paid gate ($5/mo, $29/yr). The v1 schema had
-- no membership model at all, so the paywall was client-only and bypassable
-- via PostgREST. is_active_member() is required by the trips/parcels/matches/
-- messages INSERT policies below.
-- ============================================================================
create table public.memberships (
  user_id             uuid primary key references public.profiles (id) on delete cascade,
  status              text not null check (status in ('active','canceled','past_due')),
  plan                text not null check (plan in ('monthly','yearly')),
  current_period_end  timestamptz not null,
  provider            text not null default 'beta',
  provider_ref        text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create trigger memberships_set_updated_at
  before update on public.memberships
  for each row execute function extensions.moddatetime (updated_at);

alter table public.memberships enable row level security;

-- Membership check used inside policies and RPCs.
create or replace function public.is_active_member(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from memberships
    where user_id = uid
      and status = 'active'
      and current_period_end > now()
  );
$$;

create policy "users read their own membership"
  on public.memberships for select
  to authenticated
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- !!! TEMPORARY BETA POLICY — DROP BEFORE REAL BILLING GOES LIVE !!!
-- During the beta there is no payment provider, so users may grant themselves
-- a membership capped at one year. When the billing webhook (service role)
-- takes over as the only writer, run:
--   drop policy "BETA ONLY - users self-enroll" on public.memberships;
--   drop policy "BETA ONLY - users update their beta membership" on public.memberships;
-- ---------------------------------------------------------------------------
create policy "BETA ONLY - users self-enroll"
  on public.memberships for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and provider = 'beta'
    and current_period_end <= now() + interval '1 year'
  );

-- !!! TEMPORARY BETA POLICY — see sunset note above. Only rows still marked
-- provider='beta' can be touched, and never extended past one year out.
create policy "BETA ONLY - users update their beta membership"
  on public.memberships for update
  to authenticated
  using (user_id = auth.uid() and provider = 'beta')
  with check (
    user_id = auth.uid()
    and provider = 'beta'
    and current_period_end <= now() + interval '1 year'
  );
-- No DELETE policy: cancellation is a status change, history is kept.


-- ============================================================================
-- 5. TRIPS
-- Ranges mirror lib/validation.ts tripSchema. NOTE: v1 had a
-- `depart_date >= current_date` CHECK — CHECKs re-run on every UPDATE, so the
-- day after departure the traveller could no longer close their own trip.
-- Future-dating is enforced at INSERT time only, via trigger.
-- ============================================================================
create table public.trips (
  id            uuid primary key default gen_random_uuid(),
  traveler_id   uuid not null references public.profiles (id) on delete cascade,
  from_country  char(2) not null,
  from_city     text not null check (char_length(from_city) between 2 and 60),
  to_country    char(2) not null,
  to_city       text not null check (char_length(to_city) between 2 and 60),
  depart_date   date not null,
  space_kg      numeric(4,1) not null check (space_kg between 0.5 and 46),
  price_per_kg  numeric(6,2) not null check (price_per_kg between 1 and 100),
  notes         text check (char_length(notes) <= 400),
  categories    text[] not null check (
    categories <> '{}'
    and categories <@ array['documents','clothing','electronics','food','medicine','gifts','books','other']::text[]
  ),
  status        text not null default 'open' check (status in ('open','closed')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  check (from_country <> to_country)
);

create or replace function public.check_trip_depart_date()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.depart_date < current_date then
    raise exception 'depart_date must be today or later';
  end if;
  return new;
end;
$$;

create trigger trips_depart_date_future
  before insert on public.trips
  for each row execute function public.check_trip_depart_date();

create trigger trips_set_updated_at
  before update on public.trips
  for each row execute function extensions.moddatetime (updated_at);

alter table public.trips enable row level security;

-- Signed-out browsing is the acquisition funnel: anon sees open trips.
create policy "open trips are publicly readable"
  on public.trips for select
  to anon, authenticated
  using (status = 'open' or traveler_id = auth.uid());

-- Posting a trip is a paid action, enforced server-side.
create policy "active members post their own trips"
  on public.trips for insert
  to authenticated
  with check (traveler_id = auth.uid() and public.is_active_member(auth.uid()));

create policy "travelers update their own trips"
  on public.trips for update
  to authenticated
  using (traveler_id = auth.uid())
  with check (traveler_id = auth.uid());

create policy "travelers delete their own trips"
  on public.trips for delete
  to authenticated
  using (traveler_id = auth.uid());


-- ============================================================================
-- 6. PARCELS
-- Mirrors trips. Ranges mirror lib/validation.ts parcelSchema.
-- ============================================================================
create table public.parcels (
  id            uuid primary key default gen_random_uuid(),
  sender_id     uuid not null references public.profiles (id) on delete cascade,
  from_country  char(2) not null,
  from_city     text not null check (char_length(from_city) between 2 and 60),
  to_country    char(2) not null,
  to_city       text not null check (char_length(to_city) between 2 and 60),
  needed_by     date not null,
  weight_kg     numeric(4,1) not null check (weight_kg between 0.1 and 46),
  category      text not null check (category in
    ('documents','clothing','electronics','food','medicine','gifts','books','other')),
  description   text not null check (char_length(description) between 10 and 400),
  budget_usd    numeric(7,2) not null check (budget_usd between 1 and 2000),
  status        text not null default 'open' check (status in ('open','matched','closed')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  check (from_country <> to_country)
);

create or replace function public.check_parcel_needed_by()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.needed_by < current_date then
    raise exception 'needed_by must be today or later';
  end if;
  return new;
end;
$$;

create trigger parcels_needed_by_future
  before insert on public.parcels
  for each row execute function public.check_parcel_needed_by();

create trigger parcels_set_updated_at
  before update on public.parcels
  for each row execute function extensions.moddatetime (updated_at);

alter table public.parcels enable row level security;

create policy "open parcels are publicly readable"
  on public.parcels for select
  to anon, authenticated
  using (status = 'open' or sender_id = auth.uid());

create policy "active members post their own parcels"
  on public.parcels for insert
  to authenticated
  with check (sender_id = auth.uid() and public.is_active_member(auth.uid()));

create policy "senders update their own parcels"
  on public.parcels for update
  to authenticated
  using (sender_id = auth.uid())
  with check (sender_id = auth.uid());

create policy "senders delete their own parcels"
  on public.parcels for delete
  to authenticated
  using (sender_id = auth.uid());


-- ============================================================================
-- 7. MATCHES
-- Status keys are the app's existing vocabulary (lib/types.ts STATUS_ORDER)
-- plus terminal states, so the client swap is mechanical. 'escrow_paid' is
-- legacy-named — the UI labels it "Terms agreed"; Kifurushi never holds money.
-- code_hash / code_attempts / code_locked_until implement the one-time
-- delivery code with brute-force lockout (see RPCs below).
-- ============================================================================
create table public.matches (
  id                 uuid primary key default gen_random_uuid(),
  trip_id            uuid not null references public.trips (id),
  parcel_id          uuid not null references public.parcels (id),
  requester_id       uuid not null references public.profiles (id),
  status             text not null default 'requested' check (status in
    ('requested','accepted','declined','escrow_paid','picked_up','in_transit',
     'delivered','released','cancelled','disputed')),
  code_hash          text,          -- bcrypt hash of the one-time code; plaintext is never stored
  code_attempts      int not null default 0,
  code_locked_until  timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (trip_id, parcel_id)
);

create trigger matches_set_updated_at
  before update on public.matches
  for each row execute function extensions.moddatetime (updated_at);

alter table public.matches enable row level security;

-- Only the two parties may see a match. Both subqueries look at the caller's
-- OWN rows (a traveller always sees their own trip, a sender their own
-- parcel), so nested RLS on trips/parcels can never hide them.
create policy "match parties can view"
  on public.matches for select
  to authenticated
  using (
    exists (select 1 from public.trips t
            where t.id = trip_id and t.traveler_id = auth.uid())
    or exists (select 1 from public.parcels p
               where p.id = parcel_id and p.sender_id = auth.uid())
  );

-- Requesting a match is a paid action; the requester must be one of the two
-- parties, and both listings must still be open.
create policy "active member party can request a match"
  on public.matches for insert
  to authenticated
  with check (
    requester_id = auth.uid()
    and public.is_active_member(auth.uid())
    and (
      exists (select 1 from public.trips t
              where t.id = trip_id and t.traveler_id = auth.uid())
      or exists (select 1 from public.parcels p
                 where p.id = parcel_id and p.sender_id = auth.uid())
    )
    and exists (select 1 from public.trips t
                where t.id = trip_id and t.status = 'open')
    and exists (select 1 from public.parcels p
                where p.id = parcel_id and p.status = 'open')
  );
-- NO client UPDATE/DELETE policies: the state machine moves ONLY through the
-- security-definer RPCs below.
revoke update, delete on public.matches from authenticated;


-- ---------------------------------------------------------------------------
-- Party helpers (security definer so they see trips/parcels regardless of the
-- caller's RLS view — e.g. a traveller must remain a "party" to a match even
-- after the parcel flips to 'closed' and disappears from their SELECT policy).
-- ---------------------------------------------------------------------------
create or replace function public.is_match_party(p_match_id uuid, p_uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from matches m
    join trips t   on t.id = m.trip_id
    join parcels p on p.id = m.parcel_id
    where m.id = p_match_id
      and (t.traveler_id = p_uid or p.sender_id = p_uid)
  );
$$;

-- Returns the OTHER party of the match relative to p_uid (null if p_uid is
-- not a party). Used by the reviews INSERT policy.
create or replace function public.match_counterparty(p_match_id uuid, p_uid uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select case
           when t.traveler_id = p_uid then p.sender_id
           when p.sender_id  = p_uid then t.traveler_id
           else null
         end
  from matches m
  join trips t   on t.id = m.trip_id
  join parcels p on p.id = m.parcel_id
  where m.id = p_match_id;
$$;


-- ============================================================================
-- 8. MATCH STATE-MACHINE RPCs
-- All security definer with a pinned search_path; every one re-checks the
-- caller's identity and the current status, and raises on violation. Clients
-- have no direct UPDATE on matches, so these are the only doors.
-- ============================================================================

-- respond_match: the trip's traveller answers a request.
-- requested -> accepted | declined. On accept the parcel is reserved
-- (status 'matched') so no second match can be requested against it.
create or replace function public.respond_match(p_match_id uuid, p_accept boolean)
returns public.matches
language plpgsql
security definer
set search_path = public
as $$
declare
  m          public.matches;
  v_traveler uuid;
begin
  select * into m from matches where id = p_match_id for update;
  if not found then
    raise exception 'match not found';
  end if;

  select traveler_id into v_traveler from trips where id = m.trip_id;
  if v_traveler is distinct from auth.uid() then
    raise exception 'only the trip''s traveller can respond to this request';
  end if;

  if m.status <> 'requested' then
    raise exception 'match is not awaiting a response (status: %)', m.status;
  end if;

  if p_accept then
    update matches set status = 'accepted' where id = p_match_id;
    -- Reserve the parcel: the matches INSERT policy requires status='open',
    -- so this blocks double-booking.
    update parcels set status = 'matched'
      where id = m.parcel_id and status = 'open';
  else
    update matches set status = 'declined' where id = p_match_id;
  end if;

  select * into m from matches where id = p_match_id;
  return m;
end;
$$;

-- advance_match: role-checked forward steps.
--   accepted    -> escrow_paid ("Terms agreed")  : either party
--   escrow_paid -> picked_up                     : traveller only
--   picked_up   -> in_transit                    : traveller only
--   in_transit  -> delivered                     : traveller only
-- delivered -> released is NOT here: only confirm_delivery (with the code)
-- can release, per the safety promise.
create or replace function public.advance_match(p_match_id uuid)
returns public.matches
language plpgsql
security definer
set search_path = public
as $$
declare
  m            public.matches;
  v_traveler   uuid;
  v_sender     uuid;
  v_uid        uuid := auth.uid();
  v_next       text;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  select * into m from matches where id = p_match_id for update;
  if not found then
    raise exception 'match not found';
  end if;

  select traveler_id into v_traveler from trips   where id = m.trip_id;
  select sender_id   into v_sender   from parcels where id = m.parcel_id;

  if v_uid <> v_traveler and v_uid <> v_sender then
    raise exception 'you are not a party to this match';
  end if;

  if m.status = 'accepted' then
    v_next := 'escrow_paid';                       -- either party agrees terms
  elsif m.status = 'escrow_paid' then
    if v_uid <> v_traveler then
      raise exception 'only the traveller can mark the parcel picked up';
    end if;
    v_next := 'picked_up';
  elsif m.status = 'picked_up' then
    if v_uid <> v_traveler then
      raise exception 'only the traveller can mark the parcel in transit';
    end if;
    v_next := 'in_transit';
  elsif m.status = 'in_transit' then
    if v_uid <> v_traveler then
      raise exception 'only the traveller can mark the parcel delivered';
    end if;
    v_next := 'delivered';
  elsif m.status = 'delivered' then
    raise exception 'delivery is confirmed with the receiver''s code — use confirm_delivery';
  else
    raise exception 'cannot advance a match from status %', m.status;
  end if;

  update matches set status = v_next where id = p_match_id
    returning * into m;
  return m;
end;
$$;

-- generate_delivery_code: the sender mints (or re-mints) the one-time 6-digit
-- code. The plaintext is returned ONCE to the sender, who relays it to the
-- receiver out of band; only the bcrypt hash is stored. Regenerating resets
-- the attempt counter and any lockout.
-- search_path includes `extensions` so crypt()/gen_salt() resolve wherever
-- pgcrypto was installed.
create or replace function public.generate_delivery_code(p_match_id uuid)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  m        public.matches;
  v_sender uuid;
  v_code   text;
begin
  select * into m from matches where id = p_match_id for update;
  if not found then
    raise exception 'match not found';
  end if;

  select sender_id into v_sender from parcels where id = m.parcel_id;
  if v_sender is distinct from auth.uid() then
    raise exception 'only the parcel''s sender can generate the delivery code';
  end if;

  if m.status not in ('accepted','escrow_paid','picked_up','in_transit','delivered') then
    raise exception 'cannot generate a code for a match in status %', m.status;
  end if;

  v_code := floor(random() * 900000 + 100000)::int::text;  -- 100000..999999

  update matches
     set code_hash         = crypt(v_code, gen_salt('bf')),
         code_attempts     = 0,
         code_locked_until = null
   where id = p_match_id;

  return v_code;
end;
$$;

-- confirm_delivery: the traveller enters the code the receiver read out.
-- Correct code => released + parcel closed + traveller's tally incremented,
-- returns true. Wrong code => attempt counted (5 wrong tries locks the match
-- for 15 minutes), returns FALSE rather than raising.
--
-- WHY return false instead of raise on a wrong code: raising an exception
-- aborts the enclosing transaction and would ROLL BACK the attempt counter /
-- lockout write, making the brute-force protection a no-op. Postgres has no
-- autonomous transactions, so the failure path must commit. Callers should
-- treat `false` as "wrong code". Permission/state violations (and an active
-- lockout, which needs no write) still raise.
create or replace function public.confirm_delivery(p_match_id uuid, p_code text)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  m           public.matches;
  v_traveler  uuid;
  v_attempts  int;
begin
  select * into m from matches where id = p_match_id for update;
  if not found then
    raise exception 'match not found';
  end if;

  select traveler_id into v_traveler from trips where id = m.trip_id;
  if v_traveler is distinct from auth.uid() then
    raise exception 'only the trip''s traveller can confirm delivery';
  end if;

  if m.status <> 'delivered' then
    raise exception 'match is not awaiting delivery confirmation (status: %)', m.status;
  end if;

  if m.code_hash is null then
    raise exception 'no delivery code has been generated for this match';
  end if;

  if m.code_locked_until is not null and m.code_locked_until > now() then
    raise exception 'too many attempts — try later';
  end if;

  if crypt(p_code, m.code_hash) = m.code_hash then
    -- Correct code: release, close the parcel, credit the traveller.
    update matches
       set status = 'released', code_attempts = 0, code_locked_until = null
     where id = p_match_id;
    update parcels set status = 'closed' where id = m.parcel_id;
    update profiles
       set deliveries_completed = deliveries_completed + 1
     where id = v_traveler;
    return true;
  end if;

  -- Wrong code: count the attempt; lock after 5 and reset the counter.
  v_attempts := m.code_attempts + 1;
  if v_attempts >= 5 then
    update matches
       set code_attempts = 0,
           code_locked_until = now() + interval '15 minutes'
     where id = p_match_id;
  else
    update matches set code_attempts = v_attempts where id = p_match_id;
  end if;
  return false;
end;
$$;

-- cancel_match: either party may back out before the parcel is moving.
-- requested | accepted | escrow_paid -> cancelled. A reserved parcel reopens.
create or replace function public.cancel_match(p_match_id uuid)
returns public.matches
language plpgsql
security definer
set search_path = public
as $$
declare
  m          public.matches;
  v_traveler uuid;
  v_sender   uuid;
  v_uid      uuid := auth.uid();
begin
  select * into m from matches where id = p_match_id for update;
  if not found then
    raise exception 'match not found';
  end if;

  select traveler_id into v_traveler from trips   where id = m.trip_id;
  select sender_id   into v_sender   from parcels where id = m.parcel_id;

  if v_uid is null or (v_uid <> v_traveler and v_uid <> v_sender) then
    raise exception 'you are not a party to this match';
  end if;

  if m.status not in ('requested','accepted','escrow_paid') then
    raise exception 'a match in status % can no longer be cancelled', m.status;
  end if;

  update matches set status = 'cancelled' where id = p_match_id
    returning * into m;
  -- Free the parcel for other travellers if it was reserved.
  update parcels set status = 'open'
    where id = m.parcel_id and status = 'matched';

  return m;
end;
$$;


-- ============================================================================
-- 9. TRANSIT_UPDATES — the traveller's journey log
-- ============================================================================
create table public.transit_updates (
  id          uuid primary key default gen_random_uuid(),
  match_id    uuid not null references public.matches (id) on delete cascade,
  author_id   uuid not null references public.profiles (id),
  note        text not null check (char_length(note) between 3 and 200),
  created_at  timestamptz not null default now()
);

alter table public.transit_updates enable row level security;

create policy "match parties read transit updates"
  on public.transit_updates for select
  to authenticated
  using (public.is_match_party(match_id, auth.uid()));

-- Only the traveller posts, and only while the parcel is moving.
create policy "traveller posts updates while parcel is moving"
  on public.transit_updates for insert
  to authenticated
  with check (
    author_id = auth.uid()
    and exists (
      select 1
      from public.matches m
      join public.trips t on t.id = m.trip_id
      where m.id = match_id
        and t.traveler_id = auth.uid()
        and m.status in ('picked_up','in_transit')
    )
  );
-- Immutable log: no UPDATE/DELETE policies.
revoke update, delete on public.transit_updates from authenticated;


-- ============================================================================
-- 10. REVIEWS — two-way, immutable, code-gated
-- Insert is allowed ONLY at status 'released': the receiver's code is the
-- gate, exactly as the marketing promises (v1 also allowed 'delivered',
-- letting a traveller self-mark and farm reviews).
-- ============================================================================
create table public.reviews (
  id          uuid primary key default gen_random_uuid(),
  match_id    uuid not null references public.matches (id),
  author_id   uuid not null references public.profiles (id),
  subject_id  uuid not null references public.profiles (id),
  rating      int not null check (rating between 1 and 5),
  comment     text check (char_length(comment) <= 300),
  created_at  timestamptz not null default now(),
  unique (match_id, author_id)   -- one review from each party per delivery
);

alter table public.reviews enable row level security;

-- Reviews are public: they power the /people pages for signed-out visitors.
create policy "reviews are publicly readable"
  on public.reviews for select
  to anon, authenticated
  using (true);

-- Author must be a party; subject must be the OTHER party; only after release.
create policy "parties review each other after release"
  on public.reviews for insert
  to authenticated
  with check (
    author_id = auth.uid()
    and author_id <> subject_id
    and subject_id = public.match_counterparty(match_id, auth.uid())
    and exists (
      select 1 from public.matches m
      where m.id = match_id and m.status = 'released'
    )
  );
-- Immutable: no UPDATE/DELETE policies.
revoke update, delete on public.reviews from authenticated;

-- Keep profiles.rating server-owned and fresh.
create or replace function public.refresh_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update profiles
     set rating = (
       select round(avg(rating)::numeric, 1)
       from reviews
       where subject_id = new.subject_id
     )
   where id = new.subject_id;
  return new;
end;
$$;

create trigger reviews_refresh_rating
  after insert on public.reviews
  for each row execute function public.refresh_rating();


-- ============================================================================
-- 11. MESSAGES — match-scoped chat (UI comes later; table ready)
-- ============================================================================
create table public.messages (
  id          uuid primary key default gen_random_uuid(),
  match_id    uuid not null references public.matches (id) on delete cascade,
  sender_id   uuid not null references public.profiles (id),
  body        text not null check (char_length(body) between 1 and 2000),
  created_at  timestamptz not null default now()
);

alter table public.messages enable row level security;

create policy "match parties read messages"
  on public.messages for select
  to authenticated
  using (public.is_match_party(match_id, auth.uid()));

-- Messaging is a member feature, enforced server-side.
create policy "member parties send messages"
  on public.messages for insert
  to authenticated
  with check (
    sender_id = auth.uid()
    and public.is_match_party(match_id, auth.uid())
    and public.is_active_member(auth.uid())
  );
revoke update, delete on public.messages from authenticated;


-- ============================================================================
-- 12. VERIFICATIONS — KYC outcomes only, never images
-- ID/selfie images go browser -> KYC provider directly; we store only the
-- provider reference and result. The provider webhook (service role) resolves
-- the row and flips profiles.id_verified. Phone lives in private_contacts.
-- ============================================================================
create table public.verifications (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles (id) on delete cascade,
  provider      text not null default 'manual',
  provider_ref  text,
  id_type       text not null check (id_type in ('passport','national_id','drivers_licence')),
  status        text not null default 'pending' check (status in ('pending','verified','rejected')),
  created_at    timestamptz not null default now(),
  resolved_at   timestamptz
);

alter table public.verifications enable row level security;

create policy "users read their own verifications"
  on public.verifications for select
  to authenticated
  using (user_id = auth.uid());

create policy "users start their own verification"
  on public.verifications for insert
  to authenticated
  with check (user_id = auth.uid() and status = 'pending');
-- No client UPDATE: only the provider webhook (service role) resolves.
revoke update, delete on public.verifications from authenticated;


-- ============================================================================
-- 13. INDEXES (query patterns from the audit)
-- ============================================================================
create index trips_route_idx           on public.trips (from_country, to_country, depart_date);
create index trips_traveler_idx        on public.trips (traveler_id);
create index parcels_route_idx         on public.parcels (from_country, to_country, needed_by);
create index parcels_sender_idx        on public.parcels (sender_id);
create index matches_parcel_idx        on public.matches (parcel_id);
create index matches_trip_idx          on public.matches (trip_id);
create index messages_match_idx        on public.messages (match_id, created_at);
create index transit_updates_match_idx on public.transit_updates (match_id, created_at);
create index reviews_subject_idx       on public.reviews (subject_id);
create index verifications_user_idx    on public.verifications (user_id);


-- ============================================================================
-- 14. GRANT HARDENING
-- Supabase's default privileges hand anon/authenticated broad table grants on
-- creation. RLS is the primary gate, but grants are trimmed so the anon role
-- is SELECT-only on the public tables and has nothing anywhere else.
-- ============================================================================

-- anon: read-only on the four public tables, nothing else.
revoke all on public.profiles, public.trips, public.parcels, public.reviews from anon;
grant select on public.profiles, public.trips, public.parcels, public.reviews to anon;
revoke all on public.private_contacts, public.memberships, public.matches,
              public.messages, public.transit_updates, public.verifications from anon;

-- authenticated: no deletes where deletion is not a feature.
revoke delete on public.memberships from authenticated;

-- RPCs: callable by signed-in users only.
revoke execute on function public.respond_match(uuid, boolean)        from public, anon;
revoke execute on function public.advance_match(uuid)                 from public, anon;
revoke execute on function public.generate_delivery_code(uuid)        from public, anon;
revoke execute on function public.confirm_delivery(uuid, text)        from public, anon;
revoke execute on function public.cancel_match(uuid)                  from public, anon;
grant execute on function public.respond_match(uuid, boolean)         to authenticated;
grant execute on function public.advance_match(uuid)                  to authenticated;
grant execute on function public.generate_delivery_code(uuid)         to authenticated;
grant execute on function public.confirm_delivery(uuid, text)         to authenticated;
grant execute on function public.cancel_match(uuid)                   to authenticated;

-- Helpers used inside policies (evaluated as the querying role).
grant execute on function public.is_active_member(uuid)               to authenticated;
grant execute on function public.is_match_party(uuid, uuid)           to authenticated;
grant execute on function public.match_counterparty(uuid, uuid)       to authenticated;

-- ============================================================================
-- End of migration.
-- ============================================================================
