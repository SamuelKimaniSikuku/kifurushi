-- Give the alert endpoint its own hook secret instead of borrowing the
-- delivery one. Sharing a secret between two functions means one leak opens
-- both, and these have very different blast radii: delivery-emails writes to
-- customers, alert-emails writes to us.
--
-- Both secrets sit in migration files, and therefore in git. That's a
-- pre-existing weakness worth moving to Supabase Vault later — noted rather
-- than silently carried forward.

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
        'x-hook-secret', 'kalert_732392037f5632f3aa32111dec61eeb4'
      ),
      body := jsonb_build_object('mode', 'instant', 'incident_id', new.id)
    );
  end if;
  return new;
end;
$$;

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
      'x-hook-secret', 'kalert_732392037f5632f3aa32111dec61eeb4'
    ),
    body := jsonb_build_object('mode', 'digest')
  );
  $$
);
