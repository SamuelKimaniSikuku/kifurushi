-- Didit KYC goes live.
--
-- Verification rows are now created by the didit-session edge function
-- (service role) when it opens a hosted Didit session, and resolved by the
-- didit-webhook function when Didit's decision arrives. Clients therefore
-- lose their direct INSERT path — the function is the only door, so a row
-- always corresponds to a real provider session.

drop policy if exists "users start their own verification" on public.verifications;
revoke insert on public.verifications from authenticated;
