-- The delivery code is the belt-and-braces path: the sender mints a 6-digit
-- code, the receiver relays it to the traveller at handover, the traveller
-- types it. That's the right ritual for a first delivery between strangers.
-- It's the wrong ritual for family — auntie hands the parcel to a cousin at
-- Nairobi airport and neither of them is going to type six digits.
--
-- So the sender now has a second path: confirm the delivery themselves, from
-- their dashboard, from any post-acceptance stage. The reason it's safe to
-- give the sender this power is that they have nothing to gain by lying about
-- receiving their OWN parcel — a false yes means the traveller keeps the fee
-- for a delivery that didn't happen AND the sender loses whatever they sent.
-- No money moves through us so there is no chargeback lever to farm.
--
-- released_via records which path was used. Reviews unlock either way; a
-- future audit can distinguish 'code' from 'sender' if it matters.

alter table public.matches
  add column if not exists released_via text
    check (released_via in ('code', 'sender'));

create or replace function public.sender_confirm_delivery(p_match_id uuid)
returns public.matches
language plpgsql
security definer
set search_path = public
as $$
declare
  m        public.matches;
  v_sender uuid;
  v_uid    uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  select * into m from matches where id = p_match_id for update;
  if not found then
    raise exception 'match not found';
  end if;

  select sender_id into v_sender from parcels where id = m.parcel_id;
  if v_uid <> v_sender then
    raise exception 'only the sender can confirm delivery without the code';
  end if;

  if m.status = 'released' then
    return m;
  end if;
  if m.status not in ('escrow_paid', 'picked_up', 'in_transit', 'delivered') then
    raise exception 'cannot confirm delivery from status %', m.status;
  end if;

  update matches
    set status = 'released',
        released_via = 'sender'
    where id = p_match_id
    returning * into m;
  return m;
end;
$$;

revoke all on function public.sender_confirm_delivery(uuid) from public, anon;
grant execute on function public.sender_confirm_delivery(uuid) to authenticated;
