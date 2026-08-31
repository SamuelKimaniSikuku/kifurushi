-- Notice-then-auto-complete for stalled deliveries.
--
-- Grace's Nairobi → Paris match (cf7b85bc) has sat at picked_up since 12 Aug
-- though the trip flew on 21 Aug. She has been emailed: one click confirms
-- it herself, and if we hear nothing within 24 hours it completes
-- automatically. This migration makes that automatic path possible and
-- schedules the one-shot job.
--
-- 'auto' is deliberately weaker than 'code' or 'sender': it means "notice
-- was given and nobody objected", not "a party confirmed arrival". So an
-- auto-released delivery completes in the app (reviews unlock, dashboards
-- close out) but is EXCLUDED from the leaderboard — social proof stays
-- strictly things a real person confirmed.

alter table public.matches drop constraint if exists matches_released_via_check;
alter table public.matches add constraint matches_released_via_check
  check (released_via in ('code', 'sender', 'auto'));

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
      and coalesce(m.released_via, 'code') <> 'auto'
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

-- One-shot: 1 Sep 2026 13:30 UTC, ~24h after the notice email. If either
-- party has already moved the match to released (or it was cancelled or
-- disputed), the update matches nothing and only the job cleans itself up.
-- If Grace reports a problem to hello@ before then, cancel manually with:
--   select cron.unschedule('auto-release-cf7b85bc');
select cron.schedule(
  'auto-release-cf7b85bc',
  '30 13 1 9 *',
  $job$
  do $fn$
  declare n int;
  begin
    update public.matches
       set status = 'released', released_via = 'auto'
     where id = 'cf7b85bc-5c91-447b-987a-2e690a0ebf1e'
       and status in ('picked_up', 'in_transit', 'delivered');
    get diagnostics n = row_count;
    if n > 0 then
      insert into public.incidents (kind, severity, summary, detail)
      values ('auto_release', 'normal',
              'Auto-completed Nairobi → Paris delivery cf7b85bc after 24h notice to the sender',
              jsonb_build_object('match_id', 'cf7b85bc-5c91-447b-987a-2e690a0ebf1e',
                                 'released_via', 'auto'));
    end if;
    perform cron.unschedule('auto-release-cf7b85bc');
  end
  $fn$;
  $job$
);
