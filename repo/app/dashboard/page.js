'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Package, Plane, Crown, Star, Settings, Plus, CheckCircle } from 'lucide-react';

export default function DashboardPage() {
  const [profile, setProfile] = useState(null);
  const [myTrips, setMyTrips] = useState([]);
  const [myParcels, setMyParcels] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const subscriptionSuccess = searchParams.get('subscription') === 'success';
  const supabase = createClient();

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }

    const [profileRes, tripsRes, parcelsRes, bookingsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('trips').select('*').eq('user_id', user.id).order('departure_date', { ascending: true }).limit(5),
      supabase.from('parcels').select('*').eq('sender_id', user.id).order('created_at', { ascending: false }).limit(5),
      supabase.from('bookings').select('*, trips(*), parcels(*)').or(`traveler_id.eq.${user.id},sender_id.eq.${user.id}`).order('created_at', { ascending: false }).limit(10),
    ]);

    setProfile(profileRes.data);
    setMyTrips(tripsRes.data || []);
    setMyParcels(parcelsRes.data || []);
    setMyBookings(bookingsRes.data || []);
    setLoading(false);
  };

  const handleManageSubscription = async () => {
    const res = await fetch('/api/stripe/portal', { method: 'POST' });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kenya-green"></div></div>;
  }

  const tierLabel = profile?.subscription_tier === 'pro' ? 'Pro Carrier' : profile?.subscription_tier === 'premium' ? 'Premium' : 'Free';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {subscriptionSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-green-800">Welcome to Kifurushi {tierLabel}!</p>
            <p className="text-green-700 text-sm">Your subscription is now active. Enjoy your premium features.</p>
          </div>
        </div>
      )}

      {/* Profile header */}
      <div className="card p-6 mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-kenya-green text-white flex items-center justify-center text-2xl font-bold">
              {profile?.full_name?.charAt(0) || '?'}
            </div>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                {profile?.full_name || 'User'}
                {profile?.subscription_tier === 'pro' && <span className="badge-pro">PRO</span>}
                {profile?.subscription_tier === 'premium' && <span className="badge-premium">PREMIUM</span>}
              </h1>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                {profile?.is_verified && <span className="text-kenya-green flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Verified</span>}
                <span className="flex items-center gap-1"><Star className="h-3 w-3 text-gold" /> {profile?.avg_rating?.toFixed(1) || 'N/A'} ({profile?.total_ratings || 0} ratings)</span>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            {profile?.subscription_tier !== 'free' ? (
              <button onClick={handleManageSubscription} className="btn-outline text-sm py-2 px-4 flex items-center gap-1">
                <Settings className="h-4 w-4" /> Manage Subscription
              </button>
            ) : (
              <Link href="/premium" className="btn-secondary text-sm py-2 px-4 flex items-center gap-1">
                <Crown className="h-4 w-4" /> Upgrade to Premium
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <Link href="/trips/new" className="card p-6 hover:shadow-lg transition-shadow flex items-center gap-4">
          <div className="bg-green-50 p-3 rounded-lg"><Plane className="h-6 w-6 text-kenya-green" /></div>
          <div>
            <h3 className="font-semibold">Post a Trip</h3>
            <p className="text-sm text-gray-600">Traveling soon? Earn money carrying parcels.</p>
          </div>
          <Plus className="h-5 w-5 text-gray-400 ml-auto" />
        </Link>
        <Link href="/parcels/new" className="card p-6 hover:shadow-lg transition-shadow flex items-center gap-4">
          <div className="bg-orange-50 p-3 rounded-lg"><Package className="h-6 w-6 text-accent" /></div>
          <div>
            <h3 className="font-semibold">Send a Parcel</h3>
            <p className="text-sm text-gray-600">Need something delivered? Post a request.</p>
          </div>
          <Plus className="h-5 w-5 text-gray-400 ml-auto" />
        </Link>
      </div>

      {/* My trips & parcels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">My Trips</h2>
            <Link href="/trips" className="text-kenya-green text-sm hover:underline">View All</Link>
          </div>
          {myTrips.length === 0 ? (
            <div className="card p-8 text-center text-gray-500">
              <Plane className="h-10 w-10 mx-auto mb-2 text-gray-300" />
              <p>No trips posted yet.</p>
              <Link href="/trips/new" className="text-kenya-green text-sm hover:underline">Post your first trip</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {myTrips.map(trip => (
                <div key={trip.id} className="card p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{trip.origin_city} &rarr; {trip.destination_city}</p>
                      <p className="text-sm text-gray-600">{new Date(trip.departure_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-kenya-green">&euro;{trip.price_per_kg}/kg</p>
                      <p className="text-xs text-gray-500">{trip.available_weight_kg}kg available</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">My Parcels</h2>
            <Link href="/parcels" className="text-kenya-green text-sm hover:underline">View All</Link>
          </div>
          {myParcels.length === 0 ? (
            <div className="card p-8 text-center text-gray-500">
              <Package className="h-10 w-10 mx-auto mb-2 text-gray-300" />
              <p>No parcel requests yet.</p>
              <Link href="/parcels/new" className="text-kenya-green text-sm hover:underline">Post your first request</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {myParcels.map(parcel => (
                <div key={parcel.id} className="card p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{parcel.title}</p>
                      <p className="text-sm text-gray-600">{parcel.origin_city} &rarr; {parcel.destination_city}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      parcel.status === 'open' ? 'bg-green-100 text-green-700' :
                      parcel.status === 'matched' ? 'bg-blue-100 text-blue-700' :
                      parcel.status === 'delivered' ? 'bg-gray-100 text-gray-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {parcel.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
