-- Opt-in WhatsApp contact, revealed only after acceptance.
--
-- Profiles are publicly readable by design (listing cards, /people pages),
-- so a phone number can never live there. It gets its own owner-only table,
-- and the one legitimate reader — the matched counterparty, once a match is
-- accepted — goes through a security-definer function that checks both the
-- relationship and the status. Off by default: no row, no number, nothing
-- to leak.

create table public.contact_details (
  user_id       uuid primary key references public.profiles (id) on delete cascade,
  whatsapp_e164 text not null check (whatsapp_e164 ~ '^\+[1-9][0-9]{6,14}$'),
  updated_at    timestamptz not null default now()
);

create trigger contact_details_set_updated_at
  before update on public.contact_details
  for each row execute function extensions.moddatetime (updated_at);

alter table public.contact_details enable row level security;

-- The owner manages their own number; nobody else touches the table
-- directly. Counterparties read via the RPC below, never the table.
create policy "own contact details only"
  on public.contact_details for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- After acceptance the two parties genuinely need real contact — they meet
-- in person for the handover. Before acceptance (and after a decline or
-- cancellation) there is no such need, so nothing is returned.
create or replace function public.match_contact(p_match_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select cd.whatsapp_e164
  from public.matches m
  join public.trips t on t.id = m.trip_id
  join public.parcels p on p.id = m.parcel_id
  join public.contact_details cd on cd.user_id =
    case
      when t.traveler_id = auth.uid() then p.sender_id
      when p.sender_id = auth.uid() then t.traveler_id
    end
  where m.id = p_match_id
    and auth.uid() in (t.traveler_id, p.sender_id)
    and m.status in
      ('accepted', 'escrow_paid', 'picked_up', 'in_transit', 'delivered', 'released');
$$;

revoke execute on function public.match_contact(uuid) from public, anon;
grant execute on function public.match_contact(uuid) to authenticated;
