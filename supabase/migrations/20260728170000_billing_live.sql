-- Billing goes live: Stripe Checkout (live keys) is now the only path to a
-- membership. The temporary beta self-enrolment window closes — these are
-- the two policies the v2 schema marked "drop before real billing goes
-- live". Existing beta rows stay valid until their current_period_end.

drop policy if exists "BETA ONLY - users self-enroll" on public.memberships;
drop policy if exists "BETA ONLY - users update their beta membership" on public.memberships;
