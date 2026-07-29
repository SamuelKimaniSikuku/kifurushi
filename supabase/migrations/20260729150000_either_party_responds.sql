-- Let the party who did NOT initiate answer the request.
--
-- respond_match was written assuming senders always initiate, so it only
-- allowed the trip's traveller to accept or decline. That dead-ended the
-- other direction: when a traveller offered to carry a parcel, the sender
-- had no way to accept. Now the rule is simply "whoever didn't ask,
-- answers" — which is symmetric and matches what both sides expect.

create or replace function public.respond_match(p_match_id uuid, p_accept boolean)
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

  if v_uid = m.requester_id then
    raise exception 'the other party has to answer your request';
  end if;

  if m.status <> 'requested' then
    raise exception 'match is not awaiting a response (status: %)', m.status;
  end if;

  if p_accept then
    update matches set status = 'accepted' where id = p_match_id;
    -- Reserve the parcel so no second match can be requested against it.
    update parcels set status = 'matched'
      where id = m.parcel_id and status = 'open';
  else
    update matches set status = 'declined' where id = p_match_id;
  end if;

  select * into m from matches where id = p_match_id;
  return m;
end;
$$;
