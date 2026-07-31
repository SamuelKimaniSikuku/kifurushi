-- Everyone who signs up gets their first month free.
--
-- Granted by the same trigger that creates the profile, for two reasons: it
-- fires exactly once per auth user, so nobody can claim a second trial by
-- calling something twice; and it means the paywall needs no special case —
-- is_active_member() already asks whether there is an active row that hasn't
-- expired, and a trial is exactly that.
--
-- provider = 'trial' is what distinguishes it, so the UI can say "your free
-- month ends on the 30th" rather than implying they have paid. plan stays
-- 'monthly' because the column is constrained to the two real plans and a
-- trial is, in every respect that matters here, a month.

alter table public.memberships
  add column if not exists trial_notified_at timestamptz;

comment on column public.memberships.trial_notified_at is
  'When we warned this member their free month was ending. Null = not yet.';

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
begin
  -- Prefer the name captured at sign-up; fall back to the email local part.
  v_name := nullif(trim(coalesce(new.raw_user_meta_data->>'full_name', '')), '');
  if v_name is null or char_length(v_name) < 2 then
    v_name := nullif(trim(split_part(coalesce(new.email, ''), '@', 1)), '');
  end if;
  if v_name is null or char_length(v_name) < 2 then
    v_name := 'New member';
  end if;

  insert into public.profiles (id, full_name)
  values (new.id, left(v_name, 80));

  -- The free first month. on conflict do nothing so that re-running the
  -- trigger, or a payment that somehow lands first, never overwrites a real
  -- paid membership with a trial.
  insert into public.memberships (user_id, status, plan, provider, current_period_end)
  values (new.id, 'active', 'monthly', 'trial', now() + interval '1 month')
  on conflict (user_id) do nothing;

  return new;
end;
$$;
