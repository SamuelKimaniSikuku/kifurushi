-- Private, bilateral price agreements. No money is collected or held here.
create table private.delivery_offers (
 id uuid primary key,
 match_id uuid not null references public.matches(id) on delete cascade,
 proposer_id uuid not null references public.profiles(id),
 amount numeric(12,2) not null check (amount between 0 and 1000000),
 currency text not null check (currency in ('EUR','USD','KES','GBP','CAD','CHF','AED','INR','XOF','XAF')),
 weight_kg numeric,
 handover text not null check (length(trim(handover)) between 1 and 500),
 status text not null default 'pending' check (status in ('pending','accepted','declined','superseded')),
 created_at timestamptz not null default now(),
 responded_at timestamptz,
 responder_id uuid references public.profiles(id)
);
alter table private.delivery_offers enable row level security;
revoke all on private.delivery_offers from public, anon, authenticated, service_role;
create index delivery_offers_history on private.delivery_offers(match_id,created_at desc);
create unique index delivery_offers_one_current on private.delivery_offers(match_id) where status in ('pending','accepted');

create function private.delivery_offers_for_match(p_match uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not exists (
  select 1 from public.matches m join public.trips t on t.id=m.trip_id join public.parcels p on p.id=m.parcel_id
  where m.id=p_match and auth.uid() in (t.traveler_id,p.sender_id)
 ) then raise exception 'Delivery not available for this account.'; end if;
 return coalesce((select jsonb_agg(to_jsonb(o) order by o.created_at desc,o.id) from private.delivery_offers o where match_id=p_match),'[]'::jsonb);
end $$;

-- All writes lock the booking first, including counteroffers and retries.
create function private.offer_writable_match(p_match uuid) returns public.matches
language plpgsql security definer set search_path='' as $$
declare m public.matches; v_sender uuid; v_traveler uuid; v_date date; v_hold boolean;
begin
 select * into m from public.matches where id=p_match for update;
 select traveler_id,depart_date into v_traveler,v_date from public.trips where id=m.trip_id;
 select sender_id,safety_hold into v_sender,v_hold from public.parcels where id=m.parcel_id;
 if auth.uid() is null or auth.uid() not in (v_sender,v_traveler) or v_sender is null or v_traveler is null then raise exception 'Delivery not available for this account.'; end if;
 if m.status<>'accepted' then raise exception 'Accept the delivery request before agreeing a price. An agreed price cannot be changed.'; end if;
 if v_date<current_date then raise exception 'The trip date has passed. Arrange a new delivery.'; end if;
 if v_hold or exists(select 1 from private.account_restrictions where user_id in(v_sender,v_traveler))
  or exists(select 1 from private.delivery_reports where match_id=p_match and status<>'resolved')
  or exists(select 1 from public.match_safety_refusals where match_id=p_match)
  or exists(select 1 from private.delivery_feedback where match_id=p_match)
 then raise exception 'This delivery is on hold. Contact support before continuing.'; end if;
 return m;
end $$;

create function private.propose_delivery_offer(p_match uuid,p_id uuid,p_amount numeric,p_currency text,p_handover text,p_previous uuid default null) returns jsonb
language plpgsql security definer set search_path='' as $$
declare m public.matches; v_pending uuid; v_existing private.delivery_offers; v_weight numeric;
begin
 -- Authorize the read first, even for a repeated submission.
 perform private.delivery_offers_for_match(p_match);
 select * into m from public.matches where id=p_match for update;
 select * into v_existing from private.delivery_offers where id=p_id;
 if found then
  if v_existing.match_id=p_match and v_existing.proposer_id=auth.uid() and v_existing.amount=p_amount and v_existing.currency=p_currency and v_existing.handover=trim(p_handover) then return private.delivery_offers_for_match(p_match); end if;
  raise exception 'Offer reference already used.';
 end if;
 m:=private.offer_writable_match(p_match);
 if p_id is null or p_amount is null or p_amount::text in ('NaN','Infinity','-Infinity') or p_amount<0 or p_amount>1000000 or p_amount<>round(p_amount,2)
  or p_currency is null or p_currency not in ('EUR','USD','KES','GBP','CAD','CHF','AED','INR','XOF','XAF') or p_handover is null or length(trim(p_handover)) not between 1 and 500
 then raise exception 'Enter a valid total fee, currency and handover details.'; end if;
 select id into v_pending from private.delivery_offers where match_id=p_match and status='pending';
 if v_pending is distinct from p_previous then raise exception 'The offer changed. Refresh and review it first.'; end if;
 if exists(select 1 from private.delivery_offers where match_id=p_match and status='accepted') then raise exception 'The price is already agreed.'; end if;
 select weight_kg into v_weight from public.parcels where id=m.parcel_id;
 update private.delivery_offers set status='superseded',responded_at=now(),responder_id=auth.uid() where id=v_pending;
 insert into private.delivery_offers(id,match_id,proposer_id,amount,currency,weight_kg,handover)
 values(p_id,p_match,auth.uid(),p_amount,p_currency,v_weight,trim(p_handover));
 -- Reuse chat unread badges and the existing rate-limited message emails.
 insert into public.messages(match_id,sender_id,body) values(p_match,auth.uid(),
  'Price offer: '||p_currency||' '||to_char(p_amount,'FM999999990.00')||' total. '||coalesce(v_weight::text||' kg. ','Weight to agree. ')||trim(p_handover)||E'\nReview the offer in Kifurushi to accept, suggest another price or decline. Payment is arranged directly.');
 return private.delivery_offers_for_match(p_match);
end $$;

create function private.respond_delivery_offer(p_match uuid,p_offer uuid,p_accept boolean) returns jsonb
language plpgsql security definer set search_path='' as $$
declare m public.matches; o private.delivery_offers; v_weight numeric;
begin
 perform private.delivery_offers_for_match(p_match);
 select * into m from public.matches where id=p_match for update;
 select * into o from private.delivery_offers where id=p_offer and match_id=p_match;
 if not found or p_accept is null then raise exception 'Offer not found.'; end if;
 if o.proposer_id=auth.uid() then raise exception 'Only the other person can answer this offer.'; end if;
 if o.responder_id=auth.uid() and ((p_accept and o.status='accepted') or (not p_accept and o.status='declined')) then return private.delivery_offers_for_match(p_match); end if;
 m:=private.offer_writable_match(p_match);
 if o.status<>'pending' then raise exception 'This offer is no longer current. Review the latest offer.'; end if;
 select weight_kg into v_weight from public.parcels where id=m.parcel_id;
 if p_accept and v_weight is distinct from o.weight_kg then raise exception 'The parcel weight changed. Ask for a new offer.'; end if;
 update private.delivery_offers set status=case when p_accept then 'accepted' else 'declined' end,responded_at=now(),responder_id=auth.uid() where id=p_offer;
 if p_accept then perform public.advance_match(p_match); end if;
 insert into public.messages(match_id,sender_id,body) values(p_match,auth.uid(),
  case when p_accept then 'Price agreed: ' else 'Price offer declined: ' end||o.currency||' '||to_char(o.amount,'FM999999990.00')||' total.'||case when p_accept then E'\nPayment is arranged directly. Complete the parcel checks before collection.' else ' You can suggest another price.' end);
 return private.delivery_offers_for_match(p_match);
end $$;

-- Older clients cannot bypass the other person's response once an offer exists.
create function private.guard_delivery_offer_agreement() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if old.status='accepted' and new.status='escrow_paid' and exists(select 1 from private.delivery_offers where match_id=new.id)
  and not exists(select 1 from private.delivery_offers where match_id=new.id and status='accepted') then
  raise exception 'Accept the current price offer together before continuing.';
 end if;
 return new;
end $$;
create trigger matches_offer_agreement before update of status on public.matches for each row execute function private.guard_delivery_offer_agreement();

create function public.delivery_offers_for_match(p_match uuid) returns jsonb language sql security invoker set search_path='' as $$ select private.delivery_offers_for_match(p_match) $$;
create function public.propose_delivery_offer(p_match uuid,p_id uuid,p_amount numeric,p_currency text,p_handover text,p_previous uuid default null) returns jsonb language sql security invoker set search_path='' as $$ select private.propose_delivery_offer(p_match,p_id,p_amount,p_currency,p_handover,p_previous) $$;
create function public.respond_delivery_offer(p_match uuid,p_offer uuid,p_accept boolean) returns jsonb language sql security invoker set search_path='' as $$ select private.respond_delivery_offer(p_match,p_offer,p_accept) $$;
revoke all on function private.offer_writable_match(uuid),private.guard_delivery_offer_agreement() from public,anon,authenticated,service_role;
revoke all on function private.delivery_offers_for_match(uuid),private.propose_delivery_offer(uuid,uuid,numeric,text,text,uuid),private.respond_delivery_offer(uuid,uuid,boolean),public.delivery_offers_for_match(uuid),public.propose_delivery_offer(uuid,uuid,numeric,text,text,uuid),public.respond_delivery_offer(uuid,uuid,boolean) from public,anon,authenticated,service_role;
grant usage on schema private to authenticated;
grant execute on function private.delivery_offers_for_match(uuid),private.propose_delivery_offer(uuid,uuid,numeric,text,text,uuid),private.respond_delivery_offer(uuid,uuid,boolean),public.delivery_offers_for_match(uuid),public.propose_delivery_offer(uuid,uuid,numeric,text,text,uuid),public.respond_delivery_offer(uuid,uuid,boolean) to authenticated;

-- Remind the person who needs to answer, never the author of a pending offer.
create or replace function private.delivery_followup_candidates(p_match_id uuid default null)
returns table(match_id uuid, recipient_id uuid, stage text, route text, lang text)
language plpgsql stable security definer set search_path='' as $$
begin
 if coalesce(auth.jwt()->>'role','') <> 'service_role' then
  raise exception 'Service role required';
 end if;
 return query
 with context as (
  select m.id, m.status, m.requester_id, t.traveler_id, p.sender_id,
   t.depart_date, p.needed_by, t.from_city || ' → ' || t.to_city as route,
   coalesce((select max(e.created_at) from private.delivery_events e
     where e.match_id=m.id and e.status=m.status),m.updated_at) as stage_at,
   d.version, p.id as parcel_id,
   (select o.proposer_id from private.delivery_offers o where o.match_id=m.id and o.status='pending') as offer_author,
   (select o.created_at from private.delivery_offers o where o.match_id=m.id and o.status='pending') as offered_at,
   exists(select 1 from private.delivery_feedback f where f.match_id=m.id) as has_feedback
  from public.matches m
  join public.trips t on t.id=m.trip_id
  join public.parcels p on p.id=m.parcel_id
  left join public.parcel_declarations d on d.parcel_id=p.id
  where m.status in ('accepted','escrow_paid','picked_up','in_transit','delivered','released')
   and (p_match_id is null or m.id=p_match_id)
   and not p.safety_hold
   and not exists(select 1 from private.delivery_reports r where r.match_id=m.id and r.status<>'resolved')
   and not exists(select 1 from public.match_safety_refusals r where r.match_id=m.id)
 ), actions as (
  select c.*, member.uid,
   case
    when c.status='released' and not exists(select 1 from public.reviews r where r.match_id=c.id and r.author_id=member.uid) then 'review'
    when c.has_feedback then null
    when c.status='accepted' and c.depart_date>=current_date and
      ((c.offer_author is null and member.uid=c.requester_id) or (c.offer_author is not null and member.uid<>c.offer_author and c.offered_at<=now()-interval '24 hours')) then 'agreement'
    when c.status='escrow_paid' and c.depart_date between current_date and current_date+3 then
     case
      when c.version is null and member.uid=c.sender_id then 'contents'
      when c.version is not null and not exists(select 1 from public.match_inspections i
       where i.match_id=c.id and i.user_id=member.uid and i.declaration_version=c.version) then 'inspection'
      when member.uid=c.traveler_id and (select count(distinct i.role) from public.match_inspections i
       where i.match_id=c.id and i.declaration_version=c.version and i.user_id in(c.sender_id,c.traveler_id))=2 then 'collection'
     end
    when member.uid=c.sender_id and (c.status='delivered' or
      (c.status in('picked_up','in_transit') and current_date>greatest(c.depart_date,c.needed_by))) then 'receipt'
   end as next_stage
  from context c cross join lateral (values(c.sender_id),(c.traveler_id)) member(uid)
  where c.stage_at<=now()-interval '24 hours' and (
   (c.status in('accepted','delivered','released') and c.stage_at>=now()-interval '14 days')
   or (c.status='escrow_paid' and c.depart_date between current_date and current_date+3)
   or (c.status in('picked_up','in_transit') and greatest(c.depart_date,c.needed_by)>=current_date-14)
  )
 )
 select a.id,a.uid,a.next_stage,a.route,coalesce(pr.lang,'en')
 from actions a join public.profiles pr on pr.id=a.uid
 where a.next_stage is not null
  and not exists(select 1 from public.notification_deliveries n
   where n.dedup_key='delivery-followup/'||a.id::text||'/'||a.next_stage||'/'||a.uid::text and n.status='sent')
 order by a.stage_at,a.id,a.uid
 limit 200;
end $$;
