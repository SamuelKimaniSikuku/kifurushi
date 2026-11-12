-- Disposable local database only; all fixtures are rolled back.
\set ON_ERROR_STOP on
begin;
insert into auth.users(id,email,raw_user_meta_data) values
 ('10000000-0000-4000-8000-000000000001','sender@test.invalid','{"full_name":"Sender"}'),
 ('20000000-0000-4000-8000-000000000002','traveller@test.invalid','{"full_name":"Traveller"}'),
 ('30000000-0000-4000-8000-000000000003','second@test.invalid','{"full_name":"Other Traveller"}'),
 ('80000000-0000-4000-8000-000000000008','outsider@test.invalid','{"full_name":"Outsider"}');
insert into public.trips(id,traveler_id,from_country,from_city,to_country,to_city,depart_date,space_kg,price_per_kg,categories) values
 ('40000000-0000-4000-8000-000000000004','20000000-0000-4000-8000-000000000002','KE','Nairobi','FR','Paris',current_date+10,10,8,array['clothing']),
 ('50000000-0000-4000-8000-000000000005','30000000-0000-4000-8000-000000000003','KE','Nairobi','FR','Paris',current_date+10,10,8,array['clothing']);
create function test.context(mid uuid) returns jsonb language sql as $$
 select value from jsonb_array_elements(public.my_delivery_feedback()) where value->>'match_id'=mid::text;
$$;
grant execute on function test.context(uuid) to authenticated;
set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
select jsonb_build_object('fromCountry','KE','fromCity','Nairobi','toCountry','FR','toCity','Paris','neededBy',(current_date+20)::text,'weightKg',4,'categories',jsonb_build_array('clothing'),'description','Four kilos of clothing','budgetUsd',30) as payload \gset
select public.save_parcel(:'payload','[{"description":"Four kilos of clothing"}]','{}',true) as pid \gset
insert into public.matches(trip_id,parcel_id,requester_id) values('40000000-0000-4000-8000-000000000004',:'pid',auth.uid()) returning id as pending \gset
insert into public.matches(trip_id,parcel_id,requester_id) values('50000000-0000-4000-8000-000000000005',:'pid',auth.uid()) returning id as winning \gset
select test.ok(test.context(:'pending')->>'request_availability'='available','open request is available');
select test.ok(test.context(:'pending')->>'parcel_weight_kg'='4','saved weight returned before booking');
select set_config('request.jwt.claim.sub','30000000-0000-4000-8000-000000000003',true);
select public.respond_match(:'winning',true);
select test.ok(test.context(:'winning')->'request_availability'='null'::jsonb,'accepted booking is not labelled unavailable');
select test.ok(test.context(:'winning')->>'parcel_weight_kg'='4','accepted traveller retains saved weight');
select test.ok((test.context(:'winning')->>'remaining_kg')::numeric=6,'accepted booking reserves four kilos');
select set_config('request.jwt.claim.sub','20000000-0000-4000-8000-000000000002',true);
select test.ok((select count(*)=0 from public.parcels where id=:'pid'),'public parcel RLS still hides matched parcel');
select test.ok((select count(*)=1 from public.matches where id=:'pending'),'participant can still read own pending request');
select test.ok(test.context(:'pending')->>'parcel_weight_kg'='4','hidden listing retains its actual saved weight');
select test.ok(test.context(:'pending')->>'request_availability'='booked_elsewhere','losing request explains the other booking');
select test.ok((test.context(:'pending')->>'remaining_kg')::numeric=10,'unaccepted request reserves no space');
select test.ok(test.context(:'winning') is null,'other traveller booking details not disclosed');
select test.ok((select array_agg(k order by k)=array['can_report_receipt','can_review','match_id','outcome','parcel_weight_kg','remaining_kg','request_availability'] from jsonb_object_keys(test.context(:'pending')) k),'context contains no contacts, other booking IDs or private declarations');
select test.denied(format('select public.respond_match(%L,true)',:'pending'),'no longer available','duplicate acceptance remains blocked');
select test.ok((select status='requested' from public.matches where id=:'pending'),'reading context and failed acceptance leave request unchanged');
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
select test.ok(jsonb_array_length(public.my_delivery_feedback())=2,'sender sees context for both own requests');
select test.ok(test.context(:'pending')->>'request_availability'='booked_elsewhere','sender sees the same availability');
select set_config('request.jwt.claim.sub','80000000-0000-4000-8000-000000000008',true);
select test.ok(public.my_delivery_feedback()='[]'::jsonb,'unrelated user gets no context');
set local role anon;
select test.denied('select public.my_delivery_feedback()','permission denied','anonymous public RPC denied');
select test.denied('select private.my_delivery_feedback()','permission denied','anonymous private helper denied');
set local role authenticated;
select set_config('request.jwt.claim.sub','',true);
select test.ok(public.my_delivery_feedback()='[]'::jsonb,'missing user identity gets no context');
select set_config('request.jwt.claim.sub','30000000-0000-4000-8000-000000000003',true);
select public.cancel_match(:'winning');
select set_config('request.jwt.claim.sub','20000000-0000-4000-8000-000000000002',true);
select test.ok(test.context(:'pending')->>'request_availability'='available','cancelling the actual booking makes pending request available again');
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
select public.save_parcel(:'payload'::jsonb || '{"weightKg":null}','[{"description":"Four kilos of clothing"}]','{}',true,:'pid');
select test.ok(test.context(:'pending')->'parcel_weight_kg'='null'::jsonb,'unknown weight stays null rather than guessing');
select set_config('request.jwt.claim.sub','20000000-0000-4000-8000-000000000002',true);
savepoint unknown_acceptance;
select public.respond_match(:'pending',true);
select test.ok((select status='accepted' from public.matches where id=:'pending'),'unknown-weight request can be accepted');
select test.ok(test.context(:'pending')->'parcel_weight_kg'='null'::jsonb,'acceptance preserves unknown weight in participant context');
rollback to savepoint unknown_acceptance;
update public.trips set status='closed' where id='40000000-0000-4000-8000-000000000004';
select test.ok(test.context(:'pending')->>'request_availability'='unavailable','closed trip explains unavailability');
update public.trips set status='open' where id='40000000-0000-4000-8000-000000000004';
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
select public.save_parcel(:'payload'::jsonb || '{"weightKg":12}','[{"description":"Four kilos of clothing"}]','{}',true,:'pid');
select test.ok(test.context(:'pending')->>'parcel_weight_kg'='12','refresh context reflects edited estimate');
select test.ok(test.context(:'pending')->>'request_availability'='available','overweight request remains available for negotiation');
select set_config('request.jwt.claim.sub','20000000-0000-4000-8000-000000000002',true);
select test.denied(format('select public.respond_match(%L,true)',:'pending'),'not enough space','over-capacity acceptance remains blocked');
reset role;
rollback;
