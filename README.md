# Kifurushi Global 📦

Africa's peer-to-peer parcel network — connecting senders and receivers between
**all 54 African countries** and **22 diaspora destinations** (Europe, North
America, the Gulf, Asia-Pacific) via verified travellers with spare luggage
space. Escrow-protected, ID-verified, delivery-code confirmed.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
```

The app starts in **demo mode**: listings, accounts and matches live in your
browser's localStorage (pre-seeded with sample trips and parcels), so you can
explore every flow with no backend.

## Pages

| Route | What |
|---|---|
| `/` | Landing — value prop, how it works, corridors, security |
| `/trips` | Browse travellers with spare space, filter by origin/destination |
| `/parcels` | Browse parcel requests (traveller side) |
| `/post/trip` | Publish a trip (auth required, zod-validated) |
| `/post/parcel` | Post a parcel request (auth required, zod-validated) |
| `/pricing` | One membership — $29/year covers sender, receiver and traveller; 0% commission |
| `/verify` | 3-step ID verification wizard (phone → ID → selfie) |
| `/dashboard` | Your deliveries: handover timeline, journey updates, reviews |
| `/auth` | Sign up / sign in (demo auth) |
| `/safety` | Trust & safety: protected handover, verification, inspect-and-seal, prohibited items |

## Business model

Subscription platform, not a marketplace middleman: **$29/year membership**
(one price for sending, receiving and travelling), free tier for browsing,
receiving and tracking. Carriage fees are agreed and paid directly between
sender and traveller — Kifurushi takes 0% commission and never holds delivery
money, which keeps it outside money-transmitter licensing. Protection comes
from ID verification, on-platform agreed terms, co-sealed photo logs, one-time
delivery codes and immutable reviews. (The escrow state machine in
`supabase/schema.sql` is kept dormant in case a "protected payment" premium
feature is added later.)

## Going to production

1. Create a Supabase project and run `supabase/schema.sql` — it ships full
   row-level security, an escrow state machine, and hashed delivery codes.
2. Replace the functions in `lib/store.ts` with Supabase queries (shapes match
   the SQL schema 1:1) and swap demo auth for Supabase Auth.
3. Read `SECURITY.md` for the full security architecture and the
   before-real-money checklist (licensed escrow provider, KYC, rate limiting).

## Stack

Next.js 14 (App Router) · TypeScript · Tailwind CSS · zod · Supabase-ready
