-- The free month was burning down for people who had not used the app yet.
-- Five of the first six members signed up, posted nothing, and were on course
-- to reach the paywall having received exactly nothing for their free month —
-- which is the worst possible moment to ask someone for $29.
--
-- So the month now starts when it begins to be worth something: at the
-- member's first trip or parcel. Until then the trial sits dormant, and
-- current_period_end is 'infinity' so every existing membership check keeps
-- working untouched — is_active_member, the RLS policies, all of it.
--
-- Someone who never posts therefore keeps browsing and receiving forever,
-- which costs us nothing: posting is the thing that starts the clock, and
-- they cannot post without starting it.

alter table public.memberships
  add column if not exists trial_activated_at timestamptz;

comment on column public.memberships.trial_activated_at is
  'When the free month actually started — set on the first listing. Null = dormant, not yet begun.';

-- New signups get a dormant trial. This redefines handle_new_user rather than
-- adding a second function: the membership insert lives inside it, alongside
-- the profile creation, and splitting them would leave two places to keep in
-- step.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
begin
  v_name := nullif(trim(coalesce(new.raw_user_meta_data->>'full_name', '')), '');
  if v_name is null or char_length(v_name) < 2 then
    v_name := nullif(trim(split_part(coalesce(new.email, ''), '@', 1)), '');
  end if;
  if v_name is null or char_length(v_name) < 2 then
    v_name := 'New member';
  end if;

  insert into public.profiles (id, full_name)
  values (new.id, left(v_name, 80));

  -- 'infinity' until they post: the month has not started yet.
  insert into public.memberships (user_id, status, plan, provider, current_period_end)
  values (new.id, 'active', 'monthly', 'trial', 'infinity')
  on conflict (user_id) do nothing;

  return new;
end;
$$;

-- The first listing starts the clock. AFTER INSERT, so a failed post doesn't
-- silently consume someone's month.
create or replace function public.activate_trial_on_first_listing()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
begin
  v_owner := case tg_table_name
    when 'trips'   then new.traveler_id
    when 'parcels' then new.sender_id
  end;

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
  for each row execute function public.activate_trial_on_first_listing();

drop trigger if exists parcels_activate_trial on public.parcels;
create trigger parcels_activate_trial
  after insert on public.parcels
  for each row execute function public.activate_trial_on_first_listing();

-- Backfill, taking nothing away from anyone.
--
-- Never posted: hand the whole month back, undated.
update public.memberships m
set current_period_end = 'infinity',
    trial_activated_at = null,
    trial_notified_at = null,
    trial_ended_notified_at = null
where m.provider = 'trial'
  and not exists (select 1 from public.trips   t where t.traveler_id = m.user_id)
  and not exists (select 1 from public.parcels p where p.sender_id   = m.user_id);

-- Already posted: start the clock from that first listing, but never end
-- earlier than the date they were already promised.
update public.memberships m
set trial_activated_at = f.first_post,
    current_period_end = greatest(m.current_period_end, f.first_post + interval '1 month')
from (
  select user_id, min(created_at) as first_post
  from (
    select traveler_id as user_id, created_at from public.trips
    union all
    select sender_id   as user_id, created_at from public.parcels
  ) all_listings
  group by user_id
) f
where m.user_id = f.user_id
  and m.provider = 'trial'
  and m.trial_activated_at is null;
