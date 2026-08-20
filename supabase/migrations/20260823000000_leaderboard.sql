-- The public leaderboard: most earned by a traveller, most saved by a sender.
-- Replaces top_earner(), whose visibility gate (25 deliveries, 5 travellers)
-- Samuel has decided to drop in favour of showing real numbers as soon as any
-- exist. Two rules are kept, because they're what make the figures true
-- rather than promotional:
--
--   * only released deliveries count — the receiver's code was entered;
--   * a delivery to yourself is not a delivery (traveler <> sender).
--
-- "Saved" compares the agreed budget to the $14/kg courier baseline used
-- across the product, and a sender only appears while their total is
-- actually positive.

drop function if exists public.top_earner();

create or replace function public.leaderboard()
returns table (
  kind       text,
  full_name  text,
  user_id    uuid,
  amount     numeric,
  deliveries int
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
      coalesce(p.budget_usd, 0)      as fee,
      coalesce(p.weight_kg, 0) * 14  as courier
    from public.matches m
    join public.trips   t on t.id = m.trip_id
    join public.parcels p on p.id = m.parcel_id
    where m.status = 'released'
      and t.traveler_id <> p.sender_id
  ),
  earner as (
    select 'earned'::text as kind, pr.full_name, r.traveler_id as user_id,
           sum(r.fee) as amount, count(*)::int as deliveries
    from real_deliveries r
    join public.profiles pr on pr.id = r.traveler_id
    group by pr.full_name, r.traveler_id
    order by amount desc
    limit 1
  ),
  saver as (
    select 'saved'::text as kind, pr.full_name, r.sender_id as user_id,
           sum(r.courier - r.fee) as amount, count(*)::int as deliveries
    from real_deliveries r
    join public.profiles pr on pr.id = r.sender_id
    group by pr.full_name, r.sender_id
    having sum(r.courier - r.fee) > 0
    order by amount desc
    limit 1
  )
  select * from earner
  union all
  select * from saver;
$$;

revoke all on function public.leaderboard() from public;
grant execute on function public.leaderboard() to anon, authenticated;
