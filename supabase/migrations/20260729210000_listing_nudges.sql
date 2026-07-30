-- A parcel nobody picks up just goes quiet. The deadline passes, the sender
-- assumes the platform doesn't work, and nothing ever told them that moving
-- the date by a week would have found them a traveller.
--
-- Two nudges per listing, each sent once — hence the timestamps rather than a
-- boolean. Repeating a nudge every morning would train people to ignore it.

alter table public.parcels
  add column if not exists nudged_soon_at    timestamptz,
  add column if not exists nudged_expired_at timestamptz;

alter table public.trips
  add column if not exists nudged_soon_at    timestamptz,
  add column if not exists nudged_expired_at timestamptz;

-- 07:00 UTC — an hour after the operational digest, so a morning where
-- everything happens at once still arrives in a readable order.
select cron.unschedule('kifurushi-listing-nudges')
where exists (select 1 from cron.job where jobname = 'kifurushi-listing-nudges');

select cron.schedule(
  'kifurushi-listing-nudges',
  '0 7 * * *',
  $$
  select net.http_post(
    url := 'https://bltaaidjhpkmwnsprenu.supabase.co/functions/v1/listing-nudges',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-hook-secret', 'kalert_732392037f5632f3aa32111dec61eeb4'
    ),
    body := '{}'::jsonb
  );
  $$
);
