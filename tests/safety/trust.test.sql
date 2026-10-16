\set ON_ERROR_STOP on
begin;
insert into auth.users(id,email,raw_user_meta_data) values
 ('10000000-0000-4000-8000-000000000001','sender@test.invalid','{"full_name":"Test Sender"}'),
 ('20000000-0000-4000-8000-000000000002','traveller@test.invalid','{"full_name":"Test Traveller"}'),
 ('30000000-0000-4000-8000-000000000003','outsider@test.invalid','{"full_name":"Test Outsider"}'),
 ('60000000-0000-4000-8000-000000000006','admin@test.invalid','{"full_name":"Test Admin"}');
insert into public.admins(user_id) values('60000000-0000-4000-8000-000000000006');
insert into public.verifications(user_id,provider,provider_ref,id_type) values
 ('10000000-0000-4000-8000-000000000001','didit','sender-session','passport'),
 ('20000000-0000-4000-8000-000000000002','didit','traveller-session','passport'),
 ('30000000-0000-4000-8000-000000000003','didit','duplicate-session','passport');
set local role service_role;
select public.apply_identity_decision('sender-session','verified','{}',false,'["KE","PASSPORT","TEST1"]');
select public.apply_identity_decision('traveller-session','verified','{}',false,'["FR","PASSPORT","TEST2"]');
select public.apply_identity_decision('duplicate-session','verified','{}',false,'["KE","PASSPORT","TEST1"]');
reset role;
select test.ok((select status='in_review' and decline_reason='possible_duplicate' from public.verifications where provider_ref='duplicate-session'),'document reuse held even on approved webhook');
select test.ok((select not id_verified from public.profiles where id='30000000-0000-4000-8000-000000000003'),'duplicate has no badge');
select test.ok(public.apply_identity_decision('duplicate-session','verified','{}',false,'["KE","PASSPORT","TEST1"]','60000000-0000-4000-8000-000000000006')->>'status'='in_review','manual approval cannot bypass identity conflict');
select test.ok(public.apply_identity_decision('sender-session','verified',array['sender-session'],true,'["KE","PASSPORT","TEST1"]')->>'status'='verified','same user retry allowed');
select test.ok(public.apply_identity_decision('duplicate-session','verified','{}',true,null)->>'status'='in_review','unknown duplicate shape fails closed');
select test.ok(public.apply_identity_decision('duplicate-session','verified',array['traveller-session'],true,null)->>'status'='in_review','different account face flagged on every approval');
insert into public.verifications(user_id,provider,provider_ref,id_type,status) values('20000000-0000-4000-8000-000000000002','didit','old-traveller-session','passport','verified');
update public.verifications set created_at=now()-interval '1 day' where provider_ref='old-traveller-session';
select public.apply_identity_decision('traveller-session','rejected','{}',false,null);
select test.ok((select not id_verified from public.profiles where id='20000000-0000-4000-8000-000000000002'),'revocation removes badge despite earlier approvals');
select public.apply_identity_decision('traveller-session','verified','{}',false,'["FR","PASSPORT","TEST2"]');
select test.ok((select count(*)=2 from private.identity_claims where user_id in ('10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000002')),'fingerprints only stored for verified identities');
select test.ok((select bool_and(length(fingerprint)=64) from private.identity_claims),'raw identity number not stored');

set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
select test.denied($q$select public.apply_identity_decision('duplicate-session','verified','{}',false,null)$q$,'permission denied','client cannot grant badges');
select test.denied('select * from private.identity_claims','permission denied','identity fingerprints private');
select test.denied('select public.admin_delivery_reports()','Not allowed','ordinary user cannot read admin cases');
select test.ok(public.my_phone_verification()->>'verified'='false','entered contact not a verified phone');
select test.denied('select * from auth.users','permission denied','phone endpoint does not expose auth users');
reset role;
update auth.users set phone='254700000001',phone_confirmed_at=now() where id='10000000-0000-4000-8000-000000000001';
set local role authenticated;
select test.ok(public.my_phone_verification()->>'phone'='+254700000001','only confirmed Auth phone returned');
select set_config('request.jwt.claim.sub','20000000-0000-4000-8000-000000000002',true);
select test.ok(public.my_phone_verification()->>'verified'='false','phone confirmation scoped to caller');
reset role;
insert into public.trips(id,traveler_id,from_country,from_city,to_country,to_city,depart_date,space_kg,price_per_kg,categories)
values('40000000-0000-4000-8000-000000000004','20000000-0000-4000-8000-000000000002','FR','Paris','KE','Nairobi',current_date+10,20,8,array['clothing']);
set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
select public.save_parcel(jsonb_build_object('fromCountry','FR','fromCity','Paris','toCountry','KE','toCity','Nairobi','neededBy',(current_date+20)::text,'weightKg',3,'categories',jsonb_build_array('clothing'),'description','Two cotton shirts','budgetUsd',30),
 '[{"description":"Cotton shirts"}]',array[]::text[],true) as parcel_id \gset
insert into public.matches(id,trip_id,parcel_id,requester_id) values('50000000-0000-4000-8000-000000000005','40000000-0000-4000-8000-000000000004',:'parcel_id','10000000-0000-4000-8000-000000000001');
select set_config('request.jwt.claim.sub','20000000-0000-4000-8000-000000000002',true);
select public.respond_match('50000000-0000-4000-8000-000000000005',true);
select public.advance_match('50000000-0000-4000-8000-000000000005');
select public.confirm_parcel_inspection('50000000-0000-4000-8000-000000000005',1,array[]::text[],true,true,true,true);
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
select public.confirm_parcel_inspection('50000000-0000-4000-8000-000000000005',1,array[]::text[],true,true,true,true);
reset role;
update public.profiles set id_verified=false where id='10000000-0000-4000-8000-000000000001';
set local role authenticated;
select set_config('request.jwt.claim.sub','20000000-0000-4000-8000-000000000002',true);
select test.denied($q$select public.advance_match('50000000-0000-4000-8000-000000000005')$q$,'sender must complete','sender verification enforced at pickup');
reset role;
update public.profiles set id_verified=true where id='10000000-0000-4000-8000-000000000001';
set local role authenticated;
select public.advance_match('50000000-0000-4000-8000-000000000005');
select set_config('request.jwt.claim.sub','30000000-0000-4000-8000-000000000003',true);
select test.denied($q$select public.report_delivery('50000000-0000-4000-8000-000000000005','not_received','A fake report from an outsider')$q$,'Not allowed','outsider cannot report a delivery');
select test.denied($q$select public.my_delivery_report('50000000-0000-4000-8000-000000000005')$q$,'Not allowed','outsider cannot see case status');
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
select test.denied($q$select public.report_delivery('50000000-0000-4000-8000-000000000005','not_received','short')$q$,'10 to 2000','empty or vague report rejected');
select public.report_delivery('50000000-0000-4000-8000-000000000005','not_received','The recipient has not received the parcel.') as report_id \gset
select test.ok(public.report_delivery('50000000-0000-4000-8000-000000000005','not_received','The recipient has not received the parcel.')=:'report_id'::uuid,'report retry is idempotent');
select test.ok(public.my_delivery_report('50000000-0000-4000-8000-000000000005')->>'on_hold'='true','reporter sees hold');
select test.denied($q$select public.sender_confirm_delivery('50000000-0000-4000-8000-000000000005')$q$,'report is being reviewed','report blocks sender completion');
select set_config('request.jwt.claim.sub','20000000-0000-4000-8000-000000000002',true);
select test.denied($q$select public.deliver_now('50000000-0000-4000-8000-000000000005')$q$,'report is being reviewed','report blocks traveller completion');
select test.ok(public.my_delivery_report('50000000-0000-4000-8000-000000000005')->>'report' is null,'other party sees hold without private allegation');
select test.denied('select * from private.delivery_reports','permission denied','snapshots never exposed to customers');
select set_config('request.jwt.claim.sub','60000000-0000-4000-8000-000000000006',true);
select test.denied('select public.admin_delivery_reports()','authenticator','admin without second factor cannot view cases');
select set_config('request.jwt.claims','{"aal":"aal2"}',true);
select test.ok(jsonb_array_length(public.admin_delivery_reports())=1,'admin queue contains case');
select test.ok(public.admin_delivery_reports(:'report_id')->'snapshot'->'match'->>'code_hash' is null,'case excludes delivery code hash');
select test.ok(public.admin_delivery_reports(:'report_id')->'handover_record'->'people' is not null,'pickup identity and contacts preserved');
select public.review_delivery_report(:'report_id','reviewing','We are investigating the missing parcel.','20000000-0000-4000-8000-000000000002');
select test.ok(public.admin_delivery_reports(:'report_id')->'restrictions'->0->>'user_id'='20000000-0000-4000-8000-000000000002','admin can restrict new bookings');
select set_config('request.jwt.claim.sub','20000000-0000-4000-8000-000000000002',true);
select test.denied($q$insert into public.trips(traveler_id,from_country,from_city,to_country,to_city,depart_date,space_kg,price_per_kg,categories) values('20000000-0000-4000-8000-000000000002','FR','Paris','KE','Nairobi',current_date+10,10,8,array['clothing'])$q$,'cannot post new listings','restriction enforced in database');
select set_config('request.jwt.claim.sub','60000000-0000-4000-8000-000000000006',true);
select test.denied(format('select public.review_delivery_report(%L,%L,%L,%L)',:'report_id','resolved','Reviewed the report and evidence.','30000000-0000-4000-8000-000000000003'),'not part','admin cannot restrict unrelated account through case');
select public.review_delivery_report(:'report_id','resolved','Recipient confirmed the parcel was found.','20000000-0000-4000-8000-000000000002',true);
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
select test.ok(public.my_delivery_report('50000000-0000-4000-8000-000000000005')->>'on_hold'='false','resolution removes hold');
select public.sender_confirm_delivery('50000000-0000-4000-8000-000000000005');
reset role;
select test.ok((select count(*)=1 from private.delivery_reports),'single case retained');
select test.ok((select count(*)>5 from private.trust_audit),'identity and admin actions audited');
set local role anon;
select test.denied('select public.admin_delivery_reports()','permission denied','anonymous cannot access cases');
select test.denied('select public.my_phone_verification()','permission denied','anonymous cannot read phones');
rollback;
