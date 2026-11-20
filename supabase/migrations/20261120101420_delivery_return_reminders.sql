-- Read-only queue for the existing hourly reminder worker. One reminder per
-- delivery stage and participant, using the existing notification delivery ledger.
-- Private complaints/receipt records never become visible through the Data API.
create function private.delivery_followup_candidates(p_match_id uuid default null)
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
    when c.status='accepted' and member.uid=c.requester_id and c.depart_date>=current_date then 'agreement'
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
revoke all on function private.delivery_followup_candidates(uuid) from public,anon,authenticated;
grant execute on function private.delivery_followup_candidates(uuid) to service_role;
create function public.delivery_followup_candidates(p_match_id uuid default null)
returns table(match_id uuid, recipient_id uuid, stage text, route text, lang text)
language sql stable security invoker set search_path='' as $$
 select * from private.delivery_followup_candidates(p_match_id);
$$;
revoke all on function public.delivery_followup_candidates(uuid) from public,anon,authenticated;
grant execute on function public.delivery_followup_candidates(uuid) to service_role;
