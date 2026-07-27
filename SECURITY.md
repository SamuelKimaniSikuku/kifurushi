# Kifurushi — Security architecture

The app ships in **demo mode** (all data in the browser's localStorage, no
backend) so it can be explored instantly. This document describes both what is
already enforced in the code and what turns on when you connect Supabase.

## Enforced now, in this codebase

| Layer | What | Where |
|---|---|---|
| HTTP headers | HSTS, CSP, `X-Frame-Options: DENY`, `nosniff`, referrer & permissions policies, `poweredByHeader` off | `next.config.mjs` |
| Input validation | Every form validated with zod: country allow-lists, city/name character allow-lists (Unicode letters only), length caps, numeric ranges, future-date checks, origin ≠ destination | `lib/validation.ts` |
| Password policy | ≥10 chars, upper + lower + digit (demo mode never stores the password at all) | `lib/validation.ts` |
| Open-redirect guard | `?next=` redirect only followed if it starts with `/` | `app/auth/page.tsx` |
| XSS | No `dangerouslySetInnerHTML` anywhere; all user content rendered as React text nodes; CSP blocks external scripts | everywhere |

## Turns on with Supabase (`supabase/schema.sql`)

- **Row-level security on every table.** Users can read public listings but can
  only insert/update/delete their own rows. Matches and messages are visible
  only to the two parties involved.
- **Escrow state machine in the database.** Clients have *no* UPDATE policy on
  `matches`; every status transition goes through a `security definer`
  function that checks who is allowed to make it. The delivery code is stored
  only as a bcrypt hash — releasing escrow requires the receiver's plaintext
  code to match.
- **Reputation fields are server-owned.** `id_verified`, `rating` and
  `deliveries_completed` have column-level UPDATE revoked from users.
- **Auth**: Supabase Auth with email verification; short-lived JWTs.

## Production checklist (before real money moves)

1. Payments/escrow via a licensed provider (Stripe Connect, Flutterwave,
   Paystack) — never hold funds directly without a licence.
2. KYC/ID verification provider (Smile ID covers 54 African countries).
3. Rate limiting at the edge (Vercel WAF / Cloudflare) on auth and posting.
4. Tighten CSP by replacing `unsafe-inline`/`unsafe-eval` with nonces once the
   bundle is audited.
5. Legal review per corridor: customs declarations, prohibited-items law, and
   carrier liability differ by country.
