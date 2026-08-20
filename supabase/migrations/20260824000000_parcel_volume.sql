-- The headline volume figure: total value of every parcel ever posted —
-- open, matched, delivered, cancelled, all of it. Samuel's choice of the
-- big-tent number, and honest under its label ("requested through
-- Kifurushi"): a posted parcel IS a delivery request at that value,
-- whatever happened to it afterwards. What it is NOT called is money
-- passing through Kifurushi — no money ever does, and the Terms depend
-- on that sentence staying true.
--
-- Security definer because RLS hides closed parcels from anonymous
-- visitors, and the homepage counter is anonymous.

create or replace function public.parcel_volume()
returns table (total numeric, parcels int)
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(sum(budget_usd), 0), count(*)::int
  from public.parcels;
$$;

revoke all on function public.parcel_volume() from public;
grant execute on function public.parcel_volume() to anon, authenticated;
