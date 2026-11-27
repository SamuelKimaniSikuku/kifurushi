-- Explicit item types and structured parcel details. Existing listings are not reclassified.
alter table public.parcels drop constraint parcels_categories_check;
alter table public.trips drop constraint trips_categories_check;
alter table public.parcels add constraint parcels_categories_check check (
 cardinality(categories)>0 and array_position(categories,null) is null and categories <@ array['certificates','documents','clothing','electronics','food','medicine','gifts','books','cosmetics','baby','shoes','other']::text[]);
alter table public.trips add constraint trips_categories_check check (
 cardinality(categories)>0 and array_position(categories,null) is null and categories <@ array['certificates','documents','clothing','electronics','food','medicine','gifts','books','cosmetics','baby','shoes','other']::text[]);
alter table public.parcels add column item_count integer check (item_count between 1 and 10000),
 add column package_type text check (package_type in ('envelope','small_box','large_box','suitcase','not_sure')),
 add column weight_kind text check (weight_kind in ('measured','estimated'));
-- NULL metadata is intentional for legacy posts; no guessed quantities or packaging.
alter table public.parcel_declarations add column parcel_details jsonb not null default '{}'::jsonb;

create or replace function private.accepts_contents(accepted text[],contents text[])
returns boolean language sql immutable set search_path = '' as $$
 select coalesce(cardinality(contents)>0 and not exists (
  select 1 from unnest(contents) c where c is null or not coalesce(c=any(accepted) or (c='certificates' and 'documents'=any(accepted)),false)
 ),false);
$$;
revoke all on function private.accepts_contents(text[],text[]) from public,anon,authenticated;

-- Check both request creation and acceptance. Existing conversations can still be
-- declined/cancelled, and previously accepted deliveries are not invalidated.
create or replace function private.guard_match_contents()
returns trigger language plpgsql security definer set search_path = '' as $$
declare p public.parcels; t public.trips; snapshot jsonb;
begin
 if tg_op='UPDATE' then
  if (new.trip_id,new.parcel_id) is distinct from (old.trip_id,old.parcel_id) then
   raise exception 'A request cannot be moved to another parcel or trip.';
  end if;
  if not (old.status='requested' and new.status='accepted') then return new; end if;
 end if;
 -- Same lock order as the handover guard; serializes listing edits with acceptance.
 select * into p from public.parcels where id=new.parcel_id for update;
 select * into t from public.trips where id=new.trip_id for update;
 if not private.accepts_contents(t.categories,p.categories) then
  raise exception 'This traveller only accepts the item types selected on their trip. Update the parcel categories or choose another traveller.' using errcode='23514';
 end if;
 select d.parcel_details into snapshot from public.parcel_declarations d where d.parcel_id=p.id order by version desc limit 1;
 if snapshot is not null and snapshot <> '{}'::jsonb and snapshot is distinct from jsonb_build_object('categories',p.categories,'itemCount',p.item_count,'packageType',p.package_type,'weightKg',p.weight_kg,'weightKind',p.weight_kind) then
  raise exception 'The parcel details changed. The sender must save and confirm the updated contents before booking.';
 end if;
 return new;
end $$;
revoke all on function private.guard_match_contents() from public,anon,authenticated;
create trigger matches_item_types before insert or update on public.matches for each row execute function private.guard_match_contents();

-- Category narrowing must not contradict an accepted booking. Pending requests
-- are checked again at acceptance, so users can still change plans before booking.
create or replace function private.guard_trip_contents()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
 if new.categories is distinct from old.categories and exists (
  select 1 from public.matches m join public.parcels p on p.id=m.parcel_id
  where m.trip_id=old.id and m.status in ('accepted','escrow_paid','picked_up','in_transit','delivered','released','disputed')
  and not private.accepts_contents(new.categories,p.categories)
 ) then raise exception 'Your selected items conflict with an accepted parcel. Keep those item types or resolve the booking first.'; end if;
 return new;
end $$;
revoke all on function private.guard_trip_contents() from public,anon,authenticated;
create trigger trips_item_types before update on public.trips for each row execute function private.guard_trip_contents();

-- Keep the details that both participants inspect with the declaration version.
create or replace function private.snapshot_parcel_details()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
 select jsonb_build_object('categories',p.categories,'itemCount',p.item_count,'packageType',p.package_type,'weightKg',p.weight_kg,'weightKind',p.weight_kind)
 into new.parcel_details from public.parcels p where p.id=new.parcel_id;
 return new;
end $$;
revoke all on function private.snapshot_parcel_details() from public,anon,authenticated;
create trigger declarations_parcel_details before insert on public.parcel_declarations for each row execute function private.snapshot_parcel_details();

CREATE OR REPLACE FUNCTION private.freeze_committed_parcel()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if new.sender_id is distinct from old.sender_id then raise exception 'Parcel ownership cannot be changed.'; end if;
  if old.safety_hold and new.status <> 'closed' then raise exception 'Support must review this parcel before it can be reopened.'; end if;
  if row(new.from_country,new.from_city,new.to_country,new.to_city,new.weight_kg,new.categories,new.description,new.needed_by,new.budget_usd,new.item_count,new.package_type,new.weight_kind)
    is distinct from row(old.from_country,old.from_city,old.to_country,old.to_city,old.weight_kg,old.categories,old.description,old.needed_by,old.budget_usd,old.item_count,old.package_type,old.weight_kind)
    and exists (select 1 from public.matches where parcel_id=old.id and status in ('accepted','escrow_paid','picked_up','in_transit','delivered','released','disputed')) then
    raise exception 'Cancel the match before changing parcel details. Parcels already collected cannot be edited.';
  end if;
  return new;
end;
$function$
;
CREATE OR REPLACE FUNCTION private.save_parcel(p_parcel jsonb, p_items jsonb, p_photo_paths text[], p_attested boolean, p_parcel_id uuid DEFAULT NULL::uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_id uuid := coalesce(p_parcel_id,gen_random_uuid()); p public.parcels;
begin
  if auth.uid() is null or not public.is_active_member(auth.uid()) then raise exception 'Sign in with an active membership.'; end if;
  if p_parcel->>'itemCount' is not null and (p_parcel->>'itemCount')::numeric <> trunc((p_parcel->>'itemCount')::numeric) then raise exception 'Use a whole number of items.'; end if;
  if p_parcel_id is null then
    insert into public.parcels(id,sender_id,from_country,from_city,to_country,to_city,needed_by,weight_kg,categories,description,budget_usd,item_count,package_type,weight_kind)
    values(v_id,auth.uid(),p_parcel->>'fromCountry',trim(p_parcel->>'fromCity'),p_parcel->>'toCountry',trim(p_parcel->>'toCity'),
      (p_parcel->>'neededBy')::date,(p_parcel->>'weightKg')::numeric,array(select jsonb_array_elements_text(p_parcel->'categories')),
      trim(p_parcel->>'description'),(p_parcel->>'budgetUsd')::numeric,(p_parcel->>'itemCount')::integer,p_parcel->>'packageType',case when (p_parcel->>'weightKg')::numeric > 0 then p_parcel->>'weightKind' end);
  else
    select * into p from public.parcels where id=v_id for update;
    if p.sender_id is distinct from auth.uid() then raise exception 'Only the sender can update this parcel.'; end if;
    if p.safety_hold or p.status <> 'open' then raise exception 'Cancel the active match before editing this parcel. Safety holds require support review.'; end if;
    update public.parcels set from_country=p_parcel->>'fromCountry',from_city=trim(p_parcel->>'fromCity'),
      to_country=p_parcel->>'toCountry',to_city=trim(p_parcel->>'toCity'),needed_by=(p_parcel->>'neededBy')::date,
      weight_kg=(p_parcel->>'weightKg')::numeric,categories=array(select jsonb_array_elements_text(p_parcel->'categories')),
      description=trim(p_parcel->>'description'),budget_usd=(p_parcel->>'budgetUsd')::numeric,
      item_count=case when p_parcel ? 'itemCount' then (p_parcel->>'itemCount')::integer else p.item_count end,
      package_type=case when p_parcel ? 'packageType' then p_parcel->>'packageType' else p.package_type end,
      weight_kind=case when (p_parcel->>'weightKg')::numeric > 0 then case when p_parcel ? 'weightKind' then p_parcel->>'weightKind' else p.weight_kind end end where id=v_id;
  end if;
  perform private.declare_parcel(v_id,p_items,p_photo_paths,p_attested);
  return v_id;
end;
$function$
;
