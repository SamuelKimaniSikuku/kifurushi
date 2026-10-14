-- A request starts a conversation. Unknown weight is NULL, never an invented
-- zero-kilo parcel; known weight still uses the existing 0.1–46 kg bounds.
alter table public.parcels alter column weight_kg drop not null;
comment on column public.parcels.weight_kg is 'Estimated kg; NULL means weight must be agreed before a match is accepted.';

-- Retain membership, ownership, open-listing, no-self-match, route and date
-- requirements. Capacity is deliberately checked at acceptance, not request.
alter policy "active member party can request a match" on public.matches
with check (
  requester_id = auth.uid()
  and public.is_active_member(auth.uid())
  and (
    exists(select 1 from public.trips t where t.id=trip_id and t.traveler_id=auth.uid())
    or exists(select 1 from public.parcels p where p.id=parcel_id and p.sender_id=auth.uid())
  )
  and exists(select 1 from public.trips t where t.id=trip_id and t.status='open')
  and exists(select 1 from public.parcels p where p.id=parcel_id and p.status='open')
  and (select t.traveler_id from public.trips t where t.id=trip_id)
      is distinct from (select p.sender_id from public.parcels p where p.id=parcel_id)
  and (select t.from_country from public.trips t where t.id=trip_id)
      = (select p.from_country from public.parcels p where p.id=parcel_id)
  and (select t.to_country from public.trips t where t.id=trip_id)
      = (select p.to_country from public.parcels p where p.id=parcel_id)
  and (select t.depart_date from public.trips t where t.id=trip_id) >= current_date
  and (select t.depart_date from public.trips t where t.id=trip_id)
      <= (select p.needed_by from public.parcels p where p.id=parcel_id)
);

-- The existing locked handover guard still checks capacity at acceptance.
-- Add the unknown-weight guard without replacing any inspection/refusal rules.
create function private.require_agreed_parcel_weight()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare v_weight numeric;
begin
  if old.status='requested' and new.status='accepted' then
    select weight_kg into v_weight from public.parcels where id=new.parcel_id for update;
    if v_weight is null then
      raise exception 'Agree the parcel weight in chat and ask the sender to update it before accepting.';
    end if;
  end if;
  return new;
end;
$$;
revoke all on function private.require_agreed_parcel_weight() from public,anon,authenticated;
create trigger matches_require_agreed_weight before update of status on public.matches
for each row execute function private.require_agreed_parcel_weight();
