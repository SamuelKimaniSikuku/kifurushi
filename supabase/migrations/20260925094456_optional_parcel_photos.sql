-- Photos are optional; explicit declarations and two-party inspection remain required.
-- Existing evidence, privacy policies, ownership and verification checks are unchanged.
alter table public.parcel_declarations
  drop constraint parcel_declarations_photo_paths_check,
  add constraint parcel_declarations_photo_paths_check check (cardinality(photo_paths) <= 6);
alter table public.match_inspections
  drop constraint match_inspections_check,
  add constraint match_inspections_photo_paths_check check (cardinality(photo_paths) <= 6);

create or replace function private.declare_parcel(p_parcel_id uuid,p_items jsonb,p_photo_paths text[],p_attested boolean)
returns integer language plpgsql security definer set search_path = '' as $$
declare p public.parcels; v_version integer; v_item jsonb; v_total numeric := 0;
begin
  select * into p from public.parcels where id=p_parcel_id for update;
  if auth.uid() is null or p.sender_id is distinct from auth.uid() then raise exception 'Only the sender can declare this parcel.'; end if;
  if p.safety_hold or p.status='closed' then raise exception 'This parcel is closed or held for support review.'; end if;
  select coalesce(max(version),0) into v_version from public.parcel_declarations where parcel_id=p_parcel_id;
  if exists (select 1 from public.matches m where m.parcel_id=p_parcel_id and (
    m.status in ('picked_up','in_transit','delivered','released','disputed')
    or (v_version>0 and m.status in ('accepted','escrow_paid'))
  )) then raise exception 'The declaration is locked. Cancel the match before changing the contents.'; end if;
  if p_attested is distinct from true then raise exception 'Confirm the complete contents declaration.'; end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' then raise exception 'Add an item list.'; end if;
  if jsonb_array_length(p_items) not between 1 and 30 then raise exception 'Declare between 1 and 30 item types.'; end if;
  for v_item in select value from jsonb_array_elements(p_items) loop
    if jsonb_typeof(v_item) <> 'object'
      or jsonb_typeof(v_item->'description') is distinct from 'string'
      or length(trim(v_item->>'description')) not between 3 and 160
      or jsonb_typeof(v_item->'quantity') is distinct from 'number'
      or jsonb_typeof(v_item->'valueUsd') is distinct from 'number' then
      raise exception 'Every item needs a description, quantity and value.';
    end if;
    if (v_item->>'quantity')::numeric not between 1 and 1000
      or (v_item->>'quantity')::numeric <> trunc((v_item->>'quantity')::numeric)
      or (v_item->>'valueUsd')::numeric not between 0.01 and 100000 then
      raise exception 'Enter valid quantities and item values.';
    end if;
    v_total := v_total + (v_item->>'valueUsd')::numeric;
  end loop;
  if v_total > 100000 then raise exception 'Total declared value must not exceed $100,000.'; end if;
  perform private.validate_evidence(p_photo_paths,false);
  insert into public.parcel_declarations(parcel_id,version,items,photo_paths,declared_value_usd,declared_by)
    values(p_parcel_id,v_version+1,p_items,p_photo_paths,v_total,auth.uid());
  return v_version+1;
end;
$$;

create or replace function private.confirm_parcel_inspection(p_match_id uuid,p_version integer,p_photo_paths text[],p_opened boolean,p_matches boolean,p_sealed boolean,p_no_concerns boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare m public.matches; p public.parcels; v_traveler uuid; v_version integer; v_role text;
begin
  select * into m from public.matches where id=p_match_id for update;
  select * into p from public.parcels where id=m.parcel_id for update;
  select traveler_id into v_traveler from public.trips where id=m.trip_id;
  if auth.uid() is null or (auth.uid() is distinct from p.sender_id and auth.uid() is distinct from v_traveler) then
    raise exception 'Only the matched sender and traveller can confirm inspection.';
  end if;
  if m.status <> 'escrow_paid' or p.safety_hold then raise exception 'Agree the terms before inspection. A held parcel cannot be collected.'; end if;
  if p_opened is distinct from true or p_matches is distinct from true or p_sealed is distinct from true or p_no_concerns is distinct from true then
    raise exception 'Complete every inspection check together before confirming.';
  end if;
  select max(version) into v_version from public.parcel_declarations where parcel_id=p.id;
  if v_version is null or p_version is distinct from v_version then raise exception 'The declaration changed. Reload and inspect the current version.'; end if;
  v_role := case when auth.uid()=v_traveler then 'traveler' else 'sender' end;
  if v_role='traveler' and not exists (select 1 from public.profiles where id=v_traveler and id_verified) then
    raise exception 'Complete traveller identity verification before confirming pickup.';
  end if;
  -- Retried requests are idempotent; the original evidence stays immutable.
  if exists (select 1 from public.match_inspections where match_id=p_match_id and user_id=auth.uid() and declaration_version=p_version) then return; end if;
  perform private.validate_evidence(p_photo_paths,false);
  insert into public.match_inspections(match_id,user_id,parcel_id,declaration_version,role,photo_paths,opened,contents_match,sealed_together,no_unresolved_concerns)
    values(p_match_id,auth.uid(),p.id,p_version,v_role,p_photo_paths,true,true,true,true);
end;
$$;
