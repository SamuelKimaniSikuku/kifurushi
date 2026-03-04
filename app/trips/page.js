'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plane, Search, MapPin, Calendar, Star, Shield, Crown, Filter } from 'lucide-react';

export default function TripsPage() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [total, setTotal] = useState(0);

  useEffect(() => { fetchTrips(); }, []);

  const fetchTrips = async (searchFrom, searchTo) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (searchFrom || from) params.set('from', searchFrom || from);
    if (searchTo || to) params.set('to', searchTo || to);

    const res = await fetch(`/api/trips?${params.toString()}`);
    const data = await res.json();
    setTrips(data.trips || []);
    setTotal(data.total || 0);
    setLoading(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchTrips();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Available Trips</h1>
          <p className="text-gray-600">Find travelers heading your way</p>
        </div>
        <Link href="/trips/new" className="btn-primary flex items-center gap-2">
          <Plane className="h-4 w-4" /> Post a Trip
        </Link>
      </div>

      {/* Search filters */}
      <form onSubmit={handleSearch} className="card p-4 mb-8">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="From (city or country)"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kenya-green focus:border-transparent"
            />
          </div>
          <div className="flex-1 relative">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="To (city or country)"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kenya-green focus:border-transparent"
            />
          </div>
          <button type="submit" className="btn-primary flex items-center gap-2 py-2.5">
            <Search className="h-4 w-4" /> Search
          </button>
        </div>
      </form>

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-kenya-green"></div></div>
      ) : trips.length === 0 ? (
        <div className="card p-12 text-center">
          <Plane className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-500">No trips found</h3>
          <p className="text-gray-400 mb-4">Try adjusting your search or check back later.</p>
          <Link href="/trips/new" className="text-kenya-green hover:underline">Post your own trip</Link>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-4">{total} trip{total !== 1 ? 's' : ''} found</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map(trip => (
              <Link key={trip.id} href={`/trips/${trip.id}`} className="card hover:shadow-lg transition-shadow">
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-bold text-lg">{trip.origin_city}</p>
                      <p className="text-sm text-gray-500">{trip.origin_country}</p>
                    </div>
                    <Plane className="h-5 w-5 text-kenya-green mx-2 mt-1" />
                    <div className="text-right">
                      <p className="font-bold text-lg">{trip.destination_city}</p>
                      <p className="text-sm text-gray-500">{trip.destination_country}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(trip.departure_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </span>
                    <span>{trip.available_weight_kg}kg available</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold">
                        {trip.profiles?.full_name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="text-sm font-medium flex items-center gap-1">
                          {trip.profiles?.full_name || 'Anonymous'}
                          {trip.profiles?.subscription_tier === 'pro' && <span className="badge-pro text-[10px]">PRO</span>}
                          {trip.profiles?.subscription_tier === 'premium' && <span className="badge-premium text-[10px]">PREMIUM</span>}
                        </p>
                        {trip.profiles?.avg_rating && (
                          <p className="text-xs text-gray-500 flex items-center gap-0.5">
                            <Star className="h-3 w-3 text-gold" /> {trip.profiles.avg_rating.toFixed(1)}
                          </p>
                        )}
                      </div>
                    </div>
                    <p className="font-bold text-kenya-green text-lg">&euro;{trip.price_per_kg}/kg</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
