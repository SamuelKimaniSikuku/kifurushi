-- Accept first and agree an unknown weight in Messages. Keep NULL as unknown:
-- do not invent a weight, backfill bookings, or bypass the existing guards for
-- ownership, availability, known capacity, routes, dates and safe handover.
drop trigger if exists matches_require_agreed_weight on public.matches;
drop function if exists private.require_agreed_parcel_weight();

comment on column public.parcels.weight_kg is
  'Estimated kg; NULL means weight is still to be agreed in Messages and does not prevent acceptance. Capacity totals include recorded weights only.';
