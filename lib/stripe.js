import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

// Price IDs for subscription tiers
export const PLANS = {
  premium: {
    name: 'Premium',
    priceId: process.env.STRIPE_PREMIUM_PRICE_ID,
    price: 4.99,
    features: [
      'Unlimited trip postings',
      'Trusted Traveler badge',
      'Priority listing in search',
      'Earnings dashboard & analytics',
      'Route alerts for parcel requests',
      'Verified profile photo & ID',
      '3% escrow fee (vs 5%)',
    ],
  },
  pro: {
    name: 'Pro Carrier',
    priceId: process.env.STRIPE_PRO_PRICE_ID,
    price: 12.99,
    features: [
      'Everything in Premium',
      'Pro Carrier diamond badge',
      '0% escrow fee',
      'Bulk parcel management tools',
      'Invoice & receipt generation',
      'Priority customer support',
    ],
  },
};

// Escrow fee rates by tier
export const ESCROW_RATES = {
  free: 0.05,     // 5%
  premium: 0.03,  // 3%
  pro: 0.00,      // 0%
};
