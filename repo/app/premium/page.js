'use client';
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Crown, Check, X, MessageCircle } from 'lucide-react';

const FREE_FEATURES = [
  { text: 'Browse all trips & parcel requests', included: true },
  { text: 'Post parcel requests (no account needed)', included: true },
  { text: 'Post trips as a traveler', included: true },
  { text: 'Community WhatsApp group', included: true },
  { text: 'Contact details of matches', included: false },
  { text: 'Priority placement', included: false },
];

const PREMIUM_FEATURES = [
  { text: 'Everything in Free', included: true },
  { text: 'See contact details of every traveler & sender', included: true },
  { text: 'Connect directly on WhatsApp', included: true },
  { text: 'Priority placement for your listings', included: true },
  { text: 'Premium badge on your profile', included: true },
  { text: 'Cancel anytime — one week covers one parcel', included: true },
];

export default function PremiumPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleUpgrade = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'premium' }),
      });
      const data = await res.json();
      if (res.status === 401) {
        router.push('/login?redirect=/premium');
        return;
      }
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || 'Could not start checkout — please try again.');
      }
    } catch {
      setError('Network error — please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <div className="bg-amber-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <Crown className="h-8 w-8 text-amber-500" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-4">Kifurushi Premium</h1>
        <p className="text-lg text-gray-600 max-w-xl mx-auto">
          Browsing is always free. Premium unlocks the contact details of every
          traveler and sender, so you connect directly — for about the price of a chapati.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        {/* Free */}
        <div className="card p-8">
          <h3 className="text-xl font-bold mb-1">Free</h3>
          <div className="mb-6">
            <span className="text-4xl font-extrabold">KES 0</span>
            <span className="text-gray-500"> / forever</span>
          </div>
          <ul className="space-y-3 mb-8">
            {FREE_FEATURES.map((f, i) => (
              <li key={i} className={`flex items-start gap-2 text-sm ${f.included ? 'text-gray-700' : 'text-gray-400'}`}>
                {f.included
                  ? <Check className="h-4 w-4 text-kenya-green mt-0.5 flex-shrink-0" />
                  : <X className="h-4 w-4 text-gray-300 mt-0.5 flex-shrink-0" />}
                {f.text}
              </li>
            ))}
          </ul>
          <Link href="/trips" className="block text-center border-2 border-kenya-green text-kenya-green rounded-lg py-3 font-semibold hover:bg-green-50 transition-colors">
            Start browsing
          </Link>
        </div>

        {/* Premium */}
        <div className="card p-8 border-2 border-kenya-green shadow-lg relative">
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-kenya-green text-white text-xs font-bold px-4 py-1 rounded-full">
            MOST POPULAR
          </span>
          <h3 className="text-xl font-bold mb-1 flex items-center gap-2">
            Premium <Crown className="h-5 w-5 text-amber-500" />
          </h3>
          <div className="mb-6">
            <span className="text-4xl font-extrabold text-kenya-green">KES 150</span>
            <span className="text-gray-500"> / week &nbsp;·&nbsp; ≈ €1</span>
          </div>
          <ul className="space-y-3 mb-8">
            {PREMIUM_FEATURES.map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <Check className="h-4 w-4 text-kenya-green mt-0.5 flex-shrink-0" />
                {f.text}
              </li>
            ))}
          </ul>
          <button onClick={handleUpgrade} disabled={loading}
            className="w-full btn-primary py-3 disabled:opacity-60">
            {loading ? 'Opening secure checkout…' : 'Go Premium — KES 150/week'}
          </button>
          {error && <p className="text-red-600 text-sm bg-red-50 p-3 rounded-lg mt-3">{error}</p>}
          <p className="text-xs text-gray-500 text-center mt-3">
            Secure card payment via Stripe. Cancel anytime from your dashboard.
          </p>
        </div>
      </div>

      <div className="text-center mt-10 text-sm text-gray-600 flex items-center justify-center gap-1">
        <MessageCircle className="h-4 w-4" />
        Prefer M-Pesa? Message us in the community WhatsApp group and we&apos;ll activate you manually.
      </div>
    </div>
  );
}
