-- Private trust records. No raw identity documents, public phone numbers or
-- automatic bans based on allegations. Privileged writes are transactional.
create table private.identity_secret (id boolean primary key default true check(id), secret bytea not null);
insert into private.identity_secret values(true, extensions.gen_random_bytes(32));
create table private.identity_claims (
  fingerprint text primary key, user_id uuid not null, created_at timestamptz not null default now()
);
create table private.account_restrictions (
  user_id uuid primary key references public.profiles(id), reason text not null,
  created_by uuid not null, created_at timestamptz not null default now()
);
create table private.trust_audit (
  id bigint generated always as identity primary key, actor_id uuid,
  subject_id uuid, action text not null, detail jsonb not null default '{}', created_at timestamptz not null default now()
);
create table private.delivery_events (
  id bigint generated always as identity primary key, match_id uuid not null,
  actor_id uuid, status text not null, evidence jsonb, created_at timestamptz not null default now()
);
create table private.delivery_reports (
  id uuid primary key default gen_random_uuid(), match_id uuid not null references public.matches(id),
  reporter_id uuid not null references public.profiles(id),
  reason text not null check(reason in ('not_received','damaged','payment','safety','other')),
  details text not null check(char_length(details) between 10 and 2000),
  status text not null default 'open' check(status in ('open','reviewing','resolved')),
  snapshot jsonb not null, resolution text, created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(), unique(match_id, reporter_id)
);
create index delivery_reports_queue_idx on private.delivery_reports(status,created_at);
create index delivery_events_match_idx on private.delivery_events(match_id,created_at);
-- Defence in depth, even though private is not an exposed API schema.
alter table private.identity_secret enable row level security;
alter table private.identity_claims enable row level security;
alter table private.account_restrictions enable row level security;
alter table private.trust_audit enable row level security;
alter table private.delivery_events enable row level security;
alter table private.delivery_reports enable row level security;
revoke all on private.identity_secret, private.identity_claims, private.account_restrictions,
  private.trust_audit, private.delivery_events, private.delivery_reports from public,anon,authenticated,service_role;

create function private.apply_identity_decision(p_session text,p_status text,p_duplicate_sessions text[],p_duplicate_flag boolean,p_document text,p_actor uuid,p_note text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_uid uuid; v_status text:=p_status; v_reason text; v_fingerprint text; v_owner uuid;
begin
  if p_status not in ('verified','rejected','in_review') then raise exception 'Invalid decision'; end if;
  -- All approvals, including parallel manual/webhook approvals, share this lock.
  perform pg_advisory_xact_lock(86101601);
  select user_id into v_uid from public.verifications where provider='didit' and provider_ref=p_session limit 1;
  if v_uid is null then raise exception 'Unknown verification session'; end if;
  if exists(select 1 from public.verifications where provider='didit' and provider_ref=p_session and user_id<>v_uid) then
    raise exception 'Ambiguous verification session';
  end if;
  if p_actor is not null then
    if not exists(select 1 from public.admins where user_id=p_actor) then raise exception 'Not allowed'; end if;
    if not exists(select 1 from public.verifications where provider='didit' and provider_ref=p_session and status='in_review') then
      raise exception 'Already resolved';
    end if;
  end if;
  if p_status in ('verified','in_review') then
    if exists(select 1 from private.account_restrictions where user_id=v_uid) then
      v_status:='in_review'; v_reason:='account_restricted';
    elsif exists(select 1 from public.verifications where provider='didit' and provider_ref=any(coalesce(p_duplicate_sessions,'{}')) and user_id<>v_uid) then
      -- Face similarity is a reason to investigate, not proof of fraud.
      v_status:='in_review'; v_reason:='possible_duplicate';
    elsif p_duplicate_flag and (coalesce(cardinality(p_duplicate_sessions),0)=0 or exists(
      select 1 from unnest(p_duplicate_sessions) ref where not exists(select 1 from public.verifications where provider='didit' and provider_ref=ref and user_id=v_uid)
    )) then
      v_status:='in_review'; v_reason:='possible_duplicate';
    end if;
    if nullif(p_document,'') is not null then
      select encode(extensions.hmac(convert_to(p_document,'UTF8'),secret,'sha256'),'hex') into v_fingerprint from private.identity_secret where id;
      select user_id into v_owner from private.identity_claims where fingerprint=v_fingerprint;
      if v_owner is not null and v_owner<>v_uid then v_status:='in_review'; v_reason:='possible_duplicate'; end if;
    end if;
    if v_status='verified' and v_fingerprint is not null then
      insert into private.identity_claims(fingerprint,user_id) values(v_fingerprint,v_uid) on conflict do nothing;
    end if;
  end if;
  if v_status='rejected' then v_reason:=left(coalesce(nullif(p_note,''),'provider_declined'),200); end if;
  update public.verifications set status=v_status, decline_reason=v_reason,
    resolved_at=case when v_status='in_review' then null else now() end
    where provider='didit' and provider_ref=p_session;
  update public.profiles set id_verified=(
    v_status='verified'
    and (select status='verified' from public.verifications where user_id=v_uid order by created_at desc,id desc limit 1)
    and not exists(select 1 from private.account_restrictions where user_id=v_uid)
    and not exists(select 1 from public.verifications where user_id=v_uid and decline_reason in ('possible_duplicate','account_restricted') and status='in_review')
  ) where id=v_uid;
  insert into private.trust_audit(actor_id,subject_id,action,detail)
    values(p_actor,v_uid,'identity_decision',jsonb_build_object('session',p_session,'status',v_status,'reason',v_reason));
  return jsonb_build_object('status',v_status,'reason',v_reason);
end $$;
create function public.apply_identity_decision(p_session text,p_status text,p_duplicate_sessions text[],p_duplicate_flag boolean,p_document text,p_actor uuid default null,p_note text default '')
returns jsonb language sql security invoker set search_path='' as $$
 select private.apply_identity_decision(p_session,p_status,p_duplicate_sessions,p_duplicate_flag,p_document,p_actor,p_note);
$$;
revoke all on function private.apply_identity_decision(text,text,text[],boolean,text,uuid,text), public.apply_identity_decision(text,text,text[],boolean,text,uuid,text) from public,anon,authenticated;
grant usage on schema private to service_role;
grant execute on function private.apply_identity_decision(text,text,text[],boolean,text,uuid,text), public.apply_identity_decision(text,text,text[],boolean,text,uuid,text) to service_role;

-- Read only the authenticated user's confirmed Auth phone. Never trust a
-- profile field or user_metadata as proof of ownership.
create function private.my_phone_verification() returns jsonb language plpgsql security definer set search_path='' as $$
declare u auth.users;
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  select * into u from auth.users where id=auth.uid();
  return jsonb_build_object('phone',case when u.phone_confirmed_at is not null and nullif(u.phone,'') is not null then '+'||ltrim(u.phone,'+') else null end,
    'verified',u.phone_confirmed_at is not null and nullif(u.phone,'') is not null);
end $$;
create function public.my_phone_verification() returns jsonb language sql security invoker set search_path='' as $$ select private.my_phone_verification(); $$;
revoke all on function private.my_phone_verification(),public.my_phone_verification() from public,anon;
grant execute on function private.my_phone_verification(),public.my_phone_verification() to authenticated;

create function private.delivery_evidence(p_match uuid) returns jsonb language sql security definer set search_path='' as $$
select jsonb_build_object(
 'match',to_jsonb(m)-'code_hash'-'code_attempts'-'code_locked_until',
 'trip',to_jsonb(t),'parcel',to_jsonb(p),
 'people',(select jsonb_agg(jsonb_build_object('id',pr.id,'name',pr.full_name,'id_verified',pr.id_verified,
    'phone',case when u.phone_confirmed_at is not null and nullif(u.phone,'') is not null then u.phone end,'phone_verified',u.phone_confirmed_at is not null and nullif(u.phone,'') is not null,
    'contact_number',pc.phone,'whatsapp',cd.whatsapp_e164,
    'verification_sessions',(select jsonb_agg(jsonb_build_object('provider',v.provider,'reference',v.provider_ref,'status',v.status)) from public.verifications v where v.user_id=pr.id)
 )) from public.profiles pr join auth.users u on u.id=pr.id left join public.private_contacts pc on pc.user_id=pr.id
 left join public.contact_details cd on cd.user_id=pr.id where pr.id in (t.traveler_id,p.sender_id)),
 'declarations',(select jsonb_agg(to_jsonb(d)) from public.parcel_declarations d where d.parcel_id=p.id),
 'inspections',(select jsonb_agg(to_jsonb(i)) from public.match_inspections i where i.match_id=m.id),
 'messages',(select jsonb_agg(to_jsonb(msg) order by msg.created_at) from public.messages msg where msg.match_id=m.id),
 'events',(select jsonb_agg(to_jsonb(ev)-'evidence' order by ev.created_at) from private.delivery_events ev where ev.match_id=m.id)
) from public.matches m join public.trips t on t.id=m.trip_id join public.parcels p on p.id=m.parcel_id where m.id=p_match;
$$;
revoke all on function private.delivery_evidence(uuid) from public,anon,authenticated,service_role;

create function private.report_delivery(p_match uuid,p_reason text,p_details text) returns uuid language plpgsql security definer set search_path='' as $$
declare m public.matches; v_id uuid;
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  select * into m from public.matches where id=p_match for update;
  if not found or not exists(select 1 from public.trips t,public.parcels p where t.id=m.trip_id and p.id=m.parcel_id and auth.uid() in (t.traveler_id,p.sender_id)) then raise exception 'Not allowed'; end if;
  select id into v_id from private.delivery_reports where match_id=p_match and reporter_id=auth.uid();
  if v_id is not null then return v_id; end if;
  if (select count(*) from private.delivery_reports where reporter_id=auth.uid() and created_at>now()-interval '1 day')>=20 then raise exception 'Too many reports today. Contact hello@kifurushiapp.com.'; end if;
  if p_reason not in ('not_received','damaged','payment','safety','other') or p_reason is null then raise exception 'Choose a reason'; end if;
  if char_length(trim(coalesce(p_details,''))) not between 10 and 2000 then raise exception 'Describe the problem in 10 to 2000 characters'; end if;
  insert into private.delivery_reports(match_id,reporter_id,reason,details,snapshot)
    values(p_match,auth.uid(),p_reason,trim(p_details),private.delivery_evidence(p_match)) returning id into v_id;
  insert into private.trust_audit(actor_id,action,detail) values(auth.uid(),'delivery_report',jsonb_build_object('report_id',v_id,'match_id',p_match));
  insert into public.incidents(kind,severity,source,summary,detail,user_id) values('delivery_report','severe','server','A delivery problem needs support review',jsonb_build_object('report_id',v_id,'match_id',p_match),auth.uid());
  return v_id;
end $$;
create function public.report_delivery(p_match uuid,p_reason text,p_details text) returns uuid language sql security invoker set search_path='' as $$ select private.report_delivery(p_match,p_reason,p_details); $$;
create function private.my_delivery_report(p_match uuid) returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not exists(select 1 from public.matches m join public.trips t on t.id=m.trip_id join public.parcels p on p.id=m.parcel_id where m.id=p_match and auth.uid() in(t.traveler_id,p.sender_id)) then raise exception 'Not allowed'; end if;
 return jsonb_build_object('my_verified',(select id_verified from public.profiles where id=auth.uid()),
   'partner_verified',(select pr.id_verified from public.matches m join public.trips t on t.id=m.trip_id join public.parcels p on p.id=m.parcel_id join public.profiles pr on pr.id=case when auth.uid()=t.traveler_id then p.sender_id else t.traveler_id end where m.id=p_match),
   'on_hold',exists(select 1 from private.delivery_reports where match_id=p_match and status<>'resolved'),
   'report',(select jsonb_build_object('id',id,'status',status,'resolution',resolution,'reason',reason,'created_at',created_at) from private.delivery_reports where match_id=p_match and reporter_id=auth.uid()));
end $$;
create function public.my_delivery_report(p_match uuid) returns jsonb language sql security invoker set search_path='' as $$ select private.my_delivery_report(p_match); $$;
revoke all on function private.report_delivery(uuid,text,text),public.report_delivery(uuid,text,text),private.my_delivery_report(uuid),public.my_delivery_report(uuid) from public,anon;
grant execute on function private.report_delivery(uuid,text,text),public.report_delivery(uuid,text,text),private.my_delivery_report(uuid),public.my_delivery_report(uuid) to authenticated;

-- Admin-only case access and actions; every operation rechecks membership.
create function private.admin_delivery_reports(p_id uuid default null) returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if not public.is_admin() then raise exception 'Not allowed'; end if;
 if coalesce(auth.jwt()->>'aal','')<>'aal2' then raise exception 'Confirm your administrator authenticator code'; end if;
 if p_id is null then return coalesce((select jsonb_agg(row_to_json(r)) from (
  select dr.id,dr.match_id,dr.reporter_id,dr.reason,dr.details,dr.status,dr.created_at,dr.resolution,
   pr.full_name as reporter_name, dr.snapshot->'trip'->>'from_city' as from_city,dr.snapshot->'trip'->>'to_city' as to_city
  from private.delivery_reports dr join public.profiles pr on pr.id=dr.reporter_id order by (dr.status='resolved'),dr.created_at desc limit 100
 ) r),'[]'::jsonb); end if;
 insert into private.trust_audit(actor_id,action,detail) values(auth.uid(),'view_case',jsonb_build_object('report_id',p_id));
 return (select to_jsonb(dr)||jsonb_build_object('current_evidence',private.delivery_evidence(dr.match_id),
   'handover_record',(select evidence from private.delivery_events where match_id=dr.match_id and status='picked_up' order by created_at limit 1),
   'restrictions',(select jsonb_agg(to_jsonb(ar)) from private.account_restrictions ar where ar.user_id in (
     select t.traveler_id from public.matches m join public.trips t on t.id=m.trip_id where m.id=dr.match_id
     union select p.sender_id from public.matches m join public.parcels p on p.id=m.parcel_id where m.id=dr.match_id)))
   from private.delivery_reports dr where id=p_id);
end $$;
create function public.admin_delivery_reports(p_id uuid default null) returns jsonb language sql security invoker set search_path='' as $$ select private.admin_delivery_reports(p_id); $$;
create function private.review_delivery_report(p_id uuid,p_status text,p_note text,p_restrict uuid default null,p_lift boolean default false) returns void language plpgsql security definer set search_path='' as $$
declare r private.delivery_reports;
begin
 if not public.is_admin() then raise exception 'Not allowed'; end if;
 if coalesce(auth.jwt()->>'aal','')<>'aal2' then raise exception 'Confirm your administrator authenticator code'; end if;
 if p_status not in ('reviewing','resolved') or p_status is null then raise exception 'Invalid case status'; end if;
 if char_length(trim(coalesce(p_note,''))) not between 10 and 2000 then raise exception 'Add a review note (10 to 2000 characters)'; end if;
 select * into r from private.delivery_reports where id=p_id;
 if not found then raise exception 'Case not found'; end if;
 -- Match lock serialises report closure with receipt confirmation and reporting.
 perform 1 from public.matches where id=r.match_id for update;
 perform 1 from private.delivery_reports where id=p_id for update;
 if p_restrict is not null then
   if not exists(select 1 from public.matches m join public.trips t on t.id=m.trip_id join public.parcels p on p.id=m.parcel_id where m.id=r.match_id and p_restrict in(t.traveler_id,p.sender_id)) then raise exception 'Account is not part of this delivery'; end if;
   if p_lift then delete from private.account_restrictions where user_id=p_restrict;
   else insert into private.account_restrictions(user_id,reason,created_by) values(p_restrict,trim(p_note),auth.uid()) on conflict(user_id) do update set reason=excluded.reason,created_by=excluded.created_by,created_at=now(); end if;
 end if;
 update private.delivery_reports set status=p_status,resolution=trim(p_note),updated_at=now() where id=p_id;
 insert into private.trust_audit(actor_id,subject_id,action,detail) values(auth.uid(),p_restrict,'review_delivery_report',jsonb_build_object('report_id',p_id,'status',p_status,'note',trim(p_note),'lift',p_lift));
end $$;
create function public.review_delivery_report(p_id uuid,p_status text,p_note text,p_restrict uuid default null,p_lift boolean default false) returns void language sql security invoker set search_path='' as $$ select private.review_delivery_report(p_id,p_status,p_note,p_restrict,p_lift); $$;
revoke all on function private.admin_delivery_reports(uuid),public.admin_delivery_reports(uuid),private.review_delivery_report(uuid,text,text,uuid,boolean),public.review_delivery_report(uuid,text,text,uuid,boolean) from public,anon;
grant execute on function private.admin_delivery_reports(uuid),public.admin_delivery_reports(uuid),private.review_delivery_report(uuid,text,text,uuid,boolean),public.review_delivery_report(uuid,text,text,uuid,boolean) to authenticated;

create function private.guard_delivery_trust() returns trigger language plpgsql security definer set search_path='' as $$
declare v_sender uuid; v_traveler uuid;
begin
 if tg_op='UPDATE' and new.status is not distinct from old.status then return new; end if;
 select sender_id into v_sender from public.parcels where id=new.parcel_id;
 select traveler_id into v_traveler from public.trips where id=new.trip_id;
 if (tg_op='INSERT' or new.status='accepted') and exists(select 1 from private.account_restrictions where user_id in(v_sender,v_traveler)) then raise exception 'This account cannot start new deliveries. Contact Kifurushi support.'; end if;
 if new.status in ('picked_up','in_transit','delivered','released') and exists(select 1 from private.delivery_reports where match_id=new.id and status<>'resolved') then raise exception 'A delivery report is being reviewed. Contact Kifurushi support before continuing.'; end if;
 -- Existing parcels already in transit can finish; never invent past checks.
 if tg_op='UPDATE' and old.status in('requested','accepted','escrow_paid') and new.status in('picked_up','in_transit','delivered','released') then
   if not exists(select 1 from public.profiles where id=v_sender and id_verified) then raise exception 'The sender must complete identity verification before pickup.'; end if;
 end if;
 return new;
end $$;
create trigger matches_trust_guard before insert or update on public.matches for each row execute function private.guard_delivery_trust();
create function private.record_delivery_event() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if tg_op='INSERT' or new.status is distinct from old.status then
  insert into private.delivery_events(match_id,actor_id,status,evidence) values(new.id,auth.uid(),new.status,case when new.status='picked_up' then private.delivery_evidence(new.id) else null end);
 end if;
 return new;
end $$;
create trigger matches_trust_event after insert or update on public.matches for each row execute function private.record_delivery_event();
create function private.guard_restricted_listing() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if exists(select 1 from private.account_restrictions where user_id=case when tg_table_name='trips' then (to_jsonb(new)->>'traveler_id')::uuid else (to_jsonb(new)->>'sender_id')::uuid end) then
   raise exception 'This account cannot post new listings. Contact Kifurushi support.';
 end if;
 return new;
end $$;
create trigger trips_trust_guard before insert on public.trips for each row execute function private.guard_restricted_listing();
create trigger parcels_trust_guard before insert on public.parcels for each row execute function private.guard_restricted_listing();
revoke all on function private.guard_delivery_trust(),private.record_delivery_event(),private.guard_restricted_listing() from public,anon,authenticated,service_role;

create function private.guard_reported_review() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if exists(select 1 from private.delivery_reports where match_id=new.match_id and status<>'resolved') then raise exception 'Wait until the delivery report is resolved before reviewing.'; end if;
 return new;
end $$;
create trigger reviews_trust_guard before insert on public.reviews for each row execute function private.guard_reported_review();
revoke all on function private.guard_reported_review() from public,anon,authenticated,service_role;
