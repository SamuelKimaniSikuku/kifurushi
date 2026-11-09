-- A participant's public listing join may be hidden after another booking.
-- Return only the saved weight, space and request availability alongside the
-- existing participant-scoped feedback. No listing RLS or booking state changes.
create or replace function private.my_delivery_feedback()
returns jsonb language sql stable security definer set search_path='' as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'match_id',m.id,
    'can_review',private.can_review_delivery(m.id),
    'can_report_receipt',p.sender_id=auth.uid() and private.accepted_delivery(m.id),
    'outcome',f.outcome,
    'parcel_weight_kg',p.weight_kg,
    'remaining_kg',t.remaining_kg,
    'request_availability',case
      when m.status <> 'requested' then null
      when p.safety_hold then 'unavailable'
      when exists (
        select 1 from public.matches other
        where other.parcel_id=m.parcel_id and other.id<>m.id
          and other.status in ('accepted','escrow_paid','picked_up','in_transit','delivered','released','disputed')
      ) then 'booked_elsewhere'
      when p.status<>'open' or t.status<>'open'
        or t.from_country<>p.from_country or t.to_country<>p.to_country
        or t.depart_date<current_date or t.depart_date>p.needed_by then 'unavailable'
      else 'available'
    end
  )), '[]'::jsonb)
  from public.matches m
  join public.trips t on t.id=m.trip_id
  join public.parcels p on p.id=m.parcel_id
  left join private.delivery_feedback f on f.match_id=m.id and f.user_id=auth.uid()
  where auth.uid() in(t.traveler_id,p.sender_id);
$$;
revoke all on function private.my_delivery_feedback() from public,anon;
grant execute on function private.my_delivery_feedback() to authenticated;
