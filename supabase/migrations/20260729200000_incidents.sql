-- Until now a failure was only visible if a customer complained. A request
-- the database refused, a Stripe webhook that couldn't be verified, an email
-- Resend rejected — all of it vanished into a log nobody reads. This records
-- them and pushes the ones that matter at a person.
--
-- Two speeds, deliberately:
--   severe  -> emailed immediately (money and identity: someone paid and got
--              nothing, or a verification is silently broken)
--   normal  -> collected into one 08:00 digest, alongside a sweep for things
--              that are stuck rather than broken
--
-- The split exists so the alerts stay readable. An inbox that gets thirty
-- mails in a bad hour is an inbox nobody looks at during the next bad hour.

create table if not exists public.incidents (
  id          uuid primary key default gen_random_uuid(),
  kind        text not null,
  severity    text not null default 'normal' check (severity in ('severe','normal')),
  source      text not null default 'server' check (source in ('client','server')),
  summary     text not null check (char_length(summary) between 3 and 300),
  detail      jsonb,
  user_id     uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  alerted_at  timestamptz,   -- instant email sent
  digested_at timestamptz    -- included in a digest
);

create index if not exists incidents_undigested_idx
  on public.incidents (created_at) where digested_at is null;

alter table public.incidents enable row level security;

-- The client half. When a member's action fails in the browser we want to
-- hear about it, but an unauthenticated open write endpoint is a spam vector,
-- so: signed in only, own user_id only, never severe, and the kind must be
-- one we recognise. Severity is the server's to decide, not the caller's.
create policy "members report their own failures"
  on public.incidents for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and source = 'client'
    and severity = 'normal'
    and kind in (
      'match_request_failed', 'match_offer_failed', 'match_respond_failed',
      'listing_post_failed', 'checkout_start_failed', 'kyc_start_failed',
      'delivery_confirm_failed', 'review_failed'
    )
  );

-- Nobody reads this table from a browser, in either direction.
revoke select, update, delete on public.incidents from authenticated, anon;

-- One user hammering a broken button shouldn't write a hundred rows: keep the
-- first of each kind per user per five minutes and drop the rest. The signal
-- is "this is failing", not how many times they retried.
create or replace function public.throttle_incident()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    select 1 from public.incidents
    where kind = new.kind
      and user_id is not distinct from new.user_id
      and created_at > now() - interval '5 minutes'
  ) then
    return null;
  end if;
  return new;
end;
$$;

drop trigger if exists incidents_throttle on public.incidents;
create trigger incidents_throttle
  before insert on public.incidents
  for each row execute function public.throttle_incident();

-- Severe incidents go out at once.
create or replace function public.notify_incident()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.severity = 'severe' then
    perform net.http_post(
      url := 'https://bltaaidjhpkmwnsprenu.supabase.co/functions/v1/alert-emails',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-hook-secret', 'khook_4f2bb1de88c94ab5a7e31c60d2f9a8e7'
      ),
      body := jsonb_build_object('mode', 'instant', 'incident_id', new.id)
    );
  end if;
  return new;
end;
$$;

drop trigger if exists incidents_notify on public.incidents;
create trigger incidents_notify
  after insert on public.incidents
  for each row execute function public.notify_incident();

-- Server-side callers (edge functions, triggers) log through this rather than
-- inserting directly, so the shape stays consistent.
create or replace function public.log_incident(
  p_kind text,
  p_summary text,
  p_severity text default 'normal',
  p_detail jsonb default null,
  p_user_id uuid default null
)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.incidents (kind, severity, source, summary, detail, user_id)
  values (p_kind, p_severity, 'server', p_summary, p_detail, p_user_id);
$$;

revoke all on function public.log_incident(text, text, text, jsonb, uuid)
  from public, anon, authenticated;

-- The daily sweep. 06:00 UTC is 08:00 in Paris through the summer.
create extension if not exists pg_cron;

select cron.unschedule('kifurushi-daily-digest')
where exists (select 1 from cron.job where jobname = 'kifurushi-daily-digest');

select cron.schedule(
  'kifurushi-daily-digest',
  '0 6 * * *',
  $$
  select net.http_post(
    url := 'https://bltaaidjhpkmwnsprenu.supabase.co/functions/v1/alert-emails',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-hook-secret', 'khook_4f2bb1de88c94ab5a7e31c60d2f9a8e7'
    ),
    body := jsonb_build_object('mode', 'digest')
  );
  $$
);
