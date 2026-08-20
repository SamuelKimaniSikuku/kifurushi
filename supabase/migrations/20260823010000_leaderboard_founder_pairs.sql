-- The first live check of leaderboard() surfaced Sam Kim earning $17 from
-- Samuel Kimani Sikuku — the founder's two accounts trading with each other
-- during testing. Different user ids, same person: traveler <> sender can't
-- see it. A launch leaderboard headlined by the founder paying himself is
-- precisely the fake social proof this feature must never show.
--
-- So: a delivery where BOTH parties are founder accounts doesn't count.
-- Deliberately narrow — Samuel genuinely carrying for a real member, or a
-- real member carrying for him, still counts, because it's real.

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
  with founders as (
    select array[
      '15f38392-9abe-477a-af69-88dce0392abf'::uuid,  -- Samuel Kimani Sikuku
      'e07dbb62-5668-47ec-9c37-447dd6fff7d8'::uuid   -- Sam Kim (test account)
    ] as ids
  ),
  real_deliveries as (
    select
      t.traveler_id,
      p.sender_id,
      coalesce(p.budget_usd, 0)      as fee,
      coalesce(p.weight_kg, 0) * 14  as courier
    from public.matches m
    join public.trips   t on t.id = m.trip_id
    join public.parcels p on p.id = m.parcel_id
    cross join founders f
    where m.status = 'released'
      and t.traveler_id <> p.sender_id
      and not (t.traveler_id = any(f.ids) and p.sender_id = any(f.ids))
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
