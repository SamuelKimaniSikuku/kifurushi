'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Plane, Calendar, Package, Star, Shield, CheckCircle, ArrowLeft, MessageCircle } from 'lucide-react';

export default function TripDetailPage() {
  const { id } = useParams();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchTrip = async () => {
      const { data } = await supabase
        .from('trips')
        .select(`*, profiles:user_id (full_name, avatar_url, subscription_tier, avg_rating, total_ratings, is_verified, city, country)`)
        .eq('id', id)
        .single();
      setTrip(data);
      setLoading(false);
    };
    fetchTrip();
  }, [id]);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kenya-green"></div></div>;
  if (!trip) return <div className="max-w-2xl mx-auto px-4 py-12 text-center"><h2 className="text-xl font-bold">Trip not found</h2><Link href="/trips" className="text-kenya-green hover:underline">Back to trips</Link></div>;

  const profile = trip.profiles;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/trips" className="text-gray-500 hover:text-kenya-green flex items-center gap-1 mb-6 text-sm">
        <ArrowLeft className="h-4 w-4" /> Back to trips
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main info */}
        <div className="lg:col-span-2">
          <div className="card p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="text-center">
                <p className="text-2xl font-bold">{trip.origin_city}</p>
                <p className="text-gray-500">{trip.origin_country}</p>
              </div>
              <div className="flex-1 flex items-center justify-center">
                <div className="border-t-2 border-dashed border-gray-300 flex-1"></div>
                <Plane className="h-6 w-6 text-kenya-green mx-3" />
                <div className="border-t-2 border-dashed border-gray-300 flex-1"></div>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{trip.destination_city}</p>
                <p className="text-gray-500">{trip.destination_country}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <Calendar className="h-5 w-5 text-gray-400 mx-auto mb-1" />
                <p className="text-sm text-gray-500">Departure</p>
                <p className="font-semibold">{new Date(trip.departure_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <Package className="h-5 w-5 text-gray-400 mx-auto mb-1" />
                <p className="text-sm text-gray-500">Capacity</p>
                <p className="font-semibold">{trip.available_weight_kg} kg</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-500">Price</p>
                <p className="text-2xl font-bold text-kenya-green">&euro;{trip.price_per_kg}</p>
                <p className="text-xs text-gray-500">per kg</p>
              </div>
            </div>

            {trip.notes && (
              <div>
                <h3 className="font-semibold mb-2">Notes</h3>
                <p className="text-gray-600">{trip.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Traveler info */}
        <div>
          <div className="card p-6 mb-4">
            <h3 className="font-semibold mb-4">Traveler</h3>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-kenya-green text-white flex items-center justify-center text-lg font-bold">
                {profile?.full_name?.charAt(0) || '?'}
              </div>
              <div>
                <p className="font-semibold flex items-center gap-1">
                  {profile?.full_name}
                  {profile?.subscription_tier === 'pro' && <span className="badge-pro">PRO</span>}
                  {profile?.subscription_tier === 'premium' && <span className="badge-premium">PREMIUM</span>}
                </p>
                {profile?.city && <p className="text-sm text-gray-500">{profile.city}, {profile.country}</p>}
              </div>
            </div>

            <div className="space-y-2 text-sm">
              {profile?.is_verified && (
                <div className="flex items-center gap-2 text-kenya-green">
                  <CheckCircle className="h-4 w-4" /> ID Verified
                </div>
              )}
              <div className="flex items-center gap-2 text-gray-600">
                <Star className="h-4 w-4 text-gold" /> {profile?.avg_rating?.toFixed(1) || 'N/A'} ({profile?.total_ratings || 0} reviews)
              </div>
            </div>
          </div>

          <button className="w-full btn-primary flex items-center justify-center gap-2">
            <MessageCircle className="h-4 w-4" /> Contact Traveler
          </button>
        </div>
      </div>
    </div>
  );
}
