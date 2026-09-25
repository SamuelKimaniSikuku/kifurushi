-- Isolated PostgreSQL only. Supplies Supabase platform schemas and applies the
-- app's real baseline/state-machine migrations, without email/network hooks.
\set ON_ERROR_STOP on
begin;
do $$ begin
  if not exists(select 1 from pg_roles where rolname='anon') then create role anon nologin; end if;
  if not exists(select 1 from pg_roles where rolname='authenticated') then create role authenticated nologin; end if;
  if not exists(select 1 from pg_roles where rolname='service_role') then create role service_role nologin bypassrls; end if;
end $$;
create schema auth;
create schema extensions;
create schema storage;
create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
grant usage on schema auth,public,storage to anon,authenticated,service_role;
grant execute on function auth.uid() to anon,authenticated,service_role;
alter default privileges in schema public grant all on tables to anon,authenticated,service_role;
create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
create table storage.objects(id uuid default gen_random_uuid() primary key,bucket_id text references storage.buckets(id),name text,unique(bucket_id,name));
alter table storage.objects enable row level security;
grant select,insert,update,delete on storage.objects to authenticated;
create function storage.foldername(text) returns text[] language sql immutable as $$ select string_to_array($1,'/') $$;

\ir ../../supabase/migrations/20260728000000_v2_init.sql
\ir ../../supabase/migrations/20260729120000_parcel_multi_categories.sql
\ir ../../supabase/migrations/20260729160000_corridor_dates_capacity.sql
\ir ../../supabase/migrations/20260821000000_rerequest_after_decline.sql
\ir ../../supabase/migrations/20260822000000_deliver_now.sql
\ir ../../supabase/migrations/20260827000000_sender_confirm_delivery.sql
\ir ../../supabase/migrations/20260828000000_sender_confirm_from_accepted.sql

-- No live emails, storage files, billing, identities or incident webhooks.
create table public.incidents(id uuid default gen_random_uuid(),kind text,severity text,source text,summary text,detail jsonb,user_id uuid);
create or replace function public.is_active_member(uid uuid) returns boolean language sql stable as $$ select auth.uid() is not null $$;
\ir ../../supabase/migrations/20260925092621_parcel_declarations_and_inspections.sql
\ir ../../supabase/migrations/20260925094456_optional_parcel_photos.sql

create schema test;
grant usage on schema test to anon,authenticated;
create function test.ok(condition boolean,label text) returns void language plpgsql as $$
begin if condition is distinct from true then raise exception 'FAIL: %',label; end if; raise notice 'PASS: %',label; end $$;
create function test.denied(statement text,expected text,label text) returns void language plpgsql as $$
declare rejected boolean := false;
begin
  begin execute statement; exception when others then
    if position(expected in sqlerrm)=0 then raise exception 'FAIL: %; unexpected error: %',label,sqlerrm; end if;
    rejected := true;
  end;
  perform test.ok(rejected,label);
end $$;
grant execute on all functions in schema test to anon,authenticated;
commit;
