-- The first version read new.traveler_id or new.sender_id from a CASE on the
-- table name. plpgsql resolves every branch of that expression regardless of
-- which one is taken, so inserting a trip failed on the parcels branch:
-- 'record "new" has no field "sender_id"'. Reading the owner out of the row as
-- JSON sidesteps the problem — the column name arrives as a trigger argument
-- and is only looked up on the row actually being inserted.

create or replace function public.activate_trial_on_first_listing()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
begin
  v_owner := (to_jsonb(new) ->> tg_argv[0])::uuid;

  update public.memberships
  set trial_activated_at = now(),
      current_period_end = now() + interval '1 month'
  where user_id = v_owner
    and provider = 'trial'
    and trial_activated_at is null;

  return new;
end;
$$;

drop trigger if exists trips_activate_trial on public.trips;
create trigger trips_activate_trial
  after insert on public.trips
  for each row execute function public.activate_trial_on_first_listing('traveler_id');

drop trigger if exists parcels_activate_trial on public.parcels;
create trigger parcels_activate_trial
  after insert on public.parcels
  for each row execute function public.activate_trial_on_first_listing('sender_id');
