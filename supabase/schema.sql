-- ═══════════════════════════════════════════════════════════
-- KIFURUSHI DATABASE SCHEMA
-- Run this in Supabase SQL Editor to set up your database
-- ═══════════════════════════════════════════════════════════

-- Enable UUID extension
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
  country TEXT,  -- e.g. 'DE', 'UK', 'FR'
  city TEXT,

  -- Subscription
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium', 'pro')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_expires_at TIMESTAMPTZ,

  -- Trust
  is_verified BOOLEAN DEFAULT FALSE,
  id_verified BOOLEAN DEFAULT FALSE,
  total_deliveries INTEGER DEFAULT 0,
  avg_rating NUMERIC(2,1) DEFAULT 0.0,
  total_ratings INTEGER DEFAULT 0,
  vouches INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── TRIPS ───
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  from_city TEXT NOT NULL,
  from_country TEXT NOT NULL,
  to_city TEXT NOT NULL,
  to_country TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('ke-eu', 'eu-ke')),

  travel_date DATE NOT NULL,
  available_kg NUMERIC(4,1) NOT NULL,
  price_per_kg NUMERIC(6,2) NOT NULL,
  currency TEXT DEFAULT 'EUR',

  accepts TEXT[] DEFAULT '{}',  -- array of accepted item types
  payment_methods TEXT[] DEFAULT '{}',  -- 'mpesa', 'escrow', 'cash', 'bank'
  pickup_location TEXT,
  notes TEXT,

  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'booked', 'completed', 'cancelled')),
  is_featured BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── PARCEL REQUESTS ───
CREATE TABLE parcels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  from_city TEXT NOT NULL,
  from_country TEXT NOT NULL,
  to_city TEXT NOT NULL,
  to_country TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('ke-eu', 'eu-ke')),

  item_type TEXT NOT NULL,
  item_description TEXT NOT NULL,
  weight_estimate TEXT NOT NULL,
  needed_by DATE,
  budget NUMERIC(8,2),
  budget_currency TEXT DEFAULT 'EUR',

  payment_methods TEXT[] DEFAULT '{}',
  contact_preference TEXT DEFAULT 'whatsapp',
  is_urgent BOOLEAN DEFAULT FALSE,

  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'matched', 'in_transit', 'delivered', 'cancelled')),
  matched_trip_id UUID REFERENCES trips(id),
  matched_traveler_id UUID REFERENCES profiles(id),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── BOOKINGS ───
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id),
  parcel_id UUID NOT NULL REFERENCES parcels(id),
  sender_id UUID NOT NULL REFERENCES profiles(id),
  traveler_id UUID NOT NULL REFERENCES profiles(id),

  agreed_price NUMERIC(8,2) NOT NULL,
  currency TEXT DEFAULT 'EUR',
  payment_method TEXT NOT NULL,  -- 'mpesa', 'escrow', 'cash', 'bank'

  -- Escrow
  escrow_status TEXT CHECK (escrow_status IN ('pending', 'held', 'released', 'refunded')),
  stripe_payment_intent_id TEXT,

  -- Delivery tracking
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'picked_up', 'in_transit', 'delivered', 'disputed', 'cancelled')),
  pickup_photo_url TEXT,
  delivery_photo_url TEXT,
  pickup_confirmed_at TIMESTAMPTZ,
  delivery_confirmed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── RATINGS ───
CREATE TABLE ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id),
  rater_id UUID NOT NULL REFERENCES profiles(id),
  rated_id UUID NOT NULL REFERENCES profiles(id),

  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
  comment TEXT,
  role TEXT NOT NULL CHECK (role IN ('sender', 'traveler')),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── SUBSCRIPTION EVENTS (Stripe webhook log) ───
CREATE TABLE subscription_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  stripe_event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── INDEXES ───
CREATE INDEX idx_trips_direction ON trips(direction);
CREATE INDEX idx_trips_travel_date ON trips(travel_date);
CREATE INDEX idx_trips_status ON trips(status);
CREATE INDEX idx_trips_user_id ON trips(user_id);
CREATE INDEX idx_parcels_direction ON parcels(direction);
CREATE INDEX idx_parcels_status ON parcels(status);
CREATE INDEX idx_parcels_user_id ON parcels(user_id);
CREATE INDEX idx_bookings_trip_id ON bookings(trip_id);
CREATE INDEX idx_bookings_sender_id ON bookings(sender_id);
CREATE INDEX idx_bookings_traveler_id ON bookings(traveler_id);
CREATE INDEX idx_profiles_subscription ON profiles(subscription_tier);
CREATE INDEX idx_profiles_country ON profiles(country);

-- ─── ROW LEVEL SECURITY ───
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE parcels ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- Profiles: anyone can read, only owner can update
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Trips: anyone can read active, owner can CRUD
CREATE POLICY "Active trips viewable by everyone" ON trips FOR SELECT USING (status = 'active' OR user_id = auth.uid());
CREATE POLICY "Users can create trips" ON trips FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own trips" ON trips FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own trips" ON trips FOR DELETE USING (auth.uid() = user_id);

-- Parcels: anyone can read open, owner can CRUD
CREATE POLICY "Open parcels viewable by everyone" ON parcels FOR SELECT USING (status = 'open' OR user_id = auth.uid());
CREATE POLICY "Users can create parcels" ON parcels FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own parcels" ON parcels FOR UPDATE USING (auth.uid() = user_id);

-- Bookings: only participants can see
CREATE POLICY "Booking participants can view" ON bookings FOR SELECT USING (sender_id = auth.uid() OR traveler_id = auth.uid());
CREATE POLICY "Users can create bookings" ON bookings FOR INSERT WITH CHECK (sender_id = auth.uid() OR traveler_id = auth.uid());
CREATE POLICY "Participants can update bookings" ON bookings FOR UPDATE USING (sender_id = auth.uid() OR traveler_id = auth.uid());

-- Ratings: public read, only rater can create
CREATE POLICY "Ratings are public" ON ratings FOR SELECT USING (true);
CREATE POLICY "Users can create ratings" ON ratings FOR INSERT WITH CHECK (auth.uid() = rater_id);

-- ─── FUNCTIONS ───
-- Auto-update avg_rating when a new rating is added
CREATE OR REPLACE FUNCTION update_user_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles SET
    avg_rating = (SELECT AVG(score)::NUMERIC(2,1) FROM ratings WHERE rated_id = NEW.rated_id),
    total_ratings = (SELECT COUNT(*) FROM ratings WHERE rated_id = NEW.rated_id)
  WHERE id = NEW.rated_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_rating_insert
  AFTER INSERT ON ratings
  FOR EACH ROW EXECUTE FUNCTION update_user_rating();

-- Auto-create profile on signup
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
