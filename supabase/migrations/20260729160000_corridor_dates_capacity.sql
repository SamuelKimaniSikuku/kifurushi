-- Three rules a match must obey, enforced server-side so no client can skip
-- them:
--   1. same corridor  — the trip and the parcel travel between the same two
--      countries (you cannot carry a Lagos parcel on a Dakar flight)
--   2. dates work     — the flight has not departed yet, and leaves on or
--      before the day the parcel is needed
--   3. space is real  — the traveller has enough kilos left, and every
--      committed parcel eats into them until the trip is full
--
-- Capacity is tracked on the trip itself so browsing can filter full trips
-- out cheaply.

-- ---------------------------------------------------------------------------
-- 1. Capacity columns, kept current by a trigger on matches
-- ---------------------------------------------------------------------------
alter table public.trips
  add column if not exists booked_kg numeric(6,1) not null default 0;

alter table public.trips
  add column if not exists remaining_kg numeric(6,1)
  generated always as (space_kg - booked_kg) stored;

create or replace function public.recompute_trip_capacity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_trip uuid := coalesce(new.trip_id, old.trip_id);
begin
  update trips t
     set booked_kg = coalesce((
       select sum(p.weight_kg)
       from matches m
       join parcels p on p.id = m.parcel_id
       where m.trip_id = v_trip
         and m.status in ('accepted', 'escrow_paid', 'picked_up',
                          'in_transit', 'delivered', 'released')
     ), 0)
   where t.id = v_trip;
  return coalesce(new, old);
end;
$$;

drop trigger if exists matches_recompute_capacity on public.matches;
create trigger matches_recompute_capacity
  after insert or update or delete on public.matches
  for each row execute function public.recompute_trip_capacity();

-- Backfill for anything already matched.
update public.trips t
   set booked_kg = coalesce((
     select sum(p.weight_kg)
     from matches m
     join parcels p on p.id = m.parcel_id
     where m.trip_id = t.id
       and m.status in ('accepted', 'escrow_paid', 'picked_up',
                        'in_transit', 'delivered', 'released')
   ), 0);

-- ---------------------------------------------------------------------------
-- 2. Corridor, dates and space enforced when a match is requested
-- ---------------------------------------------------------------------------
drop policy if exists "active member party can request a match" on public.matches;
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
    -- the two sides must be different people
    and (select t.traveler_id from public.trips t where t.id = trip_id)
        is distinct from
        (select p.sender_id from public.parcels p where p.id = parcel_id)
    -- same corridor
    and (select t.from_country from public.trips t where t.id = trip_id)
        = (select p.from_country from public.parcels p where p.id = parcel_id)
    and (select t.to_country from public.trips t where t.id = trip_id)
        = (select p.to_country from public.parcels p where p.id = parcel_id)
    -- the flight is still ahead, and early enough to be useful
    and (select t.depart_date from public.trips t where t.id = trip_id)
        >= current_date
    and (select t.depart_date from public.trips t where t.id = trip_id)
        <= (select p.needed_by from public.parcels p where p.id = parcel_id)
    -- and there is room for this parcel
    and (select t.remaining_kg from public.trips t where t.id = trip_id)
        >= (select p.weight_kg from public.parcels p where p.id = parcel_id)
  );

-- ---------------------------------------------------------------------------
-- 3. Space re-checked at accept time — several requests can be pending at
--    once, and only the accepted ones consume the luggage.
-- ---------------------------------------------------------------------------
create or replace function public.respond_match(p_match_id uuid, p_accept boolean)
returns public.matches
language plpgsql
security definer
set search_path = public
as $$
declare
  m           public.matches;
  v_traveler  uuid;
  v_sender    uuid;
  v_uid       uuid := auth.uid();
  v_remaining numeric;
  v_weight    numeric;
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

  if v_uid = m.requester_id then
    raise exception 'the other party has to answer your request';
  end if;

  if m.status <> 'requested' then
    raise exception 'match is not awaiting a response (status: %)', m.status;
  end if;

  if p_accept then
    select remaining_kg into v_remaining from trips   where id = m.trip_id;
    select weight_kg    into v_weight    from parcels where id = m.parcel_id;
    if v_remaining < v_weight then
      raise exception 'not enough space left on this trip (% kg free, % kg needed)',
        v_remaining, v_weight;
    end if;

    update matches set status = 'accepted' where id = p_match_id;
    update parcels set status = 'matched'
      where id = m.parcel_id and status = 'open';
  else
    update matches set status = 'declined' where id = p_match_id;
  end if;

  select * into m from matches where id = p_match_id;
  return m;
end;
$$;
