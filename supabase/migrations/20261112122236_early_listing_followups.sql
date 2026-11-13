-- One early follow-up after 48 hours without a confirmed booking.
-- Keep the existing near-date and expiry markers: they must not be reset.
alter table public.parcels
  add column if not exists nudged_early_at timestamptz;

alter table public.trips
  add column if not exists nudged_early_at timestamptz;

comment on column public.parcels.nudged_early_at is
  'When the one-time early unmatched-listing email was accepted by the email provider.';
comment on column public.trips.nudged_early_at is
  'When the one-time early unmatched-listing email was accepted by the email provider.';
