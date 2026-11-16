\set ON_ERROR_STOP on
begin;
insert into auth.users(id,email,raw_user_meta_data) values
 ('10000000-0000-4000-8000-000000000001','sender@test.invalid','{"full_name":"Test Sender"}'),
 ('20000000-0000-4000-8000-000000000002','traveller@test.invalid','{"full_name":"Test Traveller"}'),
 ('30000000-0000-4000-8000-000000000003','other@test.invalid','{"full_name":"Other Member"}');
insert into public.trips(id,traveler_id,from_country,from_city,to_country,to_city,depart_date,space_kg,price_per_kg,categories)
values('40000000-0000-4000-8000-000000000004','20000000-0000-4000-8000-000000000002','FR','Paris','KE','Nairobi',current_date+10,9,10,array['documents']);

set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
select jsonb_build_object('fromCountry','FR','fromCity','Paris','toCountry','KE','toCity','Nairobi','neededBy',(current_date+20)::text,'weightKg',null,'categories',jsonb_build_array('documents'),'description','Document in an envelope','budgetUsd',5) as payload \gset
select public.save_parcel(:'payload','[{"description":"Document in an envelope"}]',ARRAY[]::text[],true) as parcel_id \gset
select public.confirm_listing('parcel',:'parcel_id','confirm');
select test.ok((select availability_confirmed_at is not null from public.parcels where id=:'parcel_id'),'owner can confirm availability');
select set_config('request.jwt.claim.sub','30000000-0000-4000-8000-000000000003',true);
select test.denied(format('select public.confirm_listing(%L,%L,%L)','parcel',:'parcel_id','close'),'Only the listing owner','another member cannot close a parcel');
select test.denied('select * from public.notification_deliveries','permission denied','notification records are private');
select test.denied($q$select public.claim_notification('forged','30000000-0000-4000-8000-000000000003','fake')$q$,'permission denied','members cannot forge email metrics');
select test.denied('select public.admin_matching_metrics()','Administrator verification required','members cannot view admin metrics');
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
savepoint closing;
select public.confirm_listing('parcel',:'parcel_id','close');
select test.ok((select status='closed' from public.parcels where id=:'parcel_id'),'close removes an open listing');
select test.denied(format('select public.confirm_listing(%L,%L,%L)','parcel',:'parcel_id','confirm'),'no longer open','confirmation cannot reopen a closed listing');
rollback to closing;
insert into public.matches(id,trip_id,parcel_id,requester_id) values('50000000-0000-4000-8000-000000000005','40000000-0000-4000-8000-000000000004',:'parcel_id','10000000-0000-4000-8000-000000000001');
select set_config('request.jwt.claim.sub','20000000-0000-4000-8000-000000000002',true);
select public.respond_match('50000000-0000-4000-8000-000000000005',true);
select test.denied($q$select public.confirm_listing('trip','40000000-0000-4000-8000-000000000004','close')$q$,'Manage the existing delivery','closing a trip cannot cancel a booking');
select test.ok((select status='accepted' from public.matches where id='50000000-0000-4000-8000-000000000005'),'the accepted delivery is preserved');
reset role;
grant usage on schema test to service_role;
grant execute on all functions in schema test to service_role;
set local role service_role;
select public.claim_notification('test-one','10000000-0000-4000-8000-000000000001','request24','50000000-0000-4000-8000-000000000005',true) as claimed \gset
select test.ok(:'claimed'::jsonb->>'state'='claimed','service claims a notification');
select test.ok(public.claim_notification('test-one','10000000-0000-4000-8000-000000000001','request24',null,true)->>'state'='busy','concurrent duplicate is not sent');
update public.notification_deliveries set status='sent',sent_at=now() where dedup_key='test-one';
select test.ok(public.claim_notification('test-one','10000000-0000-4000-8000-000000000001','request24',null,true)->>'state'='sent','sent notifications stay deduplicated');
select test.ok(public.claim_notification('test-two','10000000-0000-4000-8000-000000000001','check',null,true)->>'state'='cooldown','a second reminder waits 24 hours');
select test.ok(public.claim_notification('urgent','10000000-0000-4000-8000-000000000001','match_accepted',null,false)->>'state'='claimed','urgent acceptance is not blocked by reminder cooldown');
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub','30000000-0000-4000-8000-000000000003',true);
select public.record_notification_visit((:'claimed'::jsonb->>'id')::uuid);
reset role;
select test.ok((select visited_at is null from public.notification_deliveries where dedup_key='test-one'),'another user cannot mark a recipient visit');
set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
select public.record_notification_visit((:'claimed'::jsonb->>'id')::uuid);
reset role;
select test.ok((select visited_at is not null from public.notification_deliveries where dedup_key='test-one'),'the signed-in recipient visit is recorded');
insert into public.admins(user_id) values('10000000-0000-4000-8000-000000000001');
set local role authenticated;
select test.denied('select public.admin_matching_metrics()','Administrator verification required','admin metrics still require MFA');
select set_config('request.jwt.claims','{"aal":"aal2"}',true);
select test.ok(public.admin_matching_metrics()->>'bookings'='1','verified admin can see real confirmed bookings');
select test.ok(public.admin_matching_metrics()->>'emails_visited'='1','email returns counted without opens or private email content');
rollback;
