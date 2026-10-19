\set ON_ERROR_STOP on
begin;
insert into auth.users(id,email,raw_user_meta_data) values
 ('10000000-0000-4000-8000-000000000001','sender@test.invalid','{"full_name":"Test Sender"}'),
 ('20000000-0000-4000-8000-000000000002','traveller@test.invalid','{"full_name":"Test Traveller"}'),
 ('30000000-0000-4000-8000-000000000003','outsider@test.invalid','{"full_name":"Test Outsider"}'),
 ('60000000-0000-4000-8000-000000000006','admin@test.invalid','{"full_name":"Test Admin"}');
insert into public.admins(user_id) values('60000000-0000-4000-8000-000000000006');
update public.profiles set id_verified=true;
insert into public.trips(id,traveler_id,from_country,from_city,to_country,to_city,depart_date,space_kg,price_per_kg,categories)
values('40000000-0000-4000-8000-000000000004','20000000-0000-4000-8000-000000000002','FR','Paris','KE','Nairobi',current_date+10,20,8,array['clothing']);
create function test.booking(p_accept boolean) returns uuid language plpgsql as $$
declare pid uuid; mid uuid;
begin
 perform set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
 pid:=public.save_parcel(jsonb_build_object('fromCountry','FR','fromCity','Paris','toCountry','KE','toCity','Nairobi','neededBy',(current_date+20)::text,'weightKg',3,'categories',jsonb_build_array('clothing'),'description','Two cotton shirts','budgetUsd',30),'[{"description":"Cotton shirts"}]','{}',true);
 insert into public.matches(trip_id,parcel_id,requester_id) values('40000000-0000-4000-8000-000000000004',pid,auth.uid()) returning id into mid;
 if p_accept then
 perform set_config('request.jwt.claim.sub','20000000-0000-4000-8000-000000000002',true);
 perform public.respond_match(mid,true);
 end if;
 return mid;
end $$;
select test.booking(true) as partial, test.booking(true) as late, test.booking(false) as pending, test.booking(true) as received, test.booking(true) as collected, test.booking(true) as cancelled \gset
set local role authenticated;
select set_config('request.jwt.claim.sub','30000000-0000-4000-8000-000000000003',true);
select test.ok(public.my_delivery_feedback()='[]'::jsonb,'outsider sees no booking feedback');
select test.denied(format('select public.record_delivery_feedback(%L,%L)',:'partial','received'),'Only the sender','outsider cannot claim receipt');
select test.denied(format('insert into public.reviews(match_id,author_id,subject_id,rating) values(%L,auth.uid(),%L,1)',:'partial','20000000-0000-4000-8000-000000000002'),'row-level security','outsider cannot review');
select set_config('request.jwt.claim.sub','20000000-0000-4000-8000-000000000002',true);
select test.denied(format('select public.record_delivery_feedback(%L,%L)',:'partial','received'),'Only the sender','traveller cannot attest recipient receipt');
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
select test.denied(format('select public.record_delivery_feedback(%L,%L)',:'pending','received'),'Only the sender','unaccepted request cannot claim receipt');
select test.denied(format('insert into public.reviews(match_id,author_id,subject_id,rating) values(%L,auth.uid(),%L,1)',:'pending','20000000-0000-4000-8000-000000000002'),'row-level security','unaccepted request cannot review');
select test.ok(not private.can_review_delivery(:'partial'),'future accepted booking cannot review before receipt');
select test.denied(format('select public.record_delivery_feedback(%L,%L,%L)',:'partial','missing_items','short'),'10 to 2000','partial delivery needs useful details');
select test.denied(format('select public.record_delivery_feedback(%L,%L,%L,%L,%s)',:'partial','missing_items','One shirt is missing.','{}',-1),'Invalid received weight','invalid weight rejected');
-- Private photos must belong to this reporter and this match and really exist.
select '10000000-0000-4000-8000-000000000001/'||:'partial'||'/70000000-0000-4000-8000-000000000007.jpg' as photo \gset
insert into storage.objects(bucket_id,name) values('delivery-report-photos',:'photo');
select test.ok((select count(*)=1 from storage.objects where name=:'photo'),'uploader can read own photo');
select test.denied(format('select public.record_delivery_feedback(%L,%L,%L,array[%L],1.1)',:'late','missing_items','One shirt is missing.',:'photo'),'Invalid report photo','other booking photo rejected');
select test.denied(format('select public.record_delivery_feedback(%L,%L,%L,array[%L],1.1)',:'partial','missing_items','One shirt is missing.',replace(:'photo','007.jpg','008.jpg')),'Invalid report photo','nonexistent photo rejected');
select public.record_delivery_feedback(:'partial','missing_items','One shirt is missing. Only 1.1 kg arrived.',array[:'photo'],1.1);
select public.record_delivery_feedback(:'partial','missing_items','One shirt is missing. Only 1.1 kg arrived.',array[:'photo'],1.1);
select test.ok(private.can_review_delivery(:'partial'),'partial receipt unlocks reviews before deadline');
select test.ok((select status='accepted' from public.matches where id=:'partial'),'partial receipt does not complete or advance delivery');
select test.ok(public.my_delivery_report(:'partial')->>'on_hold'='true','partial receipt creates a complaint hold');
select test.ok(public.my_delivery_report(:'partial')->'report'->>'received_weight_kg'='1.1','reported received weight preserved');
select test.ok(jsonb_array_length(public.my_delivery_report(:'partial')->'report'->'photo_paths')=1,'photo evidence attached');
select test.denied(format('select public.record_delivery_feedback(%L,%L)',:'partial','received'),'report is open','receipt cannot silently resolve complaint');
insert into public.reviews(match_id,author_id,subject_id,rating,comment) values(:'partial',auth.uid(),'20000000-0000-4000-8000-000000000002',2,'Some items did not arrive.');
select test.denied(format('insert into public.reviews(match_id,author_id,subject_id,rating) values(%L,auth.uid(),%L,1)',:'partial','20000000-0000-4000-8000-000000000002'),'duplicate key','one review per author and booking');
select test.denied(format('insert into public.reviews(match_id,author_id,subject_id,rating) values(%L,auth.uid(),auth.uid(),1)',:'received'),'row-level security','cannot rate self');
select test.denied('select * from private.delivery_feedback','permission denied','raw receipt records private');
select public.record_delivery_feedback(:'late','not_received','The parcel has not arrived yet.','{}',0);
select test.ok(not private.can_review_delivery(:'late'),'early nonreceipt report does not unlock premature review');
select public.record_delivery_feedback(:'received','received');
select test.ok(private.can_review_delivery(:'received'),'actual receipt permits review with stale handover status');
select test.ok((select status='accepted' from public.matches where id=:'received'),'actual receipt never invents retrospective inspections');
select test.ok(public.my_delivery_report(:'received')->>'on_hold'='false','successful receipt creates no complaint');
select set_config('request.jwt.claim.sub','20000000-0000-4000-8000-000000000002',true);
select test.ok((select count(*)=0 from storage.objects where name=:'photo'),'counterparty cannot read private complaint photos');
select test.ok(public.my_delivery_report(:'partial')->'report'='null'::jsonb,'counterparty cannot read private complaint details');
insert into public.reviews(match_id,author_id,subject_id,rating,comment) values(:'partial',auth.uid(),'10000000-0000-4000-8000-000000000001',4,'My experience of the handover.');
select test.ok(private.can_review_delivery(:'received'),'both parties can review actual receipt');
-- Existing normal collection/completion remains valid.
select public.advance_match(:'collected');
select public.confirm_parcel_inspection(:'collected',1,'{}',true,true,true,true);
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
select public.confirm_parcel_inspection(:'collected',1,'{}',true,true,true,true);
select set_config('request.jwt.claim.sub','20000000-0000-4000-8000-000000000002',true);
select public.advance_match(:'collected');
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
select public.record_delivery_feedback(:'collected','received');
select test.ok((select status='released' from public.matches where id=:'collected'),'full receipt on collected parcel uses existing completion flow');
select public.cancel_match(:'cancelled');
select test.ok(private.can_review_delivery(:'cancelled'),'cancellation after acceptance retains right to review');
reset role;
select test.ok((select count(*)=2 from private.delivery_reports),'retries create no duplicate complaint');
select test.ok((select count(*)=0 from public.match_inspections where match_id=:'received'),'receipt does not fabricate safety records');
select test.ok((select rating=2 from public.profiles where id='20000000-0000-4000-8000-000000000002'),'disputed review contributes to profile rating');
alter table public.trips disable trigger user;
alter table public.parcels disable trigger user;
update public.trips set depart_date=current_date-2 where id='40000000-0000-4000-8000-000000000004';
update public.parcels set needed_by=current_date-1 where id in(select parcel_id from public.matches where id in(:'late',:'pending'));
alter table public.trips enable trigger user;
alter table public.parcels enable trigger user;
set local role authenticated;
select test.ok(private.can_review_delivery(:'late'),'past due accepted booking can review without traveller updates');
select test.ok(not private.can_review_delivery(:'pending'),'old unaccepted request still cannot review');
insert into public.reviews(match_id,author_id,subject_id,rating) values(:'late',auth.uid(),'20000000-0000-4000-8000-000000000002',1);
select test.ok((select status='accepted' from public.matches where id=:'late'),'reviewing nonreceipt does not mark delivery complete');
select set_config('request.jwt.claim.sub','60000000-0000-4000-8000-000000000006',true);
select test.ok((select count(*)=0 from storage.objects where name=:'photo'),'admin without second factor cannot read photos');
select set_config('request.jwt.claims','{"aal":"aal2"}',true);
select test.ok((select count(*)=1 from storage.objects where name=:'photo'),'secure admin can view submitted case photos');
select public.admin_delivery_reports() as cases \gset
reset role;
select id as report_id from private.delivery_reports where match_id=:'partial' \gset
set local role authenticated;
select test.ok(public.admin_delivery_reports(:'report_id')->>'received_weight_kg'='1.1','admin receives weight evidence');
select test.ok(jsonb_array_length(public.admin_delivery_reports(:'report_id')->'photo_paths')=1,'admin receives photo references');
set local role anon;
select test.denied('select public.my_delivery_feedback()','permission denied','anonymous cannot read receipt dashboard');
select test.denied(format('select public.record_delivery_feedback(%L,%L)',:'partial','received'),'permission denied','anonymous cannot submit receipt');
reset role;
select test.ok((select not public from storage.buckets where id='delivery-report-photos'),'report photos bucket is private');
rollback;
