-- A trip whose departure has passed is history, not inventory. Browse already
-- hides them, but the rows stayed 'open' forever — so the daily digest
-- re-reported Tara's flown-empty trip every single morning, and always would
-- have. Close them nightly; the digest line then means what it says.

select cron.unschedule('kifurushi-close-departed-trips')
where exists (select 1 from cron.job where jobname = 'kifurushi-close-departed-trips');

select cron.schedule(
  'kifurushi-close-departed-trips',
  '50 3 * * *',
  $$ update public.trips set status = 'closed'
     where status = 'open' and depart_date < current_date $$
);

-- And clear the backlog now rather than at 03:50.
update public.trips set status = 'closed'
where status = 'open' and depart_date < current_date;
