-- One brief description and sender confirmation are enough to post.
-- Existing detailed declarations are retained; omitted values stay unknown,
-- never silently replaced with a made-up quantity or monetary amount.
alter table public.parcel_declarations alter column declared_value_usd drop not null;
alter table public.parcels
  drop constraint parcels_description_check,
  add constraint parcels_description_check check (char_length(trim(description)) between 3 and 400);

create or replace function private.declare_parcel(p_parcel_id uuid,p_items jsonb,p_photo_paths text[],p_attested boolean)
returns integer language plpgsql security definer set search_path = '' as $$
declare p public.parcels; v_version integer; v_item jsonb; v_total numeric := 0; v_missing_value boolean := false;
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
      or length(trim(v_item->>'description')) not between 3 and 400 then
      raise exception 'Briefly describe the parcel contents (3 to 400 characters).';
    end if;
    -- Quantities and values from older clients remain valid, but are optional.
    if v_item ? 'quantity' and jsonb_typeof(v_item->'quantity') <> 'null' then
      if jsonb_typeof(v_item->'quantity') <> 'number' then raise exception 'Enter valid quantities.'; end if;
      if (v_item->>'quantity')::numeric not between 1 and 1000
        or (v_item->>'quantity')::numeric <> trunc((v_item->>'quantity')::numeric) then
        raise exception 'Enter valid quantities.';
      end if;
    end if;
    if v_item ? 'valueUsd' and jsonb_typeof(v_item->'valueUsd') <> 'null' then
      if jsonb_typeof(v_item->'valueUsd') <> 'number' then raise exception 'Enter valid item values.'; end if;
      if (v_item->>'valueUsd')::numeric not between 0.01 and 100000 then raise exception 'Enter valid item values.'; end if;
      v_total := v_total + (v_item->>'valueUsd')::numeric;
    else
      v_missing_value := true;
    end if;
  end loop;
  if v_total > 100000 then raise exception 'Total declared value must not exceed $100,000.'; end if;
  perform private.validate_evidence(p_photo_paths,false);
  insert into public.parcel_declarations(parcel_id,version,items,photo_paths,declared_value_usd,declared_by)
    values(p_parcel_id,v_version+1,p_items,p_photo_paths,case when v_missing_value then null else v_total end,auth.uid());
  return v_version+1;
end;
$$;
