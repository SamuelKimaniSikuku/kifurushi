'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Package, ArrowRight } from 'lucide-react';

export default function NewParcelPage() {
  const [form, setForm] = useState({
    title: '', description: '',
    origin_city: '', origin_country: '',
    destination_city: '', destination_country: '',
    weight_kg: '', budget: '', deadline: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('/api/parcels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      const parcel = await res.json();
      router.push(`/parcels/${parcel.id}`);
    } else {
      const data = await res.json();
      setError(data.error || 'Failed to create request');
    }
    setLoading(false);
  };

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-orange-50 p-3 rounded-lg"><Package className="h-6 w-6 text-accent" /></div>
        <div>
          <h1 className="text-2xl font-bold">Send a Parcel</h1>
          <p className="text-gray-600">Post a request and find a traveler</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card p-8 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">What are you sending? *</label>
          <input type="text" value={form.title} onChange={update('title')} required
            placeholder="e.g. Birthday gift for mum, Electronics, Documents"
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-kenya-green focus:border-transparent" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea value={form.description} onChange={update('description')} rows={3}
            placeholder="Describe the parcel: size, contents, any special handling needed..."
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-kenya-green focus:border-transparent" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From City *</label>
            <input type="text" value={form.origin_city} onChange={update('origin_city')} required
              placeholder="e.g. London" className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-kenya-green focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Country</label>
            <input type="text" value={form.origin_country} onChange={update('origin_country')}
              placeholder="e.g. UK" className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-kenya-green focus:border-transparent" />
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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg) *</label>
            <input type="number" step="0.1" min="0.1" value={form.weight_kg} onChange={update('weight_kg')} required
              placeholder="e.g. 3" className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-kenya-green focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Budget (&euro;)</label>
            <input type="number" step="1" min="1" value={form.budget} onChange={update('budget')}
              placeholder="e.g. 25" className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-kenya-green focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
            <input type="date" value={form.deadline} onChange={update('deadline')}
              min={new Date().toISOString().split('T')[0]}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-kenya-green focus:border-transparent" />
          </div>
        </div>

        {error && <p className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{error}</p>}

        <button type="submit" disabled={loading} className="w-full btn-secondary flex items-center justify-center gap-2 disabled:opacity-50">
          {loading ? 'Posting...' : 'Post Parcel Request'} <ArrowRight className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
