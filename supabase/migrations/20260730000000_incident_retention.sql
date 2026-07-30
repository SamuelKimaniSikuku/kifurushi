-- The privacy policy says failure logs are kept 90 days. That has to be true,
-- and a promise nobody enforces is the same category of problem as a feature
-- nobody built — so the database enforces it rather than a good intention.

select cron.unschedule('kifurushi-incident-retention')
where exists (select 1 from cron.job where jobname = 'kifurushi-incident-retention');

select cron.schedule(
  'kifurushi-incident-retention',
  '30 3 * * *',
  $$ delete from public.incidents where created_at < now() - interval '90 days' $$
);
