-- The trial ending in silence is the worst of both worlds: the member loses
-- the ability to post, concludes the app is broken, and never sees a reason to
-- come back. One email, once, after it lapses — saying plainly what still
-- works and what it costs to resume.

alter table public.memberships
  add column if not exists trial_ended_notified_at timestamptz;

comment on column public.memberships.trial_ended_notified_at is
  'When we told this member their free month had ended. Null = not yet.';
