-- A match request that sits unanswered goes stale silently: the responder
-- got one email when it arrived and nothing since, and most people don't
-- reopen their dashboard unprompted. After 48 hours the daily nudge run now
-- reminds the person who hasn't answered — once per match, recorded here.
alter table public.matches
  add column if not exists request_nudged_at timestamptz;
