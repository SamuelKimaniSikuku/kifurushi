\set ON_ERROR_STOP on
begin;
insert into auth.users(id,email,raw_user_meta_data) values
 ('10000000-0000-4000-8000-000000000001','sender@test.invalid','{"full_name":"Test Sender"}'),
 ('20000000-0000-4000-8000-000000000002','traveller@test.invalid','{"full_name":"Test Traveller"}');
update public.profiles set id_verified=true where id='20000000-0000-4000-8000-000000000002';
insert into public.trips(id,traveler_id,from_country,from_city,to_country,to_city,depart_date,space_kg,price_per_kg,categories)
values('40000000-0000-4000-8000-000000000004','20000000-0000-4000-8000-000000000002','FR','Paris','KE','Nairobi',current_date+10,20,8,array['clothing']);

set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
select jsonb_build_object('fromCountry','FR','fromCity','Paris','toCountry','KE','toCity','Nairobi','neededBy',(current_date+20)::text,'weightKg',3,'categories',jsonb_build_array('clothing'),'description','Clothes','budgetUsd',30) as payload \gset
select test.denied(format('select public.save_parcel(%L,%L,ARRAY[]::text[],false)',:'payload','[{"description":"Clothes"}]'),'Confirm the complete','posting without photos still requires the declaration checkbox');
select test.ok((select count(*)=0 from public.parcels),'unconfirmed posting rolls back the whole parcel');
select public.save_parcel(:'payload','[{"description":"Clothes"}]',ARRAY[]::text[],true) as parcel_id \gset
select test.ok((select cardinality(photo_paths)=0 and declared_value_usd is null and not (items->0 ? 'quantity') and not (items->0 ? 'valueUsd') from public.parcel_declarations where parcel_id=:'parcel_id'),'short posting requires no photos, quantities or invented value');
select public.save_parcel(:'payload'::jsonb || '{"description":"Books"}'::jsonb,'[{"description":"Books"}]',ARRAY[]::text[],true,:'parcel_id');
select test.ok((select count(*)=2 from public.parcel_declarations where parcel_id=:'parcel_id'),'simple edit creates a new confirmed version');
select test.ok((select items->0->>'description'='Clothes' from public.parcel_declarations where parcel_id=:'parcel_id' and version=1),'editing retains the old declaration');
select test.ok((select items->0->>'description'='Books' and declared_value_usd is null from public.parcel_declarations where parcel_id=:'parcel_id' and version=2),'edited contents have no invented goods value');
select test.denied(format('select public.declare_parcel(%L,%L,ARRAY[]::text[],true)',:'parcel_id','[{"description":"x"}]'),'Briefly describe','a blank or meaningless description is rejected');
insert into public.matches(id,trip_id,parcel_id,requester_id) values('50000000-0000-4000-8000-000000000005','40000000-0000-4000-8000-000000000004',:'parcel_id','10000000-0000-4000-8000-000000000001');

select set_config('request.jwt.claim.sub','20000000-0000-4000-8000-000000000002',true);
select public.respond_match('50000000-0000-4000-8000-000000000005',true);
select public.advance_match('50000000-0000-4000-8000-000000000005');
select test.denied($q$select public.advance_match('50000000-0000-4000-8000-000000000005')$q$,'Both people','photo-free pickup still requires both inspection confirmations');
select test.denied($q$select public.confirm_parcel_inspection('50000000-0000-4000-8000-000000000005',2,ARRAY[]::text[],false,false,false,false)$q$,'every inspection check','an unticked inspection checkbox cannot confirm handover');
select public.confirm_parcel_inspection('50000000-0000-4000-8000-000000000005',2,ARRAY[]::text[],true,true,true,true);
select test.ok((select cardinality(photo_paths)=0 from public.match_inspections where role='traveler'),'traveller can confirm inspection without handover photos');
select test.denied($q$select public.advance_match('50000000-0000-4000-8000-000000000005')$q$,'Both people','one photo-free confirmation cannot stand in for both people');

select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
select public.confirm_parcel_inspection('50000000-0000-4000-8000-000000000005',2,ARRAY[]::text[],true,true,true,true);
select test.ok((select count(*)=2 from public.match_inspections where cardinality(photo_paths)=0),'both people can record inspection without uploading files');
select set_config('request.jwt.claim.sub','20000000-0000-4000-8000-000000000002',true);
select public.advance_match('50000000-0000-4000-8000-000000000005');
select test.ok((select status='picked_up' from public.matches where id='50000000-0000-4000-8000-000000000005'),'two confirmed inspections permit pickup without photos');
select test.ok((select count(*)=0 from storage.objects),'the full posting and pickup flow required no uploads');
rollback;
