-- Extend sender_confirm_delivery to include 'accepted' status. The whole
-- point is that family deliveries skip the ritual entirely — including
-- "terms agreed", which is meaningful between strangers and noise between
-- cousins. Any post-acceptance state now short-circuits to released.

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
  if m.status not in ('accepted', 'escrow_paid', 'picked_up', 'in_transit', 'delivered') then
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
