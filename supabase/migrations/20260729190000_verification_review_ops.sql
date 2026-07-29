-- Manual review has to stop being a founder's daily chore. Two changes:
--
-- 1. verifications.decline_reason — why a check failed, in machine-readable
--    form, so the verify page can tell the difference between "we couldn't
--    read your document, try again" and "this ID is already verified on
--    another account, here's how to get back into it". Without it every
--    rejection reads the same and every rejected user emails support.
--
-- 2. public.admins — who may act on the review queue. Deliberately NOT a
--    column on profiles: profiles are world-readable (they power the /people
--    pages), and publishing the list of accounts with elevated rights is
--    free reconnaissance for anyone probing the platform. This table has RLS
--    on and no client policies at all, so only the service role and
--    security-definer functions can see it.

alter table public.verifications
  add column if not exists decline_reason text;

comment on column public.verifications.decline_reason is
  'Machine-readable failure cause, e.g. duplicate_account. Null unless status = rejected.';

create table if not exists public.admins (
  user_id    uuid primary key references public.profiles (id) on delete cascade,
  note       text,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;
-- No policies on purpose: clients get nothing, in either direction.
revoke all on public.admins from anon, authenticated;

-- The one thing a client legitimately needs to know is whether *it* is an
-- admin, so the nav can show the queue link. Security definer, and it only
-- ever answers about the caller.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- Seed the founder by email so a fresh environment isn't locked out of its
-- own queue. Keyed on auth.users because profiles has no email column.
insert into public.admins (user_id, note)
select id, 'founder'
from auth.users
where email = 'samuel.kimani.sikuku@gmail.com'
on conflict (user_id) do nothing;
