\set ON_ERROR_STOP on
-- Fresh disposable local database only. Email hooks are stubbed, never networked.
\ir trust-bootstrap.sql
alter table public.matches add column request_nudged_at timestamptz;
create function public.notify_new_listing() returns trigger language plpgsql as $$begin return new; end$$;
\ir ../../supabase/migrations/20261116091410_matching_follow_through.sql
