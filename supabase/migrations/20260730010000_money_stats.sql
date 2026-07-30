-- Money on Kifurushi never touches Kifurushi: the fee is agreed and paid
-- directly between the two people. So the only figure the database can honestly
-- report is the budget posted on the parcel, which is what both sides accepted
-- when the match was made. Everything below is therefore an estimate, and the
-- UI says so — inventing a precise "you earned $291" from a number nobody
-- confirmed would be the same mistake as the photo log.
--
-- Both functions are security definer because the totals span rows RLS hides
-- from the caller (the counterparty's parcel closes after release), and both
-- only ever count matches that actually completed — status 'released'.

create or replace function public.my_money_totals()
returns table (
  carried_count    int,
  earned_estimate  numeric,
  sent_count       int,
  spent_estimate   numeric,
  courier_estimate numeric
)
language sql
stable
security definer
set search_path = public
as $$
  with mine as (
    select
      m.id,
      t.traveler_id,
      p.sender_id,
      coalesce(p.budget_usd, 0) as fee,
      coalesce(p.weight_kg, 0)  as kg
    from public.matches m
    join public.trips   t on t.id = m.trip_id
    join public.parcels p on p.id = m.parcel_id
    where m.status = 'released'
      and (t.traveler_id = auth.uid() or p.sender_id = auth.uid())
      -- A delivery to yourself is not a delivery.
      and t.traveler_id <> p.sender_id
  )
  select
    count(*) filter (where traveler_id = auth.uid())::int,
    coalesce(sum(fee) filter (where traveler_id = auth.uid()), 0),
    count(*) filter (where sender_id = auth.uid())::int,
    coalesce(sum(fee) filter (where sender_id = auth.uid()), 0),
    -- What the same parcels would have cost by courier, at the $14/kg baseline
    -- used everywhere else in the product.
    coalesce(sum(kg * 14) filter (where sender_id = auth.uid()), 0)
  from mine;
$$;

revoke all on function public.my_money_totals() from public, anon;
grant execute on function public.my_money_totals() to authenticated;


-- Social proof: the most a traveller has made carrying for other people.
--
-- Gated deliberately. With only a handful of deliveries this figure says more
-- about who tested the app than about what it pays, so it stays hidden until
-- there is enough genuine activity for the number to mean something. Self
-- matches are excluded, and a "traveller" only counts once they have carried
-- for at least two different senders — one enthusiastic pair is not a market.
create or replace function public.top_earner()
returns table (
  full_name    text,
  user_id      uuid,
  earned       numeric,
  deliveries   int
)
language sql
stable
security definer
set search_path = public
as $$
  with real_deliveries as (
    select
      t.traveler_id,
      p.sender_id,
      coalesce(p.budget_usd, 0) as fee
    from public.matches m
    join public.trips   t on t.id = m.trip_id
    join public.parcels p on p.id = m.parcel_id
    where m.status = 'released'
      and t.traveler_id <> p.sender_id
  ),
  per_traveller as (
    select
      traveler_id,
      sum(fee)                      as earned,
      count(*)::int                 as deliveries,
      count(distinct sender_id)     as senders
    from real_deliveries
    group by traveler_id
  ),
  eligible as (
    select * from per_traveller where senders >= 2
  )
  select pr.full_name, e.traveler_id, e.earned, e.deliveries
  from eligible e
  join public.profiles pr on pr.id = e.traveler_id
  -- Hold it back until the marketplace is genuinely active.
  where (select count(*) from real_deliveries) >= 25
    and (select count(*) from eligible) >= 5
  order by e.earned desc
  limit 1;
$$;

revoke all on function public.top_earner() from public;
grant execute on function public.top_earner() to anon, authenticated;
