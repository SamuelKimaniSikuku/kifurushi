\set ON_ERROR_STOP on
begin;
insert into auth.users(id,email,raw_user_meta_data) values
 ('10000000-0000-4000-8000-000000000001','sender@test.invalid','{"full_name":"Sender"}'),
 ('20000000-0000-4000-8000-000000000002','traveller@test.invalid','{"full_name":"Traveller"}'),
 ('30000000-0000-4000-8000-000000000003','outsider@test.invalid','{"full_name":"Outsider"}');
insert into public.trips(id,traveler_id,from_country,from_city,to_country,to_city,depart_date,space_kg,price_per_kg,categories) values
 ('40000000-0000-4000-8000-000000000004','20000000-0000-4000-8000-000000000002','FR','Paris','KE','Nairobi',current_date+10,5,10,array['certificates']),
 ('40000000-0000-4000-8000-000000000005','20000000-0000-4000-8000-000000000002','FR','Paris','KE','Nairobi',current_date+10,5,10,array['documents']);
select test.ok(private.accepts_contents(array['documents'],array['certificates']),'documents includes certificates');
select test.ok(not private.accepts_contents(array['certificates'],array['documents']),'certificates excludes generic documents');
select test.ok(not private.accepts_contents(array['certificates'],array[]::text[]),'empty contents are not compatible');
select test.ok(not private.accepts_contents(array['certificates'],array['certificates',null]),'null category cannot bypass restrictions');
set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
select jsonb_build_object('fromCountry','FR','fromCity','Paris','toCountry','KE','toCity','Nairobi','neededBy',current_date+20,'weightKg',0.05,'categories',jsonb_build_array('certificates'),'description','One certificate in an envelope','budgetUsd',5,'itemCount',1,'packageType','envelope','weightKind','measured') as payload \gset
select public.save_parcel(:'payload','[{"description":"One certificate in an envelope"}]',array[]::text[],true) as cert \gset
select test.ok((select item_count=1 and package_type='envelope' and weight_kind='measured' and weight_kg=0.05 from public.parcels where id=:'cert'),'structured details saved without changing grams');
select test.ok((select parcel_details->>'itemCount'='1' and parcel_details->>'packageType'='envelope' from public.parcel_declarations where parcel_id=:'cert'),'inspection version contains exact parcel metadata');
select test.denied(format('select public.save_parcel(%L::jsonb,%L::jsonb,array[]::text[],true)',(:'payload'::jsonb||'{"itemCount":1.5}'), '[{"description":"Certificate"}]'),'whole number','decimal count rejected without rounding');
select test.denied(format('select public.save_parcel(%L::jsonb,%L::jsonb,array[]::text[],true)',(:'payload'::jsonb||'{"packageType":"unknown_bad"}'), '[{"description":"Certificate"}]'),'check constraint','invalid packaging rejected');
select public.save_parcel(:'payload'::jsonb||'{"categories":["certificates","clothing"]}','[{"description":"Certificate and shirt"}]',array[]::text[],true) as mixed \gset
select public.save_parcel(:'payload'::jsonb||'{"categories":["other"]}','[{"description":"Unclassified parcel"}]',array[]::text[],true) as generic \gset
select test.denied(format('insert into public.matches(trip_id,parcel_id,requester_id) values(%L,%L,auth.uid())','40000000-0000-4000-8000-000000000004',:'mixed'),'only accepts','mixed parcel blocked at direct request creation');
select test.denied(format('insert into public.matches(trip_id,parcel_id,requester_id) values(%L,%L,auth.uid())','40000000-0000-4000-8000-000000000004',:'generic'),'only accepts','legacy Other cannot bypass certificates restriction');
-- A direct edit after declaration cannot present stale inspection metadata.
update public.parcels set categories=array['certificates'] where id=:'generic';
select test.denied(format('insert into public.matches(trip_id,parcel_id,requester_id) values(%L,%L,auth.uid())','40000000-0000-4000-8000-000000000004',:'generic'),'save and confirm','direct reclassification requires a fresh attestation');
insert into public.matches(id,trip_id,parcel_id,requester_id) values('50000000-0000-4000-8000-000000000005','40000000-0000-4000-8000-000000000004',:'cert',auth.uid());
select public.save_parcel(:'payload'::jsonb||'{"categories":["documents"]}','[{"description":"Changed document"}]',array[]::text[],true,:'cert');
select set_config('request.jwt.claim.sub','20000000-0000-4000-8000-000000000002',true);
select test.denied($q$select public.respond_match('50000000-0000-4000-8000-000000000005',true)$q$,'only accepts','acceptance rechecks edited contents');
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
select public.save_parcel(:'payload','[{"description":"One certificate in an envelope"}]',array[]::text[],true,:'cert');
select set_config('request.jwt.claim.sub','20000000-0000-4000-8000-000000000002',true);
select public.respond_match('50000000-0000-4000-8000-000000000005',true);
select test.ok((select status='accepted' from public.matches where id='50000000-0000-4000-8000-000000000005'),'compatible certificate booking accepted');
select test.denied($q$update public.trips set categories=array['food'] where id='40000000-0000-4000-8000-000000000004'$q$,'conflict','cannot narrow categories against accepted parcel');
update public.trips set categories=array['documents'] where id='40000000-0000-4000-8000-000000000004';
select test.ok((select categories=array['documents'] from public.trips where id='40000000-0000-4000-8000-000000000004'),'broader compatible category edit allowed');
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
select test.denied(format('select public.save_parcel(%L::jsonb,%L::jsonb,array[]::text[],true,%L)',(:'payload'::jsonb||'{"itemCount":2}'),'[{"description":"Two certificates"}]',:'cert'),'Cancel','accepted parcel metadata locked through API');
select set_config('request.jwt.claim.sub','30000000-0000-4000-8000-000000000003',true);
select test.ok((select count(*)=0 from public.parcel_declarations where parcel_id=:'cert'),'unrelated member cannot read inspection snapshots');
reset role;
select test.denied(format('update public.parcels set item_count=2 where id=%L',:'cert'),'Cancel','database trigger protects metadata even with privileged table writes');
select test.denied(format('update public.parcels set package_type=%L where id=%L','suitcase',:'cert'),'Cancel','accepted packaging cannot change');
select test.denied(format('update public.parcels set weight_kind=%L where id=%L','estimated',:'cert'),'Cancel','accepted weight certainty cannot change');
-- Legacy API callers can still post unknown weights without invented metadata.
set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
select public.save_parcel(:'payload'::jsonb - 'itemCount' - 'packageType' - 'weightKind' || '{"weightKg":null}','[{"description":"A certificate"}]',array[]::text[],true) as legacy \gset
select test.ok((select weight_kg is null and item_count is null and package_type is null and weight_kind is null from public.parcels where id=:'legacy'),'legacy unknowns stay unknown');
insert into public.matches(id,trip_id,parcel_id,requester_id) values('50000000-0000-4000-8000-000000000006','40000000-0000-4000-8000-000000000005',:'legacy',auth.uid());
select set_config('request.jwt.claim.sub','20000000-0000-4000-8000-000000000002',true);
select public.respond_match('50000000-0000-4000-8000-000000000006',true);
select test.ok((select status='accepted' from public.matches where id='50000000-0000-4000-8000-000000000006'),'unknown weight remains bookable when categories fit');
rollback;
