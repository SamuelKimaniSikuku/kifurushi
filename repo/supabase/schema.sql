-- ═══════════════════════════════════════════════════════════
-- KIFURUSHI DATABASE SCHEMA  (v2 — matches the app code)
-- Run this in Supabase SQL Editor on a FRESH project.
-- If you ran the old schema before, run supabase/reset.sql first.
-- ═══════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── PROFILES ───
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  whatsapp TEXT,
  avatar_url TEXT,
  bio TEXT,
  country TEXT,
  city TEXT,

  -- Subscription
  subscription_tier TEXT NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium', 'pro')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,

  -- Trust
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  avg_rating NUMERIC(2,1) DEFAULT 0.0,
  total_ratings INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── TRIPS (travellers offering luggage space) ───
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  origin_city TEXT NOT NULL,
  origin_country TEXT NOT NULL DEFAULT '',
  destination_city TEXT NOT NULL,
  destination_country TEXT NOT NULL DEFAULT '',

  departure_date DATE NOT NULL,
  available_weight_kg NUMERIC(5,1) NOT NULL,
  price_per_kg NUMERIC(8,2) NOT NULL,
  notes TEXT NOT NULL DEFAULT '',

  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'booked', 'completed', 'cancelled')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── PARCEL REQUESTS (senders) ───
-- sender_id is NULLABLE: guests may post a parcel without an account.
CREATE TABLE parcels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  guest_name TEXT,          -- shown instead of a profile for guest posts

  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  origin_city TEXT NOT NULL,
  origin_country TEXT NOT NULL DEFAULT '',
  destination_city TEXT NOT NULL,
  destination_country TEXT NOT NULL DEFAULT '',

  weight_kg NUMERIC(5,1) NOT NULL,
  budget NUMERIC(8,2),
  deadline DATE,

  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'matched', 'in_transit', 'delivered', 'cancelled')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- a post must have either a registered sender or a guest name
  CONSTRAINT sender_or_guest CHECK (sender_id IS NOT NULL OR guest_name IS NOT NULL)
);

-- ─── PARCEL CONTACTS (guest contact details, kept private) ───
-- Stored separately with NO read policies, so guest phone numbers can
-- never be fetched from the browser. They are only released through
-- /api/contact, which checks the requester's Premium status.
CREATE TABLE parcel_contacts (
  parcel_id UUID PRIMARY KEY REFERENCES parcels(id) ON DELETE CASCADE,
  contact TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── BOOKINGS ───
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  parcel_id UUID NOT NULL REFERENCES parcels(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id),
  traveler_id UUID NOT NULL REFERENCES profiles(id),

  agreed_price NUMERIC(8,2),
  currency TEXT NOT NULL DEFAULT 'EUR',
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'picked_up', 'in_transit', 'delivered', 'disputed', 'cancelled')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── RATINGS ───
CREATE TABLE ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  rater_id UUID NOT NULL REFERENCES profiles(id),
  rated_id UUID NOT NULL REFERENCES profiles(id),
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
  comment TEXT,
  role TEXT NOT NULL CHECK (role IN ('sender', 'traveler')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (booking_id, rater_id)
);

-- ─── SUBSCRIPTION EVENTS (Stripe webhook log) ───
CREATE TABLE subscription_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  stripe_event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  plan TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── INDEXES ───
CREATE INDEX idx_trips_departure_date ON trips(departure_date);
CREATE INDEX idx_trips_status ON trips(status);
CREATE INDEX idx_trips_user_id ON trips(user_id);
CREATE INDEX idx_parcels_status ON parcels(status);
CREATE INDEX idx_parcels_sender_id ON parcels(sender_id);
CREATE INDEX idx_bookings_trip_id ON bookings(trip_id);
CREATE INDEX idx_bookings_sender_id ON bookings(sender_id);
CREATE INDEX idx_bookings_traveler_id ON bookings(traveler_id);
CREATE INDEX idx_profiles_stripe_customer ON profiles(stripe_customer_id);

-- ─── ROW LEVEL SECURITY ───
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE parcels ENABLE ROW LEVEL SECURITY;
ALTER TABLE parcel_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;

-- Profiles: public read (the app selects only safe display fields),
-- owner can update/insert own row.
-- NOTE: phone & whatsapp are protected by column privileges below.
CREATE POLICY "profiles_public_read" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_owner_update" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_owner_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Hide phone/whatsapp from the public API: only the service role
-- (used by /api/contact after a Premium check) can read them.
REVOKE SELECT (phone, whatsapp) ON profiles FROM anon, authenticated;

-- Trips: everyone can browse active trips; owners manage their own.
CREATE POLICY "trips_public_read" ON trips FOR SELECT USING (status = 'active' OR user_id = auth.uid());
CREATE POLICY "trips_owner_insert" ON trips FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "trips_owner_update" ON trips FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "trips_owner_delete" ON trips FOR DELETE USING (auth.uid() = user_id);

-- Parcels: everyone can browse open parcels; owners manage their own.
-- Guests may post without an account (sender_id NULL + guest_name set);
-- their contact goes into parcel_contacts via the API, never into this table.
CREATE POLICY "parcels_public_read" ON parcels FOR SELECT USING (status = 'open' OR sender_id = auth.uid());
CREATE POLICY "parcels_user_insert" ON parcels FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "parcels_guest_insert" ON parcels FOR INSERT TO anon WITH CHECK (sender_id IS NULL AND guest_name IS NOT NULL);
CREATE POLICY "parcels_owner_update" ON parcels FOR UPDATE USING (auth.uid() = sender_id);

-- Parcel contacts: guests can leave their contact when posting.
-- NO select policy → nobody can read them from the browser.
CREATE POLICY "parcel_contacts_insert" ON parcel_contacts FOR INSERT WITH CHECK (true);

-- Bookings: only participants can see and manage.
CREATE POLICY "bookings_participants_read" ON bookings FOR SELECT USING (sender_id = auth.uid() OR traveler_id = auth.uid());
CREATE POLICY "bookings_participants_insert" ON bookings FOR INSERT WITH CHECK (sender_id = auth.uid() OR traveler_id = auth.uid());
CREATE POLICY "bookings_participants_update" ON bookings FOR UPDATE USING (sender_id = auth.uid() OR traveler_id = auth.uid());

-- Ratings: public read, only the rater can create.
CREATE POLICY "ratings_public_read" ON ratings FOR SELECT USING (true);
CREATE POLICY "ratings_rater_insert" ON ratings FOR INSERT WITH CHECK (auth.uid() = rater_id);

-- Subscription events: not readable from the browser (webhook/admin only).

-- ─── FUNCTIONS & TRIGGERS ───

-- Keep avg_rating in sync
CREATE OR REPLACE FUNCTION update_user_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles SET
    avg_rating = (SELECT AVG(score)::NUMERIC(2,1) FROM ratings WHERE rated_id = NEW.rated_id),
    total_ratings = (SELECT COUNT(*) FROM ratings WHERE rated_id = NEW.rated_id)
  WHERE id = NEW.rated_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_rating_insert
  AFTER INSERT ON ratings
  FOR EACH ROW EXECUTE FUNCTION update_user_rating();

-- Auto-create a profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
