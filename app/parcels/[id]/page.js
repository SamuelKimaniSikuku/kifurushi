'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Package, MapPin, Weight, Clock, Star, CheckCircle, ArrowLeft, MessageCircle } from 'lucide-react';

export default function ParcelDetailPage() {
  const { id } = useParams();
  const [parcel, setParcel] = useState(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchParcel = async () => {
      const { data } = await supabase
        .from('parcels')
        .select(`*, profiles:sender_id (full_name, avatar_url, subscription_tier, avg_rating, total_ratings, is_verified, city, country)`)
        .eq('id', id)
        .single();
      setParcel(data);
      setLoading(false);
    };
    fetchParcel();
  }, [id]);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kenya-green"></div></div>;
  if (!parcel) return <div className="max-w-2xl mx-auto px-4 py-12 text-center"><h2 className="text-xl font-bold">Parcel not found</h2><Link href="/parcels" className="text-kenya-green hover:underline">Back to parcels</Link></div>;

  const profile = parcel.profiles;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/parcels" className="text-gray-500 hover:text-kenya-green flex items-center gap-1 mb-6 text-sm">
        <ArrowLeft className="h-4 w-4" /> Back to parcels
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="card p-8">
            <div className="flex items-start justify-between mb-4">
              <h1 className="text-2xl font-bold">{parcel.title}</h1>
              <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                parcel.status === 'open' ? 'bg-green-100 text-green-700' :
                parcel.status === 'matched' ? 'bg-blue-100 text-blue-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {parcel.status}
              </span>
            </div>

            <div className="flex items-center gap-2 text-gray-600 mb-6">
              <MapPin className="h-4 w-4" />
              <span className="font-medium">{parcel.origin_city}{parcel.origin_country ? `, ${parcel.origin_country}` : ''}</span>
              <span>&rarr;</span>
              <span className="font-medium">{parcel.destination_city}{parcel.destination_country ? `, ${parcel.destination_country}` : ''}</span>
            </div>

            {parcel.description && (
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-gray-600">{parcel.description}</p>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <Weight className="h-5 w-5 text-gray-400 mx-auto mb-1" />
                <p className="text-sm text-gray-500">Weight</p>
                <p className="font-semibold">{parcel.weight_kg} kg</p>
              </div>
              {parcel.budget && (
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-500">Budget</p>
                  <p className="text-2xl font-bold text-kenya-green">&euro;{parcel.budget}</p>
                </div>
              )}
              {parcel.deadline && (
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <Clock className="h-5 w-5 text-gray-400 mx-auto mb-1" />
                  <p className="text-sm text-gray-500">Deadline</p>
                  <p className="font-semibold">{new Date(parcel.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div>
          <div className="card p-6 mb-4">
            <h3 className="font-semibold mb-4">Sender</h3>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-accent text-white flex items-center justify-center text-lg font-bold">
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
                <div className="flex items-center gap-2 text-kenya-green"><CheckCircle className="h-4 w-4" /> ID Verified</div>
              )}
              <div className="flex items-center gap-2 text-gray-600">
                <Star className="h-4 w-4 text-gold" /> {profile?.avg_rating?.toFixed(1) || 'N/A'} ({profile?.total_ratings || 0} reviews)
              </div>
            </div>
          </div>

          {parcel.status === 'open' && (
            <button className="w-full btn-primary flex items-center justify-center gap-2">
              <MessageCircle className="h-4 w-4" /> Offer to Carry
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
