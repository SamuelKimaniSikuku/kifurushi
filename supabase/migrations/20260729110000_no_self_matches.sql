-- Block self-matches: matching your own trip with your own parcel would let
-- you complete deliveries against yourself and farm the deliveries_completed
-- counter (reviews were already self-blocked). Surfaced by Samuel's
-- single-account test run.

drop policy "active member party can request a match" on public.matches;
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
  );
