-- 1) More parcel categories: cosmetics & hair, baby items, shoes & bags —
--    the things the diaspora actually sends home.

alter table public.parcels drop constraint parcels_category_check;
alter table public.parcels add constraint parcels_category_check check (
  category in ('documents','clothing','electronics','food','medicine',
               'gifts','books','cosmetics','baby','shoes','other')
);

alter table public.trips drop constraint trips_categories_check;
alter table public.trips add constraint trips_categories_check check (
  categories <> '{}'
  and categories <@ array['documents','clothing','electronics','food',
                          'medicine','gifts','books','cosmetics','baby',
                          'shoes','other']::text[]
);

-- 2) Delivery-confirmation emails. When the receiver's code releases a
--    delivery, ping the delivery-emails edge function (via pg_net) which
--    emails both parties through Resend. Secret header stops third parties
--    invoking the function; a failed HTTP call never blocks the release.

create extension if not exists pg_net;

create or replace function public.notify_match_released()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'released' and new.status is distinct from old.status then
    perform net.http_post(
      url := 'https://bltaaidjhpkmwnsprenu.supabase.co/functions/v1/delivery-emails',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-hook-secret', 'khook_4f2bb1de88c94ab5a7e31c60d2f9a8e7'
      ),
      body := jsonb_build_object('match_id', new.id)
    );
  end if;
  return new;
end;
$$;

drop trigger if exists matches_notify_released on public.matches;
create trigger matches_notify_released
  after update on public.matches
  for each row execute function public.notify_match_released();
