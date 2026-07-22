-- Removes all Kifurushi tables so schema.sql can be run fresh.
-- ⚠️ This DELETES ALL DATA. Only use it before relaunching.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS update_user_rating() CASCADE;
DROP TABLE IF EXISTS subscription_events CASCADE;
DROP TABLE IF EXISTS ratings CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS parcel_contacts CASCADE;
DROP TABLE IF EXISTS parcels CASCADE;
DROP TABLE IF EXISTS trips CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
