-- Requests keep the sender's estimate without applying luggage limits.
-- Capacity is still enforced by respond_match and the handover trigger when
-- the other party accepts. Existing parcel values are preserved exactly.
set local lock_timeout = '5s';
set local statement_timeout = '30s';

alter table public.parcels
  drop constraint parcels_weight_kg_check,
  alter column weight_kg type numeric,
  add constraint parcels_weight_kg_check
    check (weight_kg > 0 and weight_kg < 'Infinity'::numeric);

-- Keep small parcels precise through acceptance too. The previous one-decimal
-- capacity columns could round an envelope's weight down to zero. Rebuild only
-- the derived remaining-space column; no bookings or trip data are deleted.
-- No CASCADE: fail safely if a new dependency was added since this was tested.
alter table public.trips drop column remaining_kg;
alter table public.trips alter column booked_kg type numeric;
alter table public.trips add column remaining_kg numeric
  generated always as (space_kg - booked_kg) stored;

notify pgrst, 'reload schema';
