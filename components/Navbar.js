'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Menu, X, Package, Plane, Crown, LogOut, User } from 'lucide-react';

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('full_name, subscription_tier, avatar_url')
          .eq('id', user.id)
          .single();
        setProfile(data);
      }
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) setProfile(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  const tierBadge = profile?.subscription_tier === 'pro'
    ? <span className="badge-pro ml-1">PRO</span>
    : profile?.subscription_tier === 'premium'
    ? <span className="badge-premium ml-1">PREMIUM</span>
    : null;

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link href="/" className="flex items-center gap-2">
            <Package className="h-8 w-8 text-kenya-green" />
            <span className="text-xl font-bold text-kenya-green">Kifurushi</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/trips" className="text-gray-700 hover:text-kenya-green flex items-center gap-1">
              <Plane className="h-4 w-4" /> Trips
            </Link>
            <Link href="/parcels" className="text-gray-700 hover:text-kenya-green flex items-center gap-1">
              <Package className="h-4 w-4" /> Parcels
            </Link>
            <Link href="/premium" className="text-accent hover:text-orange-600 flex items-center gap-1 font-semibold">
              <Crown className="h-4 w-4" /> Premium
            </Link>

            {user ? (
              <div className="flex items-center gap-4">
                <Link href="/dashboard" className="flex items-center gap-1 text-gray-700 hover:text-kenya-green">
                  <User className="h-4 w-4" />
                  {profile?.full_name || 'Dashboard'}
                  {tierBadge}
                </Link>
                <button onClick={handleLogout} className="text-gray-500 hover:text-red-600">
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <Link href="/login" className="btn-primary text-sm py-2 px-4">
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t bg-white px-4 py-4 space-y-3">
          <Link href="/trips" className="block text-gray-700 py-2" onClick={() => setMenuOpen(false)}>Trips</Link>
          <Link href="/parcels" className="block text-gray-700 py-2" onClick={() => setMenuOpen(false)}>Parcels</Link>
          <Link href="/premium" className="block text-accent font-semibold py-2" onClick={() => setMenuOpen(false)}>Premium</Link>
          {user ? (
            <>
              <Link href="/dashboard" className="block text-gray-700 py-2" onClick={() => setMenuOpen(false)}>Dashboard</Link>
              <button onClick={handleLogout} className="block text-red-600 py-2">Log Out</button>
            </>
          ) : (
            <Link href="/login" className="block btn-primary text-center" onClick={() => setMenuOpen(false)}>Sign In</Link>
          )}
        </div>
      )}
    </nav>
  );
}
