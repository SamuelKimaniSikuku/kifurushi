-- LAUNCH PERIOD: Kifurushi is free for everyone until Samuel says otherwise.
--
-- Mechanically this is one idea: trial memberships never expire. Signup
-- already grants provider='trial' with current_period_end='infinity'; the
-- only thing that ever ended it was the first-listing trigger starting a
-- one-month countdown. That trigger now records WHEN the member first posted
-- (worth keeping — it's the activation metric) but leaves the end date at
-- infinity. is_active_member() checks current_period_end > now(), and
-- infinity > now() is true in Postgres, so every gate in RLS keeps working
-- unchanged. The trial-ending emails key off a finite end date, so they
-- simply never fire.
--
-- Paid Stripe memberships are untouched.
--
-- TO END THE LAUNCH PERIOD later:
--   1. Restore the countdown in this trigger:
--        current_period_end = now() + interval '1 month'  (alongside
--        trial_activated_at = now()) for new activations.
--   2. Give existing free members a dated runway, e.g.:
--        update memberships set current_period_end = now() + interval '1 month'
--        where provider = 'trial' and current_period_end = 'infinity';
--      The 3-days-before and after-expiry emails then pick them up
--      automatically (trial_notified_at is cleared below).

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
  set trial_activated_at = now()
  where user_id = v_owner
    and provider = 'trial'
    and trial_activated_at is null;

  return new;
end;
$$;

-- Everyone currently on a trial — dormant or counting down — becomes
-- open-ended. Notification stamps are cleared so that when the launch period
-- ends, the warning emails treat everyone freshly.
update public.memberships
set current_period_end = 'infinity',
    trial_notified_at = null,
    trial_ended_notified_at = null
where provider = 'trial';
