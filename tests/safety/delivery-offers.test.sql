-- Run only after bootstrap.sql in a disposable local database; no network hooks.
\set ON_ERROR_STOP on
begin;
create schema if not exists private;
create table private.account_restrictions(user_id uuid);
create table private.delivery_reports(match_id uuid,status text);
create table private.delivery_feedback(match_id uuid);
create table private.delivery_events(match_id uuid,status text,created_at timestamptz);
create table public.notification_deliveries(dedup_key text,status text);
alter table public.profiles add column lang text default 'en';
create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;
\ir ../../supabase/migrations/20261126183815_structured_delivery_offers.sql
insert into auth.users(id,email,raw_user_meta_data) values
('10000000-0000-4000-8000-000000000001','sender@test.invalid','{"full_name":"Test Sender"}'),
('20000000-0000-4000-8000-000000000002','traveller@test.invalid','{"full_name":"Test Traveller"}'),
('30000000-0000-4000-8000-000000000003','outsider@test.invalid','{"full_name":"Test Outsider"}');
insert into public.trips(id,traveler_id,from_country,from_city,to_country,to_city,depart_date,space_kg,price_per_kg,categories)
values('40000000-0000-4000-8000-000000000004','20000000-0000-4000-8000-000000000002','FR','Paris','KE','Nairobi',current_date+10,20,8,array['clothing']);
insert into public.parcels(id,sender_id,from_country,from_city,to_country,to_city,needed_by,weight_kg,categories,description,budget_usd)
values('60000000-0000-4000-8000-000000000006','10000000-0000-4000-8000-000000000001','FR','Paris','KE','Nairobi',current_date+20,3,array['clothing'],'Clothing',30);
insert into public.matches(id,trip_id,parcel_id,requester_id)
values('50000000-0000-4000-8000-000000000005','40000000-0000-4000-8000-000000000004','60000000-0000-4000-8000-000000000006','10000000-0000-4000-8000-000000000001');
set local role anon;
select test.denied($q$select public.delivery_offers_for_match('50000000-0000-4000-8000-000000000005')$q$,'permission denied','anonymous cannot read offers');
set local role authenticated;
select set_config('request.jwt.claim.sub','30000000-0000-4000-8000-000000000003',true);
select test.denied($q$select public.delivery_offers_for_match('50000000-0000-4000-8000-000000000005')$q$,'not available','outsider cannot read a booking agreement');
select test.denied($q$select public.propose_delivery_offer('50000000-0000-4000-8000-000000000005','70000000-0000-4000-8000-000000000007',30,'EUR','Friday')$q$,'not available','outsider cannot propose');
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
select test.denied($q$select public.propose_delivery_offer('50000000-0000-4000-8000-000000000005','70000000-0000-4000-8000-000000000007',30,'EUR','Friday')$q$,'Accept the delivery request','an unanswered request remains unconfirmed');
select set_config('request.jwt.claim.sub','20000000-0000-4000-8000-000000000002',true);
select public.respond_match('50000000-0000-4000-8000-000000000005',true);
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
select test.denied($q$select public.propose_delivery_offer('50000000-0000-4000-8000-000000000005','70000000-0000-4000-8000-000000000007',-1,'EUR','Friday')$q$,'valid total fee','negative fee rejected');
select test.denied($q$select public.propose_delivery_offer('50000000-0000-4000-8000-000000000005','70000000-0000-4000-8000-000000000007','NaN','EUR','Friday')$q$,'valid total fee','NaN rejected');
select test.denied($q$select public.propose_delivery_offer('50000000-0000-4000-8000-000000000005','70000000-0000-4000-8000-000000000007',1.001,'EUR','Friday')$q$,'valid total fee','fractional cent rejected');
select test.ok(jsonb_array_length(public.propose_delivery_offer('50000000-0000-4000-8000-000000000005','70000000-0000-4000-8000-000000000007',30,'EUR','Collect Friday, deliver Monday'))=1,'offer returned immediately after save');
select public.propose_delivery_offer('50000000-0000-4000-8000-000000000005','70000000-0000-4000-8000-000000000007',30,'EUR','Collect Friday, deliver Monday');
select test.ok((select count(*)=1 from public.messages),'submission retry produces one message');
select test.denied($q$select public.respond_delivery_offer('50000000-0000-4000-8000-000000000005','70000000-0000-4000-8000-000000000007',true)$q$,'Only the other person','cannot accept own price');
select test.denied($q$select public.advance_match('50000000-0000-4000-8000-000000000005')$q$,'current price offer','old client cannot bypass bilateral agreement');
select test.denied($q$update private.delivery_offers set amount=1$q$,'permission denied','price history is not writable by members');
select set_config('request.jwt.claim.sub','20000000-0000-4000-8000-000000000002',true);
select test.denied($q$select public.propose_delivery_offer('50000000-0000-4000-8000-000000000005','80000000-0000-4000-8000-000000000008',35,'EUR','Friday')$q$,'offer changed','stale counteroffer does not overwrite current price');
select public.propose_delivery_offer('50000000-0000-4000-8000-000000000005','80000000-0000-4000-8000-000000000008',35,'EUR','Collect Friday, deliver Monday','70000000-0000-4000-8000-000000000007');
select test.ok(jsonb_array_length(public.delivery_offers_for_match('50000000-0000-4000-8000-000000000005'))=2,'counteroffer preserves history');
select test.denied($q$select public.respond_delivery_offer('50000000-0000-4000-8000-000000000005','70000000-0000-4000-8000-000000000007',true)$q$,'no longer current','cannot accept replaced price');
reset role;
insert into private.delivery_reports values('50000000-0000-4000-8000-000000000005','open');
set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
select test.denied($q$select public.respond_delivery_offer('50000000-0000-4000-8000-000000000005','80000000-0000-4000-8000-000000000008',true)$q$,'on hold','open complaint blocks agreement');
reset role;
delete from private.delivery_reports;
insert into private.delivery_events values('50000000-0000-4000-8000-000000000005','accepted',now()-interval '2 days');
select set_config('request.jwt.claims','{"role":"service_role"}',true);
select test.ok((select count(*)=0 from private.delivery_followup_candidates()),'no reminder before latest offer is 24 hours old');
update private.delivery_offers set created_at=now()-interval '25 hours' where status='pending';
select test.ok((select count(*)=1 and min(recipient_id::text)='10000000-0000-4000-8000-000000000001' from private.delivery_followup_candidates()),'reminder targets the counteroffer recipient');
set local role authenticated;
select public.respond_delivery_offer('50000000-0000-4000-8000-000000000005','80000000-0000-4000-8000-000000000008',false);
select test.ok((select status='accepted' from public.matches),'declining price does not cancel delivery');
select public.propose_delivery_offer('50000000-0000-4000-8000-000000000005','90000000-0000-4000-8000-000000000009',32,'EUR','Collect Friday, deliver Monday');
select set_config('request.jwt.claim.sub','20000000-0000-4000-8000-000000000002',true);
select public.respond_delivery_offer('50000000-0000-4000-8000-000000000005','90000000-0000-4000-8000-000000000009',true);
select test.ok((select status='escrow_paid' from public.matches),'bilateral acceptance advances terms without marking pickup or payment');
select public.respond_delivery_offer('50000000-0000-4000-8000-000000000005','90000000-0000-4000-8000-000000000009',true);
select test.ok((select count(*)=5 from public.messages),'acceptance retry does not duplicate chat or emails');
select test.denied($q$select public.propose_delivery_offer('50000000-0000-4000-8000-000000000005','a0000000-0000-4000-8000-00000000000a',10,'EUR','Friday')$q$,'cannot be changed','accepted agreement is immutable');
select test.denied($q$select public.advance_match('50000000-0000-4000-8000-000000000005')$q$,'identity verification','price acceptance never bypasses handover checks');
reset role;
select test.ok((select amount=32 and weight_kg=3 and responder_id='20000000-0000-4000-8000-000000000002' from private.delivery_offers where status='accepted'),'agreed fee, weight and responder are preserved');
rollback;
