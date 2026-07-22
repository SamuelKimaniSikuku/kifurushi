import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

// Kifurushi has ONE paid plan: Premium, billed weekly.
// Create a recurring weekly price of KES 150 in the Stripe Dashboard
// (Products → Add product → Price: KES 150, Recurring, Weekly)
// and put its price ID in STRIPE_PREMIUM_PRICE_ID.
export const PLANS = {
  premium: {
    name: 'Premium',
    priceId: process.env.STRIPE_PREMIUM_PRICE_ID,
    price: 150,
    currency: 'KES',
    interval: 'week',
    features: [
      'See contact details of every traveler & sender',
      'Connect directly on WhatsApp',
      'Priority placement for your listings',
      'Premium badge on your profile',
      'Cancel anytime — one week is enough for one parcel',
    ],
  },
};
