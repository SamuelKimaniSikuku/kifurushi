'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { PLANS } from '@/lib/stripe';
import { Crown, Check, Star, Shield, TrendingUp, Zap } from 'lucide-react';

export default function PremiumPage() {
  const [user, setUser] = useState(null);
  const [currentTier, setCurrentTier] = useState('free');
  const [loading, setLoading] = useState(null);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data } = await supabase.from('profiles').select('subscription_tier').eq('id', user.id).single();
        setCurrentTier(data?.subscription_tier || 'free');
      }
    };
    getUser();
  }, []);

  const handleSubscribe = async (plan) => {
    if (!user) {
      window.location.href = '/login?redirect=/premium';
      return;
    }

    setLoading(plan);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else alert(data.error || 'Something went wrong');
    } catch (err) {
      alert('Failed to start checkout');
    }
    setLoading(null);
  };

  const freeFeatures = [
    'Up to 3 trip postings/month',
    'Basic search & matching',
    'Community ratings',
    '5% escrow fee',
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 bg-accent/10 text-accent px-4 py-2 rounded-full text-sm font-semibold mb-4">
          <Crown className="h-4 w-4" /> Kifurushi Premium
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Earn More. Ship More. Pay Less.</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Upgrade to Premium and unlock unlimited trips, lower fees, and priority features
          that help you earn 3x more as a traveler.
        </p>
      </div>

      {/* Pricing cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-20">
        {/* Free */}
        <div className="card p-8">
          <h3 className="text-xl font-bold mb-1">Free</h3>
          <p className="text-gray-600 text-sm mb-4">Get started with basics</p>
          <div className="mb-6">
            <span className="text-4xl font-bold">&euro;0</span>
            <span className="text-gray-500">/month</span>
          </div>
          <ul className="space-y-3 mb-8">
            {freeFeatures.map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <Check className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
          {currentTier === 'free' ? (
            <button disabled className="w-full py-3 rounded-lg border-2 border-gray-200 text-gray-400 font-semibold">Current Plan</button>
          ) : (
            <button disabled className="w-full py-3 rounded-lg border-2 border-gray-200 text-gray-500 font-semibold">Free Tier</button>
          )}
        </div>

        {/* Premium */}
        <div className="card p-8 border-2 border-accent relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-white text-xs font-bold px-4 py-1 rounded-full">
            MOST POPULAR
          </div>
          <h3 className="text-xl font-bold mb-1">Premium</h3>
          <p className="text-gray-600 text-sm mb-4">For active community members</p>
          <div className="mb-6">
            <span className="text-4xl font-bold text-accent">&euro;{PLANS.premium.price}</span>
            <span className="text-gray-500">/month</span>
          </div>
          <ul className="space-y-3 mb-8">
            {PLANS.premium.features.map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <Check className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
          {currentTier === 'premium' ? (
            <button disabled className="w-full py-3 rounded-lg bg-accent/10 text-accent font-semibold">Current Plan</button>
          ) : (
            <button
              onClick={() => handleSubscribe('premium')}
              disabled={loading === 'premium'}
              className="w-full btn-secondary py-3 disabled:opacity-50"
            >
              {loading === 'premium' ? 'Processing...' : 'Get Premium'}
            </button>
          )}
        </div>

        {/* Pro */}
        <div className="card p-8 bg-gray-900 text-white">
          <h3 className="text-xl font-bold mb-1">Pro Carrier</h3>
          <p className="text-gray-400 text-sm mb-4">For power travelers</p>
          <div className="mb-6">
            <span className="text-4xl font-bold text-gold">&euro;{PLANS.pro.price}</span>
            <span className="text-gray-400">/month</span>
          </div>
          <ul className="space-y-3 mb-8">
            {PLANS.pro.features.map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <Check className="h-4 w-4 text-gold mt-0.5 flex-shrink-0" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
          {currentTier === 'pro' ? (
            <button disabled className="w-full py-3 rounded-lg bg-gold/20 text-gold font-semibold">Current Plan</button>
          ) : (
            <button
              onClick={() => handleSubscribe('pro')}
              disabled={loading === 'pro'}
              className="w-full bg-gold hover:bg-yellow-500 text-gray-900 py-3 rounded-lg font-bold disabled:opacity-50 transition-colors"
            >
              {loading === 'pro' ? 'Processing...' : 'Get Pro'}
            </button>
          )}
        </div>
      </div>

      {/* Benefits */}
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">Why Go Premium?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[
            { icon: TrendingUp, title: 'Earn 3x More', desc: 'Priority listings mean more parcel requests and higher earnings per trip.' },
            { icon: Shield, title: 'Trusted Badge', desc: 'Stand out with a verified Premium badge. Senders prefer trusted travelers.' },
            { icon: Zap, title: 'Lower Fees', desc: 'Premium pays 3% escrow fee vs 5%. Pro pays 0%. Keep more of what you earn.' },
            { icon: Star, title: 'Route Alerts', desc: 'Get notified instantly when someone needs a parcel sent on your route.' },
          ].map((b, i) => (
            <div key={i} className="flex gap-4">
              <div className="bg-accent/10 p-3 rounded-lg h-fit">
                <b.icon className="h-6 w-6 text-accent" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1">{b.title}</h3>
                <p className="text-gray-600">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
