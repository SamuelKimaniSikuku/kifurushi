-- Fresh disposable local database only. Never run this on production.
\ir bootstrap.sql
\set ON_ERROR_STOP on
create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;
alter extension pgcrypto set schema extensions;
alter table auth.users add column phone text, add column phone_confirmed_at timestamptz;
\ir ../../supabase/migrations/20260728150000_didit_verification.sql
\ir ../../supabase/migrations/20260729180000_verification_in_review.sql
\ir ../../supabase/migrations/20260729190000_verification_review_ops.sql
\ir ../../supabase/migrations/20260916010000_whatsapp_contact.sql
\ir ../../supabase/migrations/20261016114440_trust_and_delivery_reports.sql
