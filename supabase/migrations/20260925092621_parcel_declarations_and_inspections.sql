-- Private contents records and evidence, followed by two-party handover checks.
-- Existing parcels can add a declaration; parcels already in transit can finish.
-- Every pre-pickup match (including older ones) must complete the new checks.
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated, service_role;

create table public.parcel_declarations (
  parcel_id uuid not null references public.parcels(id),
  version integer not null check (version > 0),
  items jsonb not null check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) between 1 and 30),
  photo_paths text[] not null check (cardinality(photo_paths) between 1 and 6),
  declared_value_usd numeric(12,2) not null check (declared_value_usd > 0 and declared_value_usd <= 100000),
  declared_by uuid not null references public.profiles(id),
  declared_at timestamptz not null default now(),
  primary key (parcel_id, version)
);

create table public.match_inspections (
  match_id uuid not null references public.matches(id),
  user_id uuid not null references public.profiles(id),
  parcel_id uuid not null,
  declaration_version integer not null,
  role text not null check (role in ('sender','traveler')),
  photo_paths text[] not null default '{}',
  opened boolean not null check (opened),
  contents_match boolean not null check (contents_match),
  sealed_together boolean not null check (sealed_together),
  no_unresolved_concerns boolean not null check (no_unresolved_concerns),
  confirmed_at timestamptz not null default now(),
  primary key (match_id, user_id),
  unique (match_id, role),
  foreign key (parcel_id, declaration_version) references public.parcel_declarations(parcel_id, version),
  check (cardinality(photo_paths) <= 6 and (role = 'sender' or cardinality(photo_paths) >= 1))
);
create index match_inspections_declaration_idx on public.match_inspections(parcel_id, declaration_version);
create index match_inspections_user_idx on public.match_inspections(user_id);
create index parcel_declarations_sender_idx on public.parcel_declarations(declared_by);

create table public.match_safety_refusals (
  match_id uuid primary key references public.matches(id),
  reporter_id uuid not null references public.profiles(id),
  reason text not null check (reason in ('contents_mismatch','cannot_inspect','prohibited_or_restricted','other_safety_concern')),
  notes text not null default '' check (char_length(notes) <= 1000),
  created_at timestamptz not null default now()
);
create index match_safety_refusals_reporter_idx on public.match_safety_refusals(reporter_id);

alter table public.parcels add column safety_hold boolean not null default false;
-- Table-level grants override column revokes. Leave the existing safe editing
-- surface available to old clients, but never let clients remove a safety hold.
revoke update on public.parcels from authenticated;
grant update (from_country,from_city,to_country,to_city,needed_by,weight_kg,categories,description,budget_usd,status) on public.parcels to authenticated;

alter table public.parcel_declarations enable row level security;
alter table public.match_inspections enable row level security;
alter table public.match_safety_refusals enable row level security;
revoke all on public.parcel_declarations, public.match_inspections, public.match_safety_refusals from public, anon, authenticated;
grant select on public.parcel_declarations, public.match_inspections, public.match_safety_refusals to authenticated;
grant all on public.parcel_declarations, public.match_inspections, public.match_safety_refusals to service_role;

-- Bind the policy to the authenticated identity explicitly. A private definer
-- helper can check ownership even after a parcel/trip leaves public listings;
-- it returns only a boolean and cannot accept a caller-supplied identity.
create function private.is_safety_match_party(p_match_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and exists (
    select 1 from public.matches m
    join public.trips t on t.id = m.trip_id
    join public.parcels p on p.id = m.parcel_id
    where m.id = p_match_id and (p.sender_id = auth.uid() or t.traveler_id = auth.uid())
  );
$$;
revoke all on function private.is_safety_match_party(uuid) from public,anon,authenticated;
grant execute on function private.is_safety_match_party(uuid) to authenticated;

create policy "declarations visible to sender and matched parties" on public.parcel_declarations for select to authenticated using (
  declared_by = (select auth.uid()) or exists (
    select 1 from public.matches m where m.parcel_id = parcel_declarations.parcel_id
      and private.is_safety_match_party(m.id)
  )
);
create policy "match parties read inspection record" on public.match_inspections for select to authenticated using (
  private.is_safety_match_party(match_id)
);
create policy "match parties read safety refusal" on public.match_safety_refusals for select to authenticated using (
  private.is_safety_match_party(match_id)
);

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('parcel-evidence','parcel-evidence',false,8388608,array['image/jpeg','image/png','image/webp']);
create policy "members upload their own parcel evidence" on storage.objects for insert to authenticated with check (
  bucket_id = 'parcel-evidence' and (storage.foldername(name))[1] = (select auth.uid())::text
);
create policy "only owners and matching parties read evidence" on storage.objects for select to authenticated using (
  bucket_id = 'parcel-evidence' and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or exists (select 1 from public.parcel_declarations d where name = any(d.photo_paths))
    or exists (select 1 from public.match_inspections i where name = any(i.photo_paths))
  )
);
-- There are deliberately no client update/delete policies: confirmed evidence
-- cannot be overwritten or removed through Storage. Orphan cleanup is server-only.

create function private.validate_evidence(p_paths text[], p_required boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare v_path text;
begin
  if auth.uid() is null then raise exception 'Sign in to continue.'; end if;
  if p_paths is null or cardinality(p_paths) > 6 or (p_required and cardinality(p_paths) < 1) then
    raise exception 'Add between 1 and 6 evidence photos.';
  end if;
  if cardinality(p_paths) <> (select count(distinct x) from unnest(p_paths) x) then
    raise exception 'Each evidence photo must be different.';
  end if;
  foreach v_path in array p_paths loop
    if v_path is null or split_part(v_path,'/',1) <> auth.uid()::text or not exists (
      select 1 from storage.objects o where o.bucket_id='parcel-evidence' and o.name=v_path
    ) then raise exception 'Upload each photo from your own account first.'; end if;
  end loop;
end;
$$;

create function private.declare_parcel(p_parcel_id uuid,p_items jsonb,p_photo_paths text[],p_attested boolean)
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
  perform private.validate_evidence(p_photo_paths,true);
  insert into public.parcel_declarations(parcel_id,version,items,photo_paths,declared_value_usd,declared_by)
    values(p_parcel_id,v_version+1,p_items,p_photo_paths,v_total,auth.uid());
  return v_version+1;
end;
$$;

create function public.declare_parcel(p_parcel_id uuid,p_items jsonb,p_photo_paths text[],p_attested boolean)
returns integer language sql security invoker set search_path = '' as $$
  select private.declare_parcel(p_parcel_id,p_items,p_photo_paths,p_attested);
$$;

create function private.save_parcel(p_parcel jsonb,p_items jsonb,p_photo_paths text[],p_attested boolean,p_parcel_id uuid default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid := coalesce(p_parcel_id,gen_random_uuid()); p public.parcels;
begin
  if auth.uid() is null or not public.is_active_member(auth.uid()) then raise exception 'Sign in with an active membership.'; end if;
  if p_parcel_id is null then
    insert into public.parcels(id,sender_id,from_country,from_city,to_country,to_city,needed_by,weight_kg,categories,description,budget_usd)
    values(v_id,auth.uid(),p_parcel->>'fromCountry',trim(p_parcel->>'fromCity'),p_parcel->>'toCountry',trim(p_parcel->>'toCity'),
      (p_parcel->>'neededBy')::date,(p_parcel->>'weightKg')::numeric,array(select jsonb_array_elements_text(p_parcel->'categories')),
      trim(p_parcel->>'description'),(p_parcel->>'budgetUsd')::numeric);
  else
    select * into p from public.parcels where id=v_id for update;
    if p.sender_id is distinct from auth.uid() then raise exception 'Only the sender can update this parcel.'; end if;
    if p.safety_hold or p.status <> 'open' then raise exception 'Cancel the active match before editing this parcel. Safety holds require support review.'; end if;
    update public.parcels set from_country=p_parcel->>'fromCountry',from_city=trim(p_parcel->>'fromCity'),
      to_country=p_parcel->>'toCountry',to_city=trim(p_parcel->>'toCity'),needed_by=(p_parcel->>'neededBy')::date,
      weight_kg=(p_parcel->>'weightKg')::numeric,categories=array(select jsonb_array_elements_text(p_parcel->'categories')),
      description=trim(p_parcel->>'description'),budget_usd=(p_parcel->>'budgetUsd')::numeric where id=v_id;
  end if;
  perform private.declare_parcel(v_id,p_items,p_photo_paths,p_attested);
  return v_id;
end;
$$;

create function public.save_parcel(p_parcel jsonb,p_items jsonb,p_photo_paths text[],p_attested boolean,p_parcel_id uuid default null)
returns uuid language sql security invoker set search_path = '' as $$
  select private.save_parcel(p_parcel,p_items,p_photo_paths,p_attested,p_parcel_id);
$$;

create function private.confirm_parcel_inspection(p_match_id uuid,p_version integer,p_photo_paths text[],p_opened boolean,p_matches boolean,p_sealed boolean,p_no_concerns boolean)
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
  perform private.validate_evidence(p_photo_paths,v_role='traveler');
  insert into public.match_inspections(match_id,user_id,parcel_id,declaration_version,role,photo_paths,opened,contents_match,sealed_together,no_unresolved_concerns)
    values(p_match_id,auth.uid(),p.id,p_version,v_role,p_photo_paths,true,true,true,true);
end;
$$;

create function public.confirm_parcel_inspection(p_match_id uuid,p_version integer,p_photo_paths text[],p_opened boolean,p_matches boolean,p_sealed boolean,p_no_concerns boolean)
returns void language sql security invoker set search_path = '' as $$
  select private.confirm_parcel_inspection(p_match_id,p_version,p_photo_paths,p_opened,p_matches,p_sealed,p_no_concerns);
$$;

-- One guard covers advance_match, deliver_now, sender_confirm_delivery and any
-- future RPC: none can skip inspection by updating the status another way.
create function private.enforce_safe_handover()
returns trigger language plpgsql security definer set search_path = '' as $$
declare p public.parcels; t public.trips; v_traveler uuid; v_version integer;
begin
  if tg_op='INSERT' then
    if new.status <> 'requested' then raise exception 'A match must start as a request.'; end if;
    select * into p from public.parcels where id=new.parcel_id;
    if p.safety_hold then raise exception 'This parcel is held for support review.'; end if;
    return new;
  end if;
  if new.status is not distinct from old.status then return new; end if;
  if new.status in ('accepted','escrow_paid','picked_up','in_transit','delivered','released') then
    select * into p from public.parcels where id=new.parcel_id for update;
    if p.safety_hold then raise exception 'This parcel is held for support review.'; end if;
  end if;
  if old.status='requested' and new.status='accepted' then
    -- Recheck under locks: two simultaneous acceptances must not reserve the
    -- same parcel twice or oversell the traveller's remaining kilos.
    select * into t from public.trips where id=new.trip_id for update;
    if p.status <> 'open' or t.status <> 'open' then raise exception 'This parcel or trip is no longer available.'; end if;
    if t.remaining_kg < p.weight_kg then raise exception 'There is no longer enough space on this trip.'; end if;
    if t.from_country <> p.from_country or t.to_country <> p.to_country or t.depart_date < current_date or t.depart_date > p.needed_by then
      raise exception 'The current parcel route or date no longer fits this trip.';
    end if;
  end if;
  if old.status in ('requested','accepted','escrow_paid') and new.status in ('picked_up','in_transit','delivered','released') then
    if old.status <> 'escrow_paid' or new.status <> 'picked_up' then
      raise exception 'Complete the inspection and mark the parcel picked up before delivery.';
    end if;
    select traveler_id into v_traveler from public.trips where id=new.trip_id;
    if not exists (select 1 from public.profiles where id=v_traveler and id_verified) then
      raise exception 'The traveller must complete identity verification before pickup.';
    end if;
    select max(version) into v_version from public.parcel_declarations where parcel_id=new.parcel_id;
    if v_version is null or not exists (
      select 1 from public.match_inspections where match_id=new.id and user_id=p.sender_id and role='sender' and declaration_version=v_version
    ) or not exists (
      select 1 from public.match_inspections where match_id=new.id and user_id=v_traveler and role='traveler' and declaration_version=v_version
    ) then raise exception 'Both people must confirm inspection of the current declaration before pickup.'; end if;
  end if;
  return new;
end;
$$;
create trigger matches_enforce_safe_handover before insert or update on public.matches for each row execute function private.enforce_safe_handover();

create function private.freeze_committed_parcel()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.sender_id is distinct from old.sender_id then raise exception 'Parcel ownership cannot be changed.'; end if;
  if old.safety_hold and new.status <> 'closed' then raise exception 'Support must review this parcel before it can be reopened.'; end if;
  if row(new.from_country,new.from_city,new.to_country,new.to_city,new.weight_kg,new.categories,new.description,new.needed_by,new.budget_usd)
    is distinct from row(old.from_country,old.from_city,old.to_country,old.to_city,old.weight_kg,old.categories,old.description,old.needed_by,old.budget_usd)
    and exists (select 1 from public.matches where parcel_id=old.id and status in ('accepted','escrow_paid','picked_up','in_transit','delivered','released','disputed')) then
    raise exception 'Cancel the match before changing parcel details. Parcels already collected cannot be edited.';
  end if;
  return new;
end;
$$;
create trigger parcels_freeze_committed before update on public.parcels for each row execute function private.freeze_committed_parcel();

revoke update on public.trips from authenticated;
grant update (from_country,from_city,to_country,to_city,depart_date,space_kg,price_per_kg,notes,categories,status) on public.trips to authenticated;
create function private.freeze_committed_trip()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.traveler_id is distinct from old.traveler_id then raise exception 'Trip ownership cannot be changed.'; end if;
  if new.space_kg < new.booked_kg and (new.space_kg < old.space_kg or new.booked_kg > old.booked_kg) then
    raise exception 'Trip space cannot be reduced below the reserved weight.';
  end if;
  if row(new.from_country,new.from_city,new.to_country,new.to_city,new.depart_date)
    is distinct from row(old.from_country,old.from_city,old.to_country,old.to_city,old.depart_date)
    and exists(select 1 from public.matches where trip_id=old.id and status in ('accepted','escrow_paid','picked_up','in_transit','delivered','released','disputed')) then
    raise exception 'Cancel active matches before changing the journey. Completed journeys cannot be changed.';
  end if;
  return new;
end;
$$;
create trigger trips_freeze_committed before update on public.trips for each row execute function private.freeze_committed_trip();

create function private.refuse_parcel(p_match_id uuid,p_reason text,p_notes text default '')
returns void language plpgsql security definer set search_path = '' as $$
declare m public.matches; v_traveler uuid;
begin
  select * into m from public.matches where id=p_match_id for update;
  select traveler_id into v_traveler from public.trips where id=m.trip_id;
  if auth.uid() is null or auth.uid() is distinct from v_traveler then raise exception 'Only the matched traveller can refuse this parcel.'; end if;
  if exists(select 1 from public.match_safety_refusals where match_id=p_match_id) then return; end if;
  if m.status not in ('requested','accepted','escrow_paid') then raise exception 'Use support for concerns after pickup. This refusal is for parcels not yet collected.'; end if;
  perform 1 from public.parcels where id=m.parcel_id for update;
  insert into public.match_safety_refusals(match_id,reporter_id,reason,notes)
    values(p_match_id,auth.uid(),p_reason,trim(coalesce(p_notes,'')));
  -- Suspect parcels must not immediately be offered to the next traveller.
  update public.parcels set status='closed',safety_hold=true where id=m.parcel_id;
  update public.matches set status='cancelled' where parcel_id=m.parcel_id and status in ('requested','accepted','escrow_paid');
  insert into public.incidents(kind,severity,source,summary,detail,user_id)
    values('parcel_safety_refusal','severe','server','A traveller refused a parcel for a safety concern',
      jsonb_build_object('match_id',p_match_id,'parcel_id',m.parcel_id,'reason',p_reason),auth.uid());
end;
$$;

create function public.refuse_parcel(p_match_id uuid,p_reason text,p_notes text default '')
returns void language sql security invoker set search_path = '' as $$
  select private.refuse_parcel(p_match_id,p_reason,p_notes);
$$;

-- Explicit grants are required on projects without automatic Data API grants.
revoke all on function private.validate_evidence(text[],boolean), private.declare_parcel(uuid,jsonb,text[],boolean),
  private.save_parcel(jsonb,jsonb,text[],boolean,uuid), private.confirm_parcel_inspection(uuid,integer,text[],boolean,boolean,boolean,boolean),
  private.refuse_parcel(uuid,text,text), private.enforce_safe_handover(), private.freeze_committed_parcel(), private.freeze_committed_trip() from public,anon,authenticated;
grant execute on function private.declare_parcel(uuid,jsonb,text[],boolean), private.save_parcel(jsonb,jsonb,text[],boolean,uuid),
  private.confirm_parcel_inspection(uuid,integer,text[],boolean,boolean,boolean,boolean), private.refuse_parcel(uuid,text,text) to authenticated;
revoke all on function public.declare_parcel(uuid,jsonb,text[],boolean), public.save_parcel(jsonb,jsonb,text[],boolean,uuid),
  public.confirm_parcel_inspection(uuid,integer,text[],boolean,boolean,boolean,boolean), public.refuse_parcel(uuid,text,text) from public,anon;
grant execute on function public.declare_parcel(uuid,jsonb,text[],boolean), public.save_parcel(jsonb,jsonb,text[],boolean,uuid),
  public.confirm_parcel_inspection(uuid,integer,text[],boolean,boolean,boolean,boolean), public.refuse_parcel(uuid,text,text) to authenticated;
