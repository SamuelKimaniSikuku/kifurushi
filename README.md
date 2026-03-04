# Kifurushi - Peer-to-Peer Parcel Delivery Platform

Connecting the Kenyan diaspora in Europe through trusted peer-to-peer parcel delivery. Save up to 70% on shipping costs by matching travelers with people who need parcels delivered.

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL + Auth + Row Level Security)
- **Payments**: Stripe (Subscriptions + Customer Portal)
- **Icons**: Lucide React

## Features

- **Trip Postings** - Travelers post upcoming trips with available capacity
- **Parcel Requests** - Senders post parcels they need delivered
- **Search & Filter** - Find trips/parcels by route, date, weight
- **User Profiles** - Ratings, verification, trust badges
- **Escrow Payments** - Secure payment held until delivery confirmed
- **Premium Subscriptions** - 3 tiers (Free, Premium €4.99/mo, Pro €12.99/mo)
- **Stripe Integration** - Checkout, webhooks, customer portal

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/kifurushi.git
cd kifurushi
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the contents of `supabase/schema.sql`
3. Enable Google OAuth in Authentication > Providers (optional)
4. Copy your project URL and anon key

### 3. Set up Stripe

1. Create an account at [stripe.com](https://stripe.com)
2. Create two subscription products:
   - **Premium** - €4.99/month recurring
   - **Pro Carrier** - €12.99/month recurring
3. Copy the Price IDs for each product
4. Set up a webhook endpoint pointing to `YOUR_URL/api/stripe/webhook`
5. Subscribe to these webhook events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
6. Copy your webhook signing secret

### 4. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in all the values in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_PREMIUM_PRICE_ID=price_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
kifurushi/
├── app/
│   ├── api/
│   │   ├── auth/callback/     # Supabase OAuth callback
│   │   ├── stripe/
│   │   │   ├── checkout/      # Create Stripe checkout session
│   │   │   ├── webhook/       # Handle Stripe webhook events
│   │   │   └── portal/        # Stripe customer portal
│   │   ├── trips/             # CRUD for trips
│   │   └── parcels/           # CRUD for parcels
│   ├── dashboard/             # User dashboard
│   ├── login/                 # Authentication page
│   ├── premium/               # Subscription plans page
│   ├── trips/                 # Browse & create trips
│   │   ├── [id]/              # Trip detail page
│   │   └── new/               # Create new trip
│   ├── parcels/               # Browse & create parcels
│   │   ├── [id]/              # Parcel detail page
│   │   └── new/               # Create new parcel request
│   ├── layout.js              # Root layout with navbar & footer
│   ├── page.js                # Landing page
│   └── globals.css            # Tailwind styles
├── components/
│   └── Navbar.js              # Navigation bar
├── lib/
│   ├── stripe.js              # Stripe config, plans, escrow rates
│   ├── supabase.js            # Browser Supabase client
│   └── supabase-server.js     # Server Supabase client + admin
├── supabase/
│   └── schema.sql             # Full database schema with RLS
├── middleware.js               # Auth middleware for protected routes
└── .env.example               # Environment variable template
```

## Subscription Tiers

| Feature | Free | Premium (€4.99/mo) | Pro (€12.99/mo) |
|---|---|---|---|
| Trip postings | 3/month | Unlimited | Unlimited |
| Escrow fee | 5% | 3% | 0% |
| Trust badge | - | Premium | Pro Diamond |
| Priority listing | - | Yes | Yes |
| Route alerts | - | Yes | Yes |
| Analytics dashboard | - | Yes | Yes |
| Bulk tools | - | - | Yes |
| Priority support | - | - | Yes |

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in [vercel.com](https://vercel.com)
3. Add all environment variables
4. Deploy

Update your Stripe webhook URL to `https://your-domain.vercel.app/api/stripe/webhook`

## License

MIT
