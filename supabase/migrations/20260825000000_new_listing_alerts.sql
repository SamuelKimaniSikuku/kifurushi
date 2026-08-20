-- Fire the instant new-listing alerts. The post-parcel form has promised
-- "travellers on your route get notified" since launch; this makes it true,
-- and gives senders the mirror when a fitting trip appears. AFTER INSERT via
-- pg_net, so a slow or failed notification can never block a post.

create or replace function public.notify_new_listing()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform net.http_post(
    url := 'https://bltaaidjhpkmwnsprenu.supabase.co/functions/v1/new-listing-alerts',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-hook-secret', 'kalert_732392037f5632f3aa32111dec61eeb4'
    ),
    body := jsonb_build_object('kind', tg_argv[0], 'id', new.id)
  );
  return new;
end;
$$;

drop trigger if exists parcels_new_listing on public.parcels;
create trigger parcels_new_listing
  after insert on public.parcels
  for each row execute function public.notify_new_listing('parcel');

drop trigger if exists trips_new_listing on public.trips;
create trigger trips_new_listing
  after insert on public.trips
  for each row execute function public.notify_new_listing('trip');
