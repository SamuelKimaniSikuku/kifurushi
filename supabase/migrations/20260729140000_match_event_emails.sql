-- Notify members of every meaningful match event, not just the final
-- release. Without this, a request/offer sat unseen until someone happened
-- to open their dashboard.
--
-- Two triggers, both firing the match-emails edge function through pg_net:
--   * matches: on INSERT (a request/offer arrives) and on every status change
--   * messages: on INSERT, throttled to one nudge per quiet conversation
--     (no email if the thread already had traffic in the last 10 minutes)

create or replace function public.notify_match_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event text;
begin
  if TG_OP = 'INSERT' then
    v_event := 'requested';
  elsif new.status is distinct from old.status then
    v_event := new.status;
  else
    return new;
  end if;

  perform net.http_post(
    url := 'https://bltaaidjhpkmwnsprenu.supabase.co/functions/v1/match-emails',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-hook-secret', 'khook_4f2bb1de88c94ab5a7e31c60d2f9a8e7'
    ),
    body := jsonb_build_object('match_id', new.id, 'event', v_event)
  );
  return new;
end;
$$;

create or replace function public.notify_new_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Only nudge when the conversation was quiet; live back-and-forth chat
  -- should not generate an email per line.
  if exists (
    select 1 from messages m
    where m.match_id = new.match_id
      and m.id <> new.id
      and m.created_at > now() - interval '10 minutes'
  ) then
    return new;
  end if;

  perform net.http_post(
    url := 'https://bltaaidjhpkmwnsprenu.supabase.co/functions/v1/match-emails',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-hook-secret', 'khook_4f2bb1de88c94ab5a7e31c60d2f9a8e7'
    ),
    body := jsonb_build_object(
      'match_id', new.match_id,
      'event', 'message',
      'actor', new.sender_id
    )
  );
  return new;
end;
$$;

-- Replace the release-only trigger with the general one.
drop trigger if exists matches_notify_released on public.matches;
drop function if exists public.notify_match_released();

drop trigger if exists matches_notify_event on public.matches;
create trigger matches_notify_event
  after insert or update on public.matches
  for each row execute function public.notify_match_event();

drop trigger if exists messages_notify on public.messages;
create trigger messages_notify
  after insert on public.messages
  for each row execute function public.notify_new_message();
