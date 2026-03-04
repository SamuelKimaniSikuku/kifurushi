'use client';
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plane, ArrowRight } from 'lucide-react';

export default function NewTripPage() {
  const [form, setForm] = useState({
    origin_city: '', origin_country: '',
    destination_city: '', destination_country: '',
    departure_date: '', available_weight_kg: '', price_per_kg: '', notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('/api/trips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      const trip = await res.json();
      router.push(`/trips/${trip.id}`);
    } else {
      const data = await res.json();
      setError(data.error || 'Failed to create trip');
    }
    setLoading(false);
  };

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-green-50 p-3 rounded-lg"><Plane className="h-6 w-6 text-kenya-green" /></div>
        <div>
          <h1 className="text-2xl font-bold">Post a Trip</h1>
          <p className="text-gray-600">Let people know you can carry parcels</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card p-8 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From City *</label>
            <input type="text" value={form.origin_city} onChange={update('origin_city')} required
              placeholder="e.g. Berlin" className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-kenya-green focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Country</label>
            <input type="text" value={form.origin_country} onChange={update('origin_country')}
              placeholder="e.g. Germany" className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-kenya-green focus:border-transparent" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To City *</label>
            <input type="text" value={form.destination_city} onChange={update('destination_city')} required
              placeholder="e.g. Nairobi" className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-kenya-green focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Country</label>
            <input type="text" value={form.destination_country} onChange={update('destination_country')}
              placeholder="e.g. Kenya" className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-kenya-green focus:border-transparent" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Departure Date *</label>
          <input type="date" value={form.departure_date} onChange={update('departure_date')} required
            min={new Date().toISOString().split('T')[0]}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-kenya-green focus:border-transparent" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Available Weight (kg) *</label>
            <input type="number" step="0.5" min="0.5" value={form.available_weight_kg} onChange={update('available_weight_kg')} required
              placeholder="e.g. 10" className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-kenya-green focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price per kg (&euro;) *</label>
            <input type="number" step="0.5" min="1" value={form.price_per_kg} onChange={update('price_per_kg')} required
              placeholder="e.g. 5" className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-kenya-green focus:border-transparent" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
          <textarea value={form.notes} onChange={update('notes')} rows={3}
            placeholder="Any restrictions? (no liquids, max size, pickup location, etc.)"
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-kenya-green focus:border-transparent" />
        </div>

        {error && <p className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{error}</p>}

        <button type="submit" disabled={loading} className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50">
          {loading ? 'Posting...' : 'Post Trip'} <ArrowRight className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
