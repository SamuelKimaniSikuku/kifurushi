-- The seven-step ladder is a record, not a ritual. Real deliveries often
-- outrun it: a document handed over the same afternoon it was accepted has no
-- separate "picked up" and "in transit" moments worth clicking through — and
-- members shouldn't have to perform four status updates to reach the delivery
-- code that actually proves anything.
--
-- deliver_now lets the traveller jump from any post-acceptance stage straight
-- to 'delivered', where the receiver's one-time code takes over as the proof.
-- Deliberately unchanged: acceptance cannot be skipped (the other party's
-- consent is not a formality), and the code itself remains the only way to
-- complete — this shortcut moves you TO the code, never past it. One status
-- update means the notification trigger fires once, not four times.

create or replace function public.deliver_now(p_match_id uuid)
returns public.matches
language plpgsql
security definer
set search_path = public
as $$
declare
  m          public.matches;
  v_traveler uuid;
  v_uid      uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  select * into m from matches where id = p_match_id for update;
  if not found then
    raise exception 'match not found';
  end if;

  select traveler_id into v_traveler from trips where id = m.trip_id;
  if v_uid <> v_traveler then
    raise exception 'only the traveller can mark the parcel delivered';
  end if;

  if m.status not in ('accepted', 'escrow_paid', 'picked_up', 'in_transit') then
    raise exception 'cannot jump to delivered from status %', m.status;
  end if;

  update matches set status = 'delivered' where id = p_match_id
    returning * into m;
  return m;
end;
$$;

revoke all on function public.deliver_now(uuid) from public, anon;
grant execute on function public.deliver_now(uuid) to authenticated;
