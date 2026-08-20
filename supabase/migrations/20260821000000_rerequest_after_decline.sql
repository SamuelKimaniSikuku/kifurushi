-- A declined request was permanent: unique (trip_id, parcel_id) counted
-- declined and cancelled rows, so the same parcel could never ask the same
-- trip again — even when the decline was a slip, or the chat changed the
-- traveller's mind. Samuel hit it himself in testing.
--
-- The uniqueness rule's real job is narrower: one LIVE negotiation per pair
-- at a time. Dead matches (declined, cancelled) become history and stop
-- blocking. Multiple requests are possible over time, but never two open
-- ones at once — so the re-request path can't be used to spam someone who
-- hasn't answered yet, only to try again after an actual no.

alter table public.matches
  drop constraint if exists matches_trip_id_parcel_id_key;

create unique index if not exists matches_live_pair_idx
  on public.matches (trip_id, parcel_id)
  where status not in ('declined', 'cancelled');
