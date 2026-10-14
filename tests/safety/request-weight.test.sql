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
select test.ok((select weight_kg is null from public.parcels where id=:'parcel_id'),'unknown weight is stored as NULL, not an invented kilo value');
insert into public.matches(id,trip_id,parcel_id,requester_id) values('50000000-0000-4000-8000-000000000005','40000000-0000-4000-8000-000000000004',:'parcel_id','10000000-0000-4000-8000-000000000001');
insert into public.messages(match_id,sender_id,body) values('50000000-0000-4000-8000-000000000005','10000000-0000-4000-8000-000000000001','Can we agree the envelope weight?');
select test.ok((select remaining_kg=9 from public.trips where id='40000000-0000-4000-8000-000000000004'),'unknown-weight request does not reserve space');
select test.ok((select count(*)=1 from public.messages where match_id='50000000-0000-4000-8000-000000000005'),'sender can negotiate in chat while weight is unknown');
select test.denied($q$select public.respond_match('50000000-0000-4000-8000-000000000005',true)$q$,'other party','sender cannot accept their own request');
select set_config('request.jwt.claim.sub','20000000-0000-4000-8000-000000000002',true);
select test.denied($q$select public.respond_match('50000000-0000-4000-8000-000000000005',true)$q$,'Agree the parcel weight','unknown weight cannot be accepted');
select test.ok((select status='requested' from public.matches where id='50000000-0000-4000-8000-000000000005'),'blocked acceptance leaves the request available for discussion');
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
select public.save_parcel(:'payload'::jsonb || '{"weightKg":0.025}','[{"description":"Document in an envelope"}]',ARRAY[]::text[],true,:'parcel_id');
select test.ok((select weight_kg=0.025 from public.parcels where id=:'parcel_id'),'the sender’s light-weight estimate is preserved');
select set_config('request.jwt.claim.sub','20000000-0000-4000-8000-000000000002',true);
select public.respond_match('50000000-0000-4000-8000-000000000005',true);
select test.ok((select remaining_kg=8.975 from public.trips where id='40000000-0000-4000-8000-000000000004'),'agreed 25 gram envelope reserves its exact weight without rounding down');

select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
select test.denied(format('update public.parcels set weight_kg=null where id=%L',:'parcel_id'),'Cancel the match','accepted weight cannot be cleared');
select public.save_parcel(:'payload'::jsonb || '{"weightKg":1000}','[{"description":"Document in an envelope"}]',ARRAY[]::text[],true) as heavy_id \gset
select test.ok((select weight_kg=1000 from public.parcels where id=:'heavy_id'),'a large estimate is kept without the old maximum or numeric overflow');
insert into public.matches(id,trip_id,parcel_id,requester_id) values('60000000-0000-4000-8000-000000000006','40000000-0000-4000-8000-000000000004',:'heavy_id','10000000-0000-4000-8000-000000000001');
select test.ok((select remaining_kg=8.975 from public.trips where id='40000000-0000-4000-8000-000000000004'),'over-capacity request is allowed without reserving space');
select test.denied(format('update public.parcels set weight_kg=-1 where id=%L',:'heavy_id'),'parcels_weight_kg_check','negative weight is still rejected');
select test.denied(format('update public.parcels set weight_kg=%L::numeric where id=%L','NaN',:'heavy_id'),'parcels_weight_kg_check','NaN cannot bypass capacity checks');
select test.denied(format('update public.parcels set weight_kg=%L::numeric where id=%L','Infinity',:'heavy_id'),'parcels_weight_kg_check','infinite weight is rejected');
select set_config('request.jwt.claim.sub','20000000-0000-4000-8000-000000000002',true);
select test.denied($q$select public.respond_match('60000000-0000-4000-8000-000000000006',true)$q$,'not enough space','over-capacity acceptance remains blocked');
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
select public.save_parcel(:'payload'::jsonb || '{"weightKg":1}','[{"description":"Document in an envelope"}]',ARRAY[]::text[],true,:'heavy_id');
select set_config('request.jwt.claim.sub','20000000-0000-4000-8000-000000000002',true);
select public.respond_match('60000000-0000-4000-8000-000000000006',true);
select test.ok((select remaining_kg=7.975 from public.trips where id='40000000-0000-4000-8000-000000000004'),'negotiated weight is accepted and reserves the correct capacity');

select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
select public.save_parcel(:'payload','[{"description":"Document in an envelope"}]',ARRAY[]::text[],true) as other_id \gset
select set_config('request.jwt.claim.sub','30000000-0000-4000-8000-000000000003',true);
select test.denied(format('insert into public.matches(trip_id,parcel_id,requester_id) values(%L,%L,%L)','40000000-0000-4000-8000-000000000004',:'other_id','30000000-0000-4000-8000-000000000003'),'row-level security','unrelated members cannot request someone else’s parcel');
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
insert into public.matches(id,trip_id,parcel_id,requester_id) values('70000000-0000-4000-8000-000000000007','40000000-0000-4000-8000-000000000004',:'other_id','10000000-0000-4000-8000-000000000001');
select set_config('request.jwt.claim.sub','20000000-0000-4000-8000-000000000002',true);
select public.respond_match('70000000-0000-4000-8000-000000000007',false);
select test.ok((select status='declined' from public.matches where id='70000000-0000-4000-8000-000000000007'),'unknown-weight requests may still be declined');
select public.save_parcel(:'payload','[{"description":"Document in an envelope"}]',ARRAY[]::text[],true) as self_id \gset
select test.denied(format('insert into public.matches(trip_id,parcel_id,requester_id) values(%L,%L,%L)','40000000-0000-4000-8000-000000000004',:'self_id','20000000-0000-4000-8000-000000000002'),'row-level security','self-matching remains forbidden');
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
select public.save_parcel(:'payload'::jsonb || '{"toCountry":"GB","toCity":"London"}','[{"description":"Document in an envelope"}]',ARRAY[]::text[],true) as wrong_route_id \gset
select test.denied(format('insert into public.matches(trip_id,parcel_id,requester_id) values(%L,%L,%L)','40000000-0000-4000-8000-000000000004',:'wrong_route_id','10000000-0000-4000-8000-000000000001'),'row-level security','route mismatch remains forbidden');
select public.save_parcel(:'payload'::jsonb || jsonb_build_object('neededBy',(current_date+1)::text),'[{"description":"Document in an envelope"}]',ARRAY[]::text[],true) as wrong_date_id \gset
select test.denied(format('insert into public.matches(trip_id,parcel_id,requester_id) values(%L,%L,%L)','40000000-0000-4000-8000-000000000004',:'wrong_date_id','10000000-0000-4000-8000-000000000001'),'row-level security','date mismatch remains forbidden');
rollback;
