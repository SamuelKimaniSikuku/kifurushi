-- Store each member's language so server-sent emails (delivery
-- confirmations, payment confirmations) match the language they use on the
-- site. The client keeps it in sync with the language switcher; column-level
-- grant mirrors the full_name pattern (profiles table update is revoked,
-- safe columns granted back).

alter table public.profiles add column lang text not null default 'en'
  check (lang in ('en', 'fr', 'sw'));

grant update (lang) on public.profiles to authenticated;
