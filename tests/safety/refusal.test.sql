\set ON_ERROR_STOP on
begin;
insert into auth.users(id,email,raw_user_meta_data) values
 ('10000000-0000-4000-8000-000000000001','sender@test.invalid','{"full_name":"Test Sender"}'),
 ('20000000-0000-4000-8000-000000000002','traveller@test.invalid','{"full_name":"Test Traveller"}'),
 ('30000000-0000-4000-8000-000000000003','outsider@test.invalid','{"full_name":"Test Outsider"}');
insert into public.trips(id,traveler_id,from_country,from_city,to_country,to_city,depart_date,space_kg,price_per_kg,categories)
values('40000000-0000-4000-8000-000000000004','20000000-0000-4000-8000-000000000002','FR','Paris','KE','Nairobi',current_date+10,20,8,array['clothing']);
-- Existing parcels, created before declarations were introduced.
insert into public.parcels(id,sender_id,from_country,from_city,to_country,to_city,needed_by,weight_kg,categories,description,budget_usd) values
('60000000-0000-4000-8000-000000000006','10000000-0000-4000-8000-000000000001','FR','Paris','KE','Nairobi',current_date+20,3,array['clothing'],'A legacy parcel',30),
('70000000-0000-4000-8000-000000000007','10000000-0000-4000-8000-000000000001','FR','Paris','KE','Nairobi',current_date+20,2,array['clothing'],'A second parcel',20);
insert into public.matches(id,trip_id,parcel_id,requester_id) values
('50000000-0000-4000-8000-000000000005','40000000-0000-4000-8000-000000000004','60000000-0000-4000-8000-000000000006','10000000-0000-4000-8000-000000000001'),
('80000000-0000-4000-8000-000000000008','40000000-0000-4000-8000-000000000004','70000000-0000-4000-8000-000000000007','10000000-0000-4000-8000-000000000001');
-- Emulate one old pickup without making a false inspection record.
alter table public.matches disable trigger matches_enforce_safe_handover;
update public.matches set status='in_transit' where id='80000000-0000-4000-8000-000000000008';
alter table public.matches enable trigger matches_enforce_safe_handover;
set local role authenticated;
select set_config('request.jwt.claim.sub','20000000-0000-4000-8000-000000000002',true);
select public.respond_match('50000000-0000-4000-8000-000000000005',true);
select public.advance_match('50000000-0000-4000-8000-000000000005');
select test.ok((select remaining_kg=15 from public.trips where id='40000000-0000-4000-8000-000000000004'),'accepted parcel reserves luggage space');
select test.denied($q$select public.advance_match('50000000-0000-4000-8000-000000000005')$q$,'identity verification','legacy pre-pickup match has no verification exemption');
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
insert into storage.objects(bucket_id,name) values('parcel-evidence','10000000-0000-4000-8000-000000000001/legacy.jpg');
select public.declare_parcel('60000000-0000-4000-8000-000000000006','[{"description":"Cotton shirt","quantity":1,"valueUsd":15}]',array['10000000-0000-4000-8000-000000000001/legacy.jpg'],true);
select test.ok((select count(*)=1 from public.parcel_declarations),'legacy accepted parcel can add its first declaration');
select test.denied($q$select public.refuse_parcel('50000000-0000-4000-8000-000000000005','cannot_inspect','')$q$,'Only the matched traveller','sender cannot impersonate a traveller refusal');
select set_config('request.jwt.claim.sub','20000000-0000-4000-8000-000000000002',true);
select public.refuse_parcel('50000000-0000-4000-8000-000000000005','cannot_inspect','Sender cannot open the parcel.');
select public.refuse_parcel('50000000-0000-4000-8000-000000000005','cannot_inspect','Sender cannot open the parcel.');
select test.ok((select status='cancelled' from public.matches where id='50000000-0000-4000-8000-000000000005'),'safety refusal cancels match');
select test.ok((select count(*)=1 from public.match_safety_refusals),'refusal retries do not create duplicate reports');
select test.ok((select remaining_kg=18 from public.trips where id='40000000-0000-4000-8000-000000000004'),'refusal releases only its reserved kilos');
select test.ok((select rating is null and deliveries_completed=0 from public.profiles where id='20000000-0000-4000-8000-000000000002'),'refusal does not reduce rating or affect completed count');
select test.denied($q$insert into public.reviews(match_id,author_id,subject_id,rating,comment) values('50000000-0000-4000-8000-000000000005','20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001',1,'Retaliatory review')$q$,'row-level security','refused match cannot create a retaliatory rating');
select test.denied($q$select public.refuse_parcel('80000000-0000-4000-8000-000000000008','cannot_inspect','')$q$,'after pickup','post-pickup concern cannot masquerade as a pre-pickup refusal');
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
select test.ok((select status='closed' and safety_hold from public.parcels where id='60000000-0000-4000-8000-000000000006'),'suspect parcel held and removed from public listings');
select test.denied($q$update public.parcels set status='open' where id='60000000-0000-4000-8000-000000000006'$q$,'Support must review','sender cannot reopen a held parcel');
select test.denied($q$update public.parcels set safety_hold=false where id='60000000-0000-4000-8000-000000000006'$q$,'permission denied','sender cannot clear a hold');
select test.denied($q$insert into public.matches(trip_id,parcel_id,requester_id) values('40000000-0000-4000-8000-000000000004','60000000-0000-4000-8000-000000000006','10000000-0000-4000-8000-000000000001')$q$,'held for support','held parcel cannot be matched again');
select public.sender_confirm_delivery('80000000-0000-4000-8000-000000000008');
select test.ok((select status='released' from public.matches where id='80000000-0000-4000-8000-000000000008'),'legacy parcel already in transit can finish without invented checks');
reset role;
select test.ok((select count(*)=1 from public.incidents where kind='parcel_safety_refusal'),'one support incident recorded');
create policy "test visible matches" on public.matches for select to authenticated using (true);
set local role authenticated;
select set_config('request.jwt.claim.sub','30000000-0000-4000-8000-000000000003',true);
select test.ok((select count(*)=2 from public.matches),'refusal privacy test can see unrelated match metadata');
select test.ok((select count(*)=0 from public.match_safety_refusals),'explicit parties protect refusals even with visible matches');
rollback;
