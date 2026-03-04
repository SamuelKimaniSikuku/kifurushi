'use client';

import { useState } from 'react';
import { Crown, Check, TrendingUp, Shield, Zap, Star } from 'lucide-react';

const PLANS = {
  premium: { price: 4.99, features: ['Unlimited trip postings', 'Priority in search results', '3% escrow fee (vs 5%)', 'Premium trust badge', 'Route alerts'] },
  pro: { price: 12.99, features: ['Everything in Premium', '0% escrow fee', 'Pro Diamond badge', 'Bulk parcel tools', 'Priority support', 'Analytics dashboard'] },
};

export default function PremiumPage() {
  const [currentTier] = useState('free');

  const handleSubscribe = () => {
    window.location.href = 'https://buy.stripe.com/test_aFa4gzdx0bWUdAl4rVdwc00';
  };

  const freeFeatures = ['Up to 3 trip postings/month', 'Basic search and matching', 'Community ratings', '5% escrow fee'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Earn More. Ship More. Pay Less.</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">Upgrade to Premium and unlock unlimited trips, lower fees, and priority features.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-20">
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-8">
          <h3 className="text-xl font-bold mb-1">Free</h3>
          <p className="text-gray-600 text-sm mb-4">Get started with basics</p>
          <div className="mb-6"><span className="text-4xl font-bold">&#8364;0</span><span className="text-gray-500">/month</span></div>
          <ul className="space-y-3 mb-8">{freeFeatures.map(function(f, i) { return (<li key={i} className="flex items-start gap-2 text-sm"><Check className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" /><span>{f}</span></li>); })}</ul>
          <button disabled className="w-full py-3 rounded-lg border-2 border-gray-200 text-gray-400 font-semibold">Current Plan</button>
        </div>
        <div className="bg-white rounded-xl shadow-md border-2 border-orange-500 p-8 relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-xs font-bold px-4 py-1 rounded-full">MOST POPULAR</div>
          <h3 className="text-xl font-bold mb-1">Premium</h3>
          <p className="text-gray-600 text-sm mb-4">For active community members</p>
          <div className="mb-6"><span className="text-4xl font-bold text-orange-500">&#8364;{PLANS.premium.price}</span><span className="text-gray-500">/month</span></div>
          <ul className="space-y-3 mb-8">{PLANS.premium.features.map(function(f, i) { return (<li key={i} className="flex items-start gap-2 text-sm"><Check className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" /><span>{f}</span></li>); })}</ul>
          <button onClick={handleSubscribe} className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-bold">Get Premium</button>
        </div>
        <div className="bg-gray-900 rounded-xl shadow-md p-8 text-white">
          <h3 className="text-xl font-bold mb-1">Pro Carrier</h3>
          <p className="text-gray-400 text-sm mb-4">For power travelers</p>
          <div className="mb-6"><span className="text-4xl font-bold text-yellow-400">&#8364;{PLANS.pro.price}</span><span className="text-gray-400">/month</span></div>
          <ul className="space-y-3 mb-8">{PLANS.pro.features.map(function(f, i) { return (<li key={i} className="flex items-start gap-2 text-sm"><Check className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" /><span>{f}</span></li>); })}</ul>
          <button onClick={handleSubscribe} className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 py-3 rounded-lg font-bold">Get Pro</button>
        </div>
      </div>
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">Why Go Premium?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="flex gap-4"><div className="bg-orange-50 p-3 rounded-lg h-fit"><TrendingUp className="h-6 w-6 text-orange-500" /></div><div><h3 className="font-bold text-lg mb-1">Earn 3x More</h3><p className="text-gray-600">Priority listings mean more parcel requests and higher earnings per trip.</p></div></div>
          <div className="flex gap-4"><div className="bg-orange-50 p-3 rounded-lg h-fit"><Shield className="h-6 w-6 text-orange-500" /></div><div><h3 className="font-bold text-lg mb-1">Trusted Badge</h3><p className="text-gray-600">Stand out with a verified Premium badge. Senders prefer trusted travelers.</p></div></div>
          <div className="flex gap-4"><div className="bg-orange-50 p-3 rounded-lg h-fit"><Zap className="h-6 w-6 text-orange-500" /></div><div><h3 className="font-bold text-lg mb-1">Lower Fees</h3><p className="text-gray-600">Premium pays 3% escrow fee vs 5%. Pro pays 0%. Keep more of what you earn.</p></div></div>
          <div className="flex gap-4"><div className="bg-orange-50 p-3 rounded-lg h-fit"><Star className="h-6 w-6 text-orange-500" /></div><div><h3 className="font-bold text-lg mb-1">Route Alerts</h3><p className="text-gray-600">Get notified instantly when someone needs a parcel sent on your route.</p></div></div>
        </div>
      </div>
    </div>
  );
}
