'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Package, Search, MapPin, Weight, Clock, Plus } from 'lucide-react';

export default function ParcelsPage() {
  const [parcels, setParcels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [total, setTotal] = useState(0);

  useEffect(() => { fetchParcels(); }, []);

  const fetchParcels = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);

    const res = await fetch(`/api/parcels?${params.toString()}`);
    const data = await res.json();
    setParcels(data.parcels || []);
    setTotal(data.total || 0);
    setLoading(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchParcels();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Parcel Requests</h1>
          <p className="text-gray-600">People looking for travelers to carry their parcels</p>
        </div>
        <Link href="/parcels/new" className="btn-secondary flex items-center gap-2">
          <Plus className="h-4 w-4" /> Post a Request
        </Link>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="card p-4 mb-8">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="From (city or country)" value={from} onChange={(e) => setFrom(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kenya-green focus:border-transparent" />
          </div>
          <div className="flex-1 relative">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="To (city or country)" value={to} onChange={(e) => setTo(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kenya-green focus:border-transparent" />
          </div>
          <button type="submit" className="btn-primary flex items-center gap-2 py-2.5">
            <Search className="h-4 w-4" /> Search
          </button>
        </div>
      </form>

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-kenya-green"></div></div>
      ) : parcels.length === 0 ? (
        <div className="card p-12 text-center">
          <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-500">No parcel requests found</h3>
          <p className="text-gray-400 mb-4">Try adjusting your search or check back later.</p>
          <Link href="/parcels/new" className="text-kenya-green hover:underline">Post your own request</Link>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-4">{total} request{total !== 1 ? 's' : ''} found</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {parcels.map(parcel => (
              <Link key={parcel.id} href={`/parcels/${parcel.id}`} className="card hover:shadow-lg transition-shadow">
                <div className="p-5">
                  <h3 className="font-bold text-lg mb-2">{parcel.title}</h3>
                  <div className="flex items-center gap-1 text-sm text-gray-600 mb-3">
                    <MapPin className="h-3.5 w-3.5" />
                    {parcel.origin_city} &rarr; {parcel.destination_city}
                  </div>

                  {parcel.description && (
                    <p className="text-sm text-gray-500 mb-3 line-clamp-2">{parcel.description}</p>
                  )}

                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                    <span className="flex items-center gap-1"><Weight className="h-3.5 w-3.5" /> {parcel.weight_kg}kg</span>
                    {parcel.deadline && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        by {new Date(parcel.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold">
                        {parcel.profiles?.full_name?.charAt(0) || '?'}
                      </div>
                      <span className="text-sm">{parcel.profiles?.full_name || 'Anonymous'}</span>
                    </div>
                    {parcel.budget && (
                      <p className="font-bold text-kenya-green">&euro;{parcel.budget}</p>
                    )}
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
