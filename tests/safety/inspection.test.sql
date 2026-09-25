\set ON_ERROR_STOP on
begin;
insert into auth.users(id,email,raw_user_meta_data) values
 ('10000000-0000-4000-8000-000000000001','sender@test.invalid','{"full_name":"Test Sender"}'),
 ('20000000-0000-4000-8000-000000000002','traveller@test.invalid','{"full_name":"Test Traveller"}'),
 ('30000000-0000-4000-8000-000000000003','outsider@test.invalid','{"full_name":"Test Outsider"}');
update public.profiles set id_verified=true where id='20000000-0000-4000-8000-000000000002';
insert into public.trips(id,traveler_id,from_country,from_city,to_country,to_city,depart_date,space_kg,price_per_kg,categories)
values('40000000-0000-4000-8000-000000000004','20000000-0000-4000-8000-000000000002','FR','Paris','KE','Nairobi',current_date+10,20,8,array['clothing']);

set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
insert into storage.objects(bucket_id,name) values('parcel-evidence','10000000-0000-4000-8000-000000000001/contents.jpg');
select test.denied($q$insert into storage.objects(bucket_id,name) values('parcel-evidence','20000000-0000-4000-8000-000000000002/spoof.jpg')$q$,'row-level security','cannot upload in another account folder');
select public.save_parcel(jsonb_build_object('fromCountry','FR','fromCity','Paris','toCountry','KE','toCity','Nairobi','neededBy',(current_date+20)::text,'weightKg',3,'categories',jsonb_build_array('clothing'),'description','Two cotton shirts','budgetUsd',30),
 '[{"description":"Cotton shirts","quantity":2,"valueUsd":40}]',array['10000000-0000-4000-8000-000000000001/contents.jpg'],true) as parcel_id \gset
select test.ok((select count(*)=1 from public.parcel_declarations where parcel_id=:'parcel_id'),'atomic parcel and private declaration created');
select test.ok((select declared_value_usd=40 from public.parcel_declarations where parcel_id=:'parcel_id'),'declared value is computed from line values');
select test.denied(format('select public.declare_parcel(%L,%L,ARRAY[%L],true)',:'parcel_id','[{"description":"Shirt","quantity":0,"valueUsd":10}]','10000000-0000-4000-8000-000000000001/contents.jpg'),'valid quantities','invalid quantities rejected by database');
select test.denied(format('select public.declare_parcel(%L,%L,null::text[],true)',:'parcel_id','[{"description":"Shirt","quantity":1,"valueUsd":10}]'),'evidence photos','null photo list rejected; use an empty array instead');
select test.denied(format('select public.declare_parcel(%L,%L,ARRAY[%L],true)',:'parcel_id','[{"description":"Shirt","quantity":1,"valueUsd":10}]','10000000-0000-4000-8000-000000000001/missing.jpg'),'Upload each photo','nonexistent evidence rejected');
select test.denied(format('select public.declare_parcel(%L,%L,ARRAY[%L],null)',:'parcel_id','[{"description":"Shirt","quantity":1,"valueUsd":10}]','10000000-0000-4000-8000-000000000001/contents.jpg'),'Confirm','null attestation rejected');
insert into public.matches(id,trip_id,parcel_id,requester_id) values('50000000-0000-4000-8000-000000000005','40000000-0000-4000-8000-000000000004',:'parcel_id','10000000-0000-4000-8000-000000000001');

select set_config('request.jwt.claim.sub','30000000-0000-4000-8000-000000000003',true);
select test.ok((select count(*)=0 from public.parcel_declarations),'unrelated member cannot read declarations');
select test.ok((select count(*)=0 from storage.objects),'unrelated member cannot read evidence');
select test.denied(format('select public.declare_parcel(%L,%L,ARRAY[]::text[],true)',:'parcel_id','[]'),'Only the sender','unrelated member cannot change declaration');
select test.denied($q$select public.confirm_parcel_inspection('50000000-0000-4000-8000-000000000005',1,ARRAY[]::text[],true,true,true,true)$q$,'Only the matched','unrelated member cannot confirm inspection');
select test.denied($q$select public.refuse_parcel('50000000-0000-4000-8000-000000000005','cannot_inspect','')$q$,'Only the matched traveller','unrelated member cannot refuse');

set local role anon;
select test.denied('select * from public.parcel_declarations','permission denied','anonymous cannot read declarations');
select test.denied($q$select public.confirm_parcel_inspection('50000000-0000-4000-8000-000000000005',1,ARRAY[]::text[],true,true,true,true)$q$,'permission denied','anonymous cannot call inspection RPC');

set local role authenticated;
select set_config('request.jwt.claim.sub','20000000-0000-4000-8000-000000000002',true);
select test.ok((select count(*)=1 from public.parcel_declarations),'matched traveller can read contents');
select test.ok((select count(*)=1 from storage.objects),'matched traveller can read contents photo');
select public.respond_match('50000000-0000-4000-8000-000000000005',true);
select test.denied($q$update public.trips set depart_date=current_date+30 where id='40000000-0000-4000-8000-000000000004'$q$,'Cancel active matches','accepted journey cannot be changed underneath a declaration');
select test.denied($q$update public.trips set booked_kg=0 where id='40000000-0000-4000-8000-000000000004'$q$,'permission denied','traveller cannot forge available capacity');
select test.denied($q$select public.deliver_now('50000000-0000-4000-8000-000000000005')$q$,'Complete the inspection','traveller delivery shortcut cannot skip pickup');
select public.advance_match('50000000-0000-4000-8000-000000000005');
select test.denied($q$select public.advance_match('50000000-0000-4000-8000-000000000005')$q$,'Both people','pickup requires both confirmations');
insert into storage.objects(bucket_id,name) values('parcel-evidence','20000000-0000-4000-8000-000000000002/handover.jpg');
select test.denied($q$select public.confirm_parcel_inspection('50000000-0000-4000-8000-000000000005',1,ARRAY['20000000-0000-4000-8000-000000000002/handover.jpg'],true,false,true,true)$q$,'every inspection check','unchecked confirmation cannot bypass checklist');
select test.denied($q$select public.confirm_parcel_inspection('50000000-0000-4000-8000-000000000005',99,ARRAY['20000000-0000-4000-8000-000000000002/handover.jpg'],true,true,true,true)$q$,'declaration changed','stale declaration rejected');
select test.denied($q$select public.confirm_parcel_inspection('50000000-0000-4000-8000-000000000005',1,ARRAY['10000000-0000-4000-8000-000000000001/contents.jpg'],true,true,true,true)$q$,'own account','traveller cannot substitute sender photo for inspection evidence');
reset role;
update public.profiles set id_verified=false where id='20000000-0000-4000-8000-000000000002';
set local role authenticated;
select test.denied($q$select public.confirm_parcel_inspection('50000000-0000-4000-8000-000000000005',1,ARRAY['20000000-0000-4000-8000-000000000002/handover.jpg'],true,true,true,true)$q$,'identity verification','unverified traveller cannot confirm pickup');
reset role;
update public.profiles set id_verified=true where id='20000000-0000-4000-8000-000000000002';
set local role authenticated;
select public.confirm_parcel_inspection('50000000-0000-4000-8000-000000000005',1,ARRAY['20000000-0000-4000-8000-000000000002/handover.jpg'],true,true,true,true);
select public.confirm_parcel_inspection('50000000-0000-4000-8000-000000000005',1,ARRAY['20000000-0000-4000-8000-000000000002/handover.jpg'],true,true,true,true);
select test.ok((select count(*)=1 from public.match_inspections),'inspection retry is idempotent');
select test.denied($q$select public.advance_match('50000000-0000-4000-8000-000000000005')$q$,'Both people','single confirmation is insufficient');
select test.denied($q$update public.match_inspections set declaration_version=99$q$,'permission denied','inspection evidence cannot be rewritten directly');
with changed as (delete from storage.objects where name like '%/handover.jpg' returning *) select test.ok(count(*)=0,'inspection photo cannot be deleted') from changed;

select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
select test.denied(format('select public.declare_parcel(%L,%L,ARRAY[%L],true)',:'parcel_id','[{"description":"Changed shirts","quantity":2,"valueUsd":40}]','10000000-0000-4000-8000-000000000001/contents.jpg'),'locked','accepted declaration cannot be changed');
select test.denied(format('update public.parcels set weight_kg=5 where id=%L',:'parcel_id'),'Cancel the match','direct parcel changes cannot bypass frozen declaration');
select test.denied($q$select public.sender_confirm_delivery('50000000-0000-4000-8000-000000000005')$q$,'Complete the inspection','sender delivery shortcut cannot skip pickup');
select public.confirm_parcel_inspection('50000000-0000-4000-8000-000000000005',1,ARRAY[]::text[],true,true,true,true);
select test.denied($q$select public.advance_match('50000000-0000-4000-8000-000000000005')$q$,'only the traveller','sender cannot mark pickup');
select set_config('request.jwt.claim.sub','20000000-0000-4000-8000-000000000002',true);
select public.advance_match('50000000-0000-4000-8000-000000000005');
select test.ok((select status='picked_up' from public.matches where id='50000000-0000-4000-8000-000000000005'),'both inspections permit verified traveller pickup');
select public.deliver_now('50000000-0000-4000-8000-000000000005');
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
select public.sender_confirm_delivery('50000000-0000-4000-8000-000000000005');
select test.ok((select status='released' from public.matches where id='50000000-0000-4000-8000-000000000005'),'delivery still completes after inspected pickup');
-- Privacy must not depend on matches staying private in future migrations.
-- Broaden ONLY the disposable fixture table's SELECT policy for this test.
reset role;
create policy "test visible matches" on public.matches for select to authenticated using (true);
set local role authenticated;
select set_config('request.jwt.claim.sub','30000000-0000-4000-8000-000000000003',true);
select test.ok((select count(*)=1 from public.matches),'privacy test can see unrelated match metadata');
select test.ok((select count(*)=0 from public.parcel_declarations),'explicit parties protect declarations even with visible matches');
select test.ok((select count(*)=0 from public.match_inspections),'explicit parties protect inspections even with visible matches');
select test.ok((select count(*)=0 from storage.objects),'contents and handover photos stay private even with visible matches');
rollback;
