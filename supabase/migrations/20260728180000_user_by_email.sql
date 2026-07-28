-- Lookup used by the stripe-webhook edge function to attribute payment-link
-- purchases: a raw buy.stripe.com payment carries no user id, only the
-- payer's email, so the webhook resolves it to an auth user here.
-- Service-role only — auth emails must not be enumerable by clients.

create or replace function public.user_id_by_email(p_email text)
returns uuid
language sql
stable
security definer
set search_path = public, auth
as $$
  select id from auth.users where lower(email) = lower(p_email) limit 1;
$$;

revoke execute on function public.user_id_by_email(text) from public, anon, authenticated;
grant execute on function public.user_id_by_email(text) to service_role;
