alter table public.parcels add column if not exists nudged_check_at timestamptz;
alter table public.trips add column if not exists nudged_check_at timestamptz;
-- Private delivery accounting: provider acceptance and signed-in visits, never tracking pixels.
alter table public.matches add column if not exists request_first_nudged_at timestamptz;
alter table public.parcels add column if not exists availability_confirmed_at timestamptz;
alter table public.trips add column if not exists availability_confirmed_at timestamptz;
create table public.notification_deliveries (
 id uuid primary key default gen_random_uuid(),
 dedup_key text not null unique,
 recipient_id uuid not null references public.profiles(id) on delete cascade,
 match_id uuid references public.matches(id) on delete set null,
 kind text not null,
 reminder boolean not null default false,
 status text not null default 'sending' check(status in ('sending','sent','failed')),
 claimed_at timestamptz not null default now(),
 sent_at timestamptz,
 visited_at timestamptz,
 provider_id text
);
create index notification_recipient_time on public.notification_deliveries(recipient_id,claimed_at desc);
create index notification_match on public.notification_deliveries(match_id);
alter table public.notification_deliveries enable row level security;
revoke all on public.notification_deliveries from public, anon, authenticated;
grant all on public.notification_deliveries to service_role;
create policy "service records delivery" on public.notification_deliveries to service_role using(true) with check(true);

create function public.claim_notification(p_key text,p_recipient uuid,p_kind text,p_match uuid default null,p_reminder boolean default false)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare n public.notification_deliveries;
begin
 -- Serialize claims for each recipient; reminders at most once per 24 hours.
 perform pg_advisory_xact_lock(hashtextextended(p_recipient::text,0));
 select * into n from public.notification_deliveries where dedup_key=p_key for update;
 if found then
  if n.status='sent' then return jsonb_build_object('id',n.id,'state','sent'); end if;
  if n.status='sending' and n.claimed_at>now()-interval '10 minutes' then return jsonb_build_object('state','busy'); end if;
 end if;
 if p_reminder and exists(select 1 from public.notification_deliveries where recipient_id=p_recipient and reminder and id is distinct from n.id and ((status='sent' and sent_at>now()-interval '24 hours') or (status='sending' and claimed_at>now()-interval '10 minutes'))) then
  return jsonb_build_object('state','cooldown');
 end if;
 insert into public.notification_deliveries(dedup_key,recipient_id,kind,match_id,reminder) values(p_key,p_recipient,p_kind,p_match,p_reminder)
 on conflict(dedup_key) do update set status='sending',claimed_at=now()
 returning * into n;
 return jsonb_build_object('id',n.id,'state','claimed');
end $$;
revoke all on function public.claim_notification(text,uuid,text,uuid,boolean) from public,anon,authenticated;
grant execute on function public.claim_notification(text,uuid,text,uuid,boolean) to service_role;

create function private.record_notification_visit(p_id uuid) returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Sign in required'; end if;
 update public.notification_deliveries set visited_at=coalesce(visited_at,now()) where id=p_id and recipient_id=auth.uid() and status='sent';
end $$;
create function public.record_notification_visit(p_id uuid) returns void language sql security invoker set search_path='' as $$select private.record_notification_visit(p_id)$$;
revoke all on function private.record_notification_visit(uuid),public.record_notification_visit(uuid) from public,anon;
grant execute on function private.record_notification_visit(uuid),public.record_notification_visit(uuid) to authenticated;

-- Owner controls cannot cancel an existing delivery or reopen a closed listing.
create function public.confirm_listing(p_kind text,p_id uuid,p_action text) returns void language plpgsql security invoker set search_path='' as $$
declare owner_id uuid; listing_status text; listing_date date;
begin
 if auth.uid() is null or p_kind not in ('parcel','trip') or p_action not in ('confirm','close') then raise exception 'Invalid action'; end if;
 if p_kind='parcel' then
  select sender_id,status,needed_by into owner_id,listing_status,listing_date from public.parcels where id=p_id for update;
 else
  select traveler_id,status,depart_date into owner_id,listing_status,listing_date from public.trips where id=p_id for update;
 end if;
 if owner_id is distinct from auth.uid() then raise exception 'Only the listing owner can do this'; end if;
 if listing_status<>'open' then raise exception 'This listing is no longer open'; end if;
 if exists(select 1 from public.matches where (case when p_kind='parcel' then parcel_id else trip_id end)=p_id and status in ('accepted','escrow_paid','picked_up','in_transit','delivered','released','disputed')) then raise exception 'Manage the existing delivery in Messages'; end if;
 if p_action='confirm' and listing_date<current_date then raise exception 'Update the date first'; end if;
 if p_kind='parcel' then
  update public.parcels set availability_confirmed_at=now(), status=case when p_action='close' then 'closed' else status end where id=p_id;
 else
  update public.trips set availability_confirmed_at=now(), status=case when p_action='close' then 'closed' else status end where id=p_id;
 end if;
end $$;
revoke all on function public.confirm_listing(text,uuid,text) from public,anon;
grant execute on function public.confirm_listing(text,uuid,text) to authenticated;

create function private.admin_matching_metrics() returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
 if auth.uid() is null or not public.is_admin() or coalesce(auth.jwt()->>'aal','')<>'aal2' then raise exception 'Administrator verification required'; end if;
 select jsonb_build_object(
  'period_days',30,
  'parcels',(select count(*) from public.parcels where created_at>now()-interval '30 days'),
  'trips',(select count(*) from public.trips where created_at>now()-interval '30 days'),
  'requests',(select count(*) from public.matches where created_at>now()-interval '30 days'),
  'replied',(select count(*) from public.matches m where m.created_at>now()-interval '30 days' and exists(select 1 from public.messages msg where msg.match_id=m.id and msg.sender_id<>m.requester_id)),
  'bookings',(select count(*) from public.matches where created_at>now()-interval '30 days' and status in ('accepted','escrow_paid','picked_up','in_transit','delivered','released','disputed')),
  'emails_sent',(select count(*) from public.notification_deliveries where sent_at>now()-interval '30 days' and status='sent'),
  'emails_visited',(select count(*) from public.notification_deliveries where sent_at>now()-interval '30 days' and visited_at is not null),
  'unanswered',(select count(*) from public.matches m join public.trips t on t.id=m.trip_id join public.parcels p on p.id=m.parcel_id where m.status='requested' and t.status='open' and p.status='open' and t.depart_date>=current_date and p.needed_by>=current_date and not exists(select 1 from public.messages msg where msg.match_id=m.id and msg.sender_id<>m.requester_id)),
  'expired_parcels',(select count(*) from public.parcels where status='open' and needed_by<current_date)
 ) into result;
 return result;
end $$;
create function public.admin_matching_metrics() returns jsonb language sql security invoker set search_path='' as $$select private.admin_matching_metrics()$$;
revoke all on function private.admin_matching_metrics(),public.admin_matching_metrics() from public,anon;
grant execute on function private.admin_matching_metrics(),public.admin_matching_metrics() to authenticated;

-- Recheck matching audiences when the owner changes the route, date or size.
-- Per-recipient notification keys prevent repeatedly emailing the same listing.
create trigger parcels_changed_listing after update of from_country,to_country,needed_by,weight_kg,categories on public.parcels
for each row when (new.status='open' and (old.from_country,old.to_country,old.needed_by,old.weight_kg,old.categories) is distinct from (new.from_country,new.to_country,new.needed_by,new.weight_kg,new.categories)) execute function public.notify_new_listing();
create trigger trips_changed_listing after update of from_country,to_country,depart_date,space_kg,categories on public.trips
for each row when (new.status='open' and (old.from_country,old.to_country,old.depart_date,old.space_kg,old.categories) is distinct from (new.from_country,new.to_country,new.depart_date,new.space_kg,new.categories)) execute function public.notify_new_listing();
-- Existing parcel editing grants are column-scoped; retain owner RLS.
grant update(availability_confirmed_at) on public.parcels to authenticated;
