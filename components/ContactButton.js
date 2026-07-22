'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MessageCircle, Phone, Crown, Lock } from 'lucide-react';

// Premium-gated contact reveal.
// type: 'trip' | 'parcel', id: listing uuid, label: button text
export default function ContactButton({ type, id, label = 'Show Contact' }) {
  const [state, setState] = useState('idle'); // idle | loading | revealed | login | upsell | error
  const [contact, setContact] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const reveal = async () => {
    setState('loading');
    try {
      const res = await fetch(`/api/contact?type=${type}&id=${id}`);
      const data = await res.json();
      if (res.ok) {
        setContact(data);
        setState('revealed');
      } else if (res.status === 401) {
        setState('login');
      } else if (res.status === 403) {
        setState('upsell');
      } else {
        setErrorMsg(data.error || 'Contact not available');
        setState('error');
      }
    } catch {
      setErrorMsg('Network error — please try again');
      setState('error');
    }
  };

  if (state === 'revealed' && contact) {
    const wa = (contact.whatsapp || '').replace(/[^\d]/g, '');
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-2">
        {contact.name && <p className="font-semibold text-sm">{contact.name}</p>}
        <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer"
          className="w-full btn-primary flex items-center justify-center gap-2">
          <MessageCircle className="h-4 w-4" /> WhatsApp
        </a>
        <a href={`tel:${(contact.phone || '').replace(/[^+\d]/g, '')}`}
          className="w-full flex items-center justify-center gap-2 border-2 border-kenya-green text-kenya-green rounded-lg py-2.5 font-semibold hover:bg-green-50 transition-colors">
          <Phone className="h-4 w-4" /> {contact.phone}
        </a>
      </div>
    );
  }

  if (state === 'login') {
    return (
      <div className="bg-gray-50 border rounded-xl p-4 text-center space-y-3">
        <p className="text-sm text-gray-600 flex items-center justify-center gap-1">
          <Lock className="h-4 w-4" /> Log in to see contact details
        </p>
        <Link href="/login" className="w-full btn-primary block">Log in / Sign up free</Link>
      </div>
    );
  }

  if (state === 'upsell') {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center space-y-3">
        <Crown className="h-6 w-6 text-amber-500 mx-auto" />
        <p className="text-sm text-gray-700">
          Contact details are a <b>Premium</b> feature —
          <b> KES 150/week (≈ €1)</b> unlocks every match on Kifurushi.
        </p>
        <Link href="/premium" className="w-full btn-primary block">Go Premium ⭐</Link>
      </div>
    );
  }

  if (state === 'error') {
    return <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3 text-center">{errorMsg}</p>;
  }

  return (
    <button onClick={reveal} disabled={state === 'loading'}
      className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-60">
      <MessageCircle className="h-4 w-4" /> {state === 'loading' ? 'Checking…' : label}
    </button>
  );
}
