-- Receipt feedback is separate from the handover state machine. No historical
-- inspection, completion, capacity or money record is rewritten.
create table private.delivery_feedback (
 match_id uuid not null references public.matches(id),
 user_id uuid not null references public.profiles(id),
 outcome text not null check(outcome in ('received','missing_items','not_received')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 primary key(match_id,user_id)
);
alter table private.delivery_feedback enable row level security;
revoke all on private.delivery_feedback from public,anon,authenticated,service_role;
alter table private.delivery_reports add column photo_paths text[] not null default '{}',
 add column received_weight_kg numeric check(received_weight_kg between 0 and 1000);
alter table private.delivery_reports drop constraint delivery_reports_reason_check;
alter table private.delivery_reports add constraint delivery_reports_reason_check check(reason in('not_received','missing_items','damaged','payment','safety','other'));

create function private.accepted_delivery(p_match uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.matches m join public.trips t on t.id=m.trip_id join public.parcels p on p.id=m.parcel_id
 where m.id=p_match and auth.uid() in(t.traveler_id,p.sender_id) and
 (m.status in('accepted','escrow_paid','picked_up','in_transit','delivered','released','disputed') or
 (m.status='cancelled' and exists(select 1 from private.delivery_events e where e.match_id=m.id and e.status='accepted'))));
$$;
create function private.can_review_delivery(p_match uuid) returns boolean language sql stable security definer set search_path='' as $$
 select private.accepted_delivery(p_match) and exists(select 1 from public.matches m join public.trips t on t.id=m.trip_id join public.parcels p on p.id=m.parcel_id
 where m.id=p_match and (m.status in('delivered','released','cancelled','disputed')
 or current_date > greatest(t.depart_date,p.needed_by)
 or exists(select 1 from private.delivery_reports r where r.match_id=m.id and r.reason='missing_items')
 or exists(select 1 from private.delivery_feedback f where f.match_id=m.id and f.outcome in('received','missing_items'))));
$$;
revoke all on function private.accepted_delivery(uuid),private.can_review_delivery(uuid) from public,anon,authenticated,service_role;
grant execute on function private.can_review_delivery(uuid) to authenticated;

-- Same eligibility in the API and INSERT policy. Open complaints never censor
-- a review. Existing author/subject binding and one-review-per-person remain.
drop trigger reviews_trust_guard on public.reviews;
drop function private.guard_reported_review();
drop policy "parties review each other after release" on public.reviews;
create policy "parties review genuine delivery experiences" on public.reviews for insert to authenticated with check (
 author_id=(select auth.uid()) and author_id<>subject_id
 and subject_id=public.match_counterparty(match_id,(select auth.uid()))
 and private.can_review_delivery(match_id)
);

create function private.my_delivery_feedback() returns jsonb language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object('match_id',m.id,'can_review',private.can_review_delivery(m.id),
 'can_report_receipt',p.sender_id=auth.uid() and private.accepted_delivery(m.id),
 'outcome',f.outcome)), '[]'::jsonb)
 from public.matches m join public.trips t on t.id=m.trip_id join public.parcels p on p.id=m.parcel_id
 left join private.delivery_feedback f on f.match_id=m.id and f.user_id=auth.uid()
 where auth.uid() in(t.traveler_id,p.sender_id);
$$;
create function public.my_delivery_feedback() returns jsonb language sql security invoker set search_path='' as $$ select private.my_delivery_feedback(); $$;
revoke all on function private.my_delivery_feedback(),public.my_delivery_feedback() from public,anon;
grant execute on function private.my_delivery_feedback(),public.my_delivery_feedback() to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values('delivery-report-photos','delivery-report-photos',false,8388608,array['image/jpeg','image/png','image/webp']);
create function private.can_upload_report_photo(p_name text) returns boolean language plpgsql stable security definer set search_path='' as $$
declare parts text[]:=string_to_array(p_name,'/');
begin
 if auth.uid() is null or array_length(parts,1)<>3 or parts[1]<>auth.uid()::text
 or parts[2]!~'^[0-9a-f-]{36}$' or parts[3]!~'^[0-9a-f-]{36}\.(jpg|png|webp)$' then return false; end if;
 return exists(select 1 from public.matches m join public.trips t on t.id=m.trip_id join public.parcels p on p.id=m.parcel_id
 where m.id::text=parts[2] and auth.uid() in(t.traveler_id,p.sender_id));
end $$;
create function private.can_read_report_photo(p_name text) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and (private.can_upload_report_photo(p_name) or
 (public.is_admin() and auth.jwt()->>'aal'='aal2' and exists(select 1 from private.delivery_reports r where p_name=any(r.photo_paths))));
$$;
revoke all on function private.can_upload_report_photo(text),private.can_read_report_photo(text) from public,anon;
grant execute on function private.can_upload_report_photo(text),private.can_read_report_photo(text) to authenticated;
create policy "report photos uploaded by booking party" on storage.objects for insert to authenticated with check(bucket_id='delivery-report-photos' and private.can_upload_report_photo(name));
create policy "report photos private to uploader and secure support" on storage.objects for select to authenticated using(bucket_id='delivery-report-photos' and private.can_read_report_photo(name));
-- No update/delete policy: submitted evidence cannot be replaced or erased.

create function private.report_delivery_details(p_match uuid,p_reason text,p_details text,p_photos text[],p_received_weight numeric) returns uuid language plpgsql security definer set search_path='' as $$
declare m public.matches; v_id uuid; v_path text;
begin
 if auth.uid() is null then raise exception 'Not signed in'; end if;
 select * into m from public.matches where id=p_match for update;
 if not found or not exists(select 1 from public.trips t,public.parcels p where t.id=m.trip_id and p.id=m.parcel_id and auth.uid() in(t.traveler_id,p.sender_id)) then raise exception 'Not allowed'; end if;
 select id into v_id from private.delivery_reports where match_id=p_match and reporter_id=auth.uid();
 if v_id is not null then return v_id; end if;
 if (select count(*) from private.delivery_reports where reporter_id=auth.uid() and created_at>now()-interval '1 day')>=20 then raise exception 'Too many reports today. Contact hello@kifurushiapp.com.'; end if;
 if p_reason not in('not_received','missing_items','damaged','payment','safety','other') or p_reason is null then raise exception 'Choose a reason'; end if;
 if char_length(trim(coalesce(p_details,''))) not between 10 and 2000 then raise exception 'Describe the problem in 10 to 2000 characters'; end if;
 if p_received_weight is not null and not(p_received_weight between 0 and 1000) then raise exception 'Invalid received weight'; end if;
 if cardinality(coalesce(p_photos,'{}'))>6 then raise exception 'Add up to six photos'; end if;
 foreach v_path in array coalesce(p_photos,'{}') loop
  if v_path is null or not private.can_upload_report_photo(v_path) or split_part(v_path,'/',2)<>p_match::text or not exists(select 1 from storage.objects where bucket_id='delivery-report-photos' and name=v_path) then raise exception 'Invalid report photo'; end if;
 end loop;
 insert into private.delivery_reports(match_id,reporter_id,reason,details,snapshot,photo_paths,received_weight_kg)
 values(p_match,auth.uid(),p_reason,trim(p_details),private.delivery_evidence(p_match),coalesce(p_photos,'{}'),p_received_weight) returning id into v_id;
 insert into private.trust_audit(actor_id,action,detail) values(auth.uid(),'delivery_report',jsonb_build_object('report_id',v_id,'match_id',p_match));
 insert into public.incidents(kind,severity,source,summary,detail,user_id) values('delivery_report','severe','server','A delivery problem needs support review',jsonb_build_object('report_id',v_id,'match_id',p_match),auth.uid());
 return v_id;
end $$;
create or replace function private.report_delivery(p_match uuid,p_reason text,p_details text) returns uuid language sql security definer set search_path='' as $$ select private.report_delivery_details(p_match,p_reason,p_details,'{}',null); $$;
create function public.report_delivery_details(p_match uuid,p_reason text,p_details text,p_photos text[],p_received_weight numeric) returns uuid language sql security invoker set search_path='' as $$ select private.report_delivery_details(p_match,p_reason,p_details,p_photos,p_received_weight); $$;
revoke all on function private.report_delivery_details(uuid,text,text,text[],numeric),public.report_delivery_details(uuid,text,text,text[],numeric) from public,anon;
grant execute on function private.report_delivery_details(uuid,text,text,text[],numeric),public.report_delivery_details(uuid,text,text,text[],numeric) to authenticated;

create function private.record_delivery_feedback(p_match uuid,p_outcome text,p_details text,p_photos text[],p_received_weight numeric) returns void language plpgsql security definer set search_path='' as $$
declare v_report uuid; v_previous text;
begin
 perform 1 from public.matches where id=p_match for update;
 if not private.accepted_delivery(p_match) or not exists(select 1 from public.matches m join public.parcels p on p.id=m.parcel_id where m.id=p_match and p.sender_id=auth.uid()) then raise exception 'Only the sender on an accepted booking can report receipt'; end if;
 if p_outcome not in('received','missing_items','not_received') or p_outcome is null then raise exception 'Choose a delivery outcome'; end if;
 if p_outcome='received' then
  if exists(select 1 from private.delivery_reports where match_id=p_match and status<>'resolved') then raise exception 'Contact support to update receipt while a report is open'; end if;
 else
  v_report:=private.report_delivery_details(p_match,p_outcome,p_details,p_photos,p_received_weight);
 end if;
 select outcome into v_previous from private.delivery_feedback where match_id=p_match and user_id=auth.uid();
 -- Retain the original complaint when retrying or submitting in another tab.
 if v_report is not null then select reason into p_outcome from private.delivery_reports where id=v_report;
  if p_outcome not in('missing_items','not_received') then raise exception 'An existing report needs support review'; end if;
 end if;
 insert into private.delivery_feedback(match_id,user_id,outcome) values(p_match,auth.uid(),p_outcome)
 on conflict(match_id,user_id) do update set outcome=excluded.outcome,updated_at=now();
 if p_outcome='received' and exists(select 1 from public.matches where id=p_match and status in('picked_up','in_transit','delivered')) then
  perform public.sender_confirm_delivery(p_match);
 end if;
 if v_previous is distinct from p_outcome then
 insert into private.trust_audit(actor_id,action,detail) values(auth.uid(),'delivery_feedback',jsonb_build_object('match_id',p_match,'previous',v_previous,'outcome',p_outcome,'report_id',v_report));
 end if;
end $$;
create function public.record_delivery_feedback(p_match uuid,p_outcome text,p_details text default '',p_photos text[] default '{}',p_received_weight numeric default null) returns void language sql security invoker set search_path='' as $$ select private.record_delivery_feedback(p_match,p_outcome,p_details,p_photos,p_received_weight); $$;
revoke all on function private.record_delivery_feedback(uuid,text,text,text[],numeric),public.record_delivery_feedback(uuid,text,text,text[],numeric) from public,anon;
grant execute on function private.record_delivery_feedback(uuid,text,text,text[],numeric),public.record_delivery_feedback(uuid,text,text,text[],numeric) to authenticated;

-- Add only the caller's own evidence to the existing private case response.
create or replace function private.my_delivery_report(p_match uuid) returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not exists(select 1 from public.matches m join public.trips t on t.id=m.trip_id join public.parcels p on p.id=m.parcel_id where m.id=p_match and auth.uid() in(t.traveler_id,p.sender_id)) then raise exception 'Not allowed'; end if;
 return jsonb_build_object('my_verified',(select id_verified from public.profiles where id=auth.uid()),
 'partner_verified',(select pr.id_verified from public.matches m join public.trips t on t.id=m.trip_id join public.parcels p on p.id=m.parcel_id join public.profiles pr on pr.id=case when auth.uid()=t.traveler_id then p.sender_id else t.traveler_id end where m.id=p_match),
 'on_hold',exists(select 1 from private.delivery_reports where match_id=p_match and status<>'resolved'),
 'report',(select jsonb_build_object('id',id,'status',status,'resolution',resolution,'reason',reason,'created_at',created_at,'photo_paths',photo_paths,'received_weight_kg',received_weight_kg) from private.delivery_reports where match_id=p_match and reporter_id=auth.uid()));
end $$;
