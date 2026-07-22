# Deploying Kifurushi to kifurushiapp.com

Follow these steps in order. Total time: ~30–40 minutes.

## 0. Rotate your leaked keys (do this first!)

The old `.env.example` on GitHub contained your real Supabase **service_role** key
and Stripe secret key. Anyone could have copied them.

1. Supabase → Settings → API → **Reset** the `service_role` key (and the anon key
   if you like, then use the new values below).
2. Stripe → Developers → API keys → roll the secret key.

## 1. Set up the database

1. In your Supabase project, open **SQL Editor**.
2. If you ran the OLD schema before: run `supabase/reset.sql` first (deletes old tables).
3. Run `supabase/schema.sql` (the new one in this repo). It matches the app code —
   the old schema used different column names and the app could not work with it.

## 2. Set up Stripe (weekly Premium)

1. Stripe Dashboard → **Products** → Add product:
   - Name: `Kifurushi Premium`
   - Price: **KES 150**, **Recurring**, billing period **Weekly**
2. Copy the price ID (starts with `price_`) → this is `STRIPE_PREMIUM_PRICE_ID`.
3. Developers → **Webhooks** → Add endpoint:
   - URL: `https://kifurushiapp.com/api/stripe/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.updated`,
     `customer.subscription.deleted`, `invoice.payment_failed`
4. Copy the signing secret (`whsec_...`) → this is `STRIPE_WEBHOOK_SECRET`.

Start in **test mode** first; switch to live keys when you're ready to charge real money.

## 3. Deploy on Vercel

1. Push this code to GitHub (see repo instructions).
2. [vercel.com](https://vercel.com) → sign up with your GitHub → **Add New Project**
   → import `SamuelKimaniSikuku/kifurushi`.
3. In **Environment Variables**, add every variable from `.env.example` with your
   real values (`NEXT_PUBLIC_APP_URL` = `https://kifurushiapp.com`).
4. Deploy. You'll get a working `kifurushi-xxx.vercel.app` URL — test everything there.

## 4. Connect the domain kifurushiapp.com

1. In the Vercel project → **Settings → Domains** → Add → `kifurushiapp.com`
   (also add `www.kifurushiapp.com`; Vercel will redirect it).
2. Vercel shows you DNS records. At your domain registrar (where you bought
   kifurushiapp.com), set:
   - **A record**: `@` → `76.76.21.21`
   - **CNAME record**: `www` → `cname.vercel-dns.com`
3. Wait for DNS to propagate (minutes to a few hours). Vercel issues the HTTPS
   certificate automatically.
4. Update the Stripe webhook URL to `https://kifurushiapp.com/api/stripe/webhook`
   if you created it with the vercel.app URL.

## 5. Test the full loop before announcing

- Post a parcel as a guest (logged out) — it should appear on /parcels.
- Sign up, post a trip.
- Click "Contact Traveler" as a free user → you should see the Premium upsell.
- Upgrade with Stripe test card `4242 4242 4242 4242` → contact should unlock.
- Check the dashboard shows your Premium badge.

## M-Pesa payments (manual, for now)

Stripe checkout takes cards. For members who prefer M-Pesa: they pay your Paybill,
then you activate them manually — Supabase → Table Editor → `profiles` → set their
`subscription_tier` to `premium`. Set a weekly reminder to downgrade expired ones,
or ask Claude to build proper M-Pesa (Daraja API) integration later.
