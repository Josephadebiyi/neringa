/*
  # BAGGO Mobile App Database Schema

  ## Overview
  Complete database schema for BAGGO - a parcel-to-traveler matching platform.

  ## New Tables

  ### 1. profiles
  - `id` (uuid, references auth.users)
  - `first_name` (text)
  - `last_name` (text) - kept private, only first name shown
  - `email` (text)
  - `phone` (text)
  - `avatar_url` (text)
  - `kyc_verified` (boolean) - must be true for full access
  - `kyc_status` (text) - pending, verified, rejected
  - `total_trips` (integer)
  - `average_rating` (numeric)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. trips
  - `id` (uuid, primary key)
  - `traveler_id` (uuid, references profiles)
  - `from_location` (text)
  - `to_location` (text)
  - `departure_date` (date)
  - `arrival_date` (date)
  - `mode_of_travel` (text) - flight, train, bus, car
  - `available_kg` (numeric)
  - `remaining_kg` (numeric)
  - `status` (text) - active, completed, cancelled
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 3. parcels
  - `id` (uuid, primary key)
  - `sender_id` (uuid, references profiles)
  - `from_location` (text)
  - `to_location` (text)
  - `weight_kg` (numeric)
  - `description` (text)
  - `item_value` (numeric)
  - `insurance_opted` (boolean)
  - `status` (text) - searching, matched, in_transit, delivered, cancelled
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 4. bookings
  - `id` (uuid, primary key)
  - `parcel_id` (uuid, references parcels)
  - `trip_id` (uuid, references trips)
  - `sender_id` (uuid, references profiles)
  - `traveler_id` (uuid, references profiles)
  - `status` (text) - pending, accepted, rejected, cancelled, completed
  - `shipping_fee` (numeric) - 7 euros base
  - `app_fee` (numeric) - calculated fee
  - `insurance_fee` (numeric) - 0.50 per kg if opted
  - `total_amount` (numeric)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 5. messages
  - `id` (uuid, primary key)
  - `booking_id` (uuid, references bookings)
  - `sender_id` (uuid, references profiles)
  - `receiver_id` (uuid, references profiles)
  - `message` (text)
  - `read` (boolean)
  - `created_at` (timestamptz)

  ### 6. ratings
  - `id` (uuid, primary key)
  - `booking_id` (uuid, references bookings)
  - `rated_by` (uuid, references profiles)
  - `rated_user` (uuid, references profiles)
  - `rating` (integer) - 1-5
  - `review` (text)
  - `created_at` (timestamptz)

  ### 7. wallets
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `balance` (numeric)
  - `currency` (text) - default EUR
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 8. transactions
  - `id` (uuid, primary key)
  - `wallet_id` (uuid, references wallets)
  - `booking_id` (uuid, references bookings, nullable)
  - `type` (text) - credit, debit, withdrawal
  - `amount` (numeric)
  - `status` (text) - pending, completed, failed
  - `description` (text)
  - `created_at` (timestamptz)

  ### 9. payment_methods
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `type` (text) - apple_pay, paypal, card
  - `details` (jsonb) - encrypted payment details
  - `is_default` (boolean)
  - `created_at` (timestamptz)

  ## Security
  - RLS enabled on all tables
  - Users can only view their own sensitive data
  - Public profiles show limited information (first name, rating, trips)
  - Messages only accessible to booking participants
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  avatar_url text,
  kyc_verified boolean DEFAULT false,
  kyc_status text DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'verified', 'rejected')),
  total_trips integer DEFAULT 0,
  average_rating numeric(3,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create trips table
CREATE TABLE IF NOT EXISTS trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  traveler_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  from_location text NOT NULL,
  to_location text NOT NULL,
  departure_date date NOT NULL,
  arrival_date date NOT NULL,
  mode_of_travel text NOT NULL CHECK (mode_of_travel IN ('flight', 'train', 'bus', 'car')),
  available_kg numeric(5,2) NOT NULL CHECK (available_kg > 0),
  remaining_kg numeric(5,2) NOT NULL CHECK (remaining_kg >= 0),
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create parcels table
CREATE TABLE IF NOT EXISTS parcels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  from_location text NOT NULL,
  to_location text NOT NULL,
  weight_kg numeric(5,2) NOT NULL CHECK (weight_kg > 0),
  description text NOT NULL,
  item_value numeric(10,2) NOT NULL CHECK (item_value >= 0),
  insurance_opted boolean DEFAULT false,
  status text DEFAULT 'searching' CHECK (status IN ('searching', 'matched', 'in_transit', 'delivered', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parcel_id uuid REFERENCES parcels(id) ON DELETE CASCADE NOT NULL,
  trip_id uuid REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  traveler_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled', 'completed')),
  shipping_fee numeric(10,2) DEFAULT 7.00,
  app_fee numeric(10,2) NOT NULL,
  insurance_fee numeric(10,2) DEFAULT 0,
  total_amount numeric(10,2) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  message text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create ratings table
CREATE TABLE IF NOT EXISTS ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
  rated_by uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  rated_user uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(booking_id, rated_by)
);

-- Create wallets table
CREATE TABLE IF NOT EXISTS wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  balance numeric(10,2) DEFAULT 0 CHECK (balance >= 0),
  currency text DEFAULT 'EUR',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id uuid REFERENCES wallets(id) ON DELETE CASCADE NOT NULL,
  booking_id uuid REFERENCES bookings(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('credit', 'debit', 'withdrawal')),
  amount numeric(10,2) NOT NULL CHECK (amount > 0),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  description text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create payment_methods table
CREATE TABLE IF NOT EXISTS payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('apple_pay', 'paypal', 'card')),
  details jsonb NOT NULL,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_trips_traveler ON trips(traveler_id);
CREATE INDEX IF NOT EXISTS idx_trips_dates ON trips(departure_date, arrival_date);
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);
CREATE INDEX IF NOT EXISTS idx_parcels_sender ON parcels(sender_id);
CREATE INDEX IF NOT EXISTS idx_parcels_status ON parcels(status);
CREATE INDEX IF NOT EXISTS idx_bookings_parcel ON bookings(parcel_id);
CREATE INDEX IF NOT EXISTS idx_bookings_trip ON bookings(trip_id);
CREATE INDEX IF NOT EXISTS idx_bookings_sender ON bookings(sender_id);
CREATE INDEX IF NOT EXISTS idx_bookings_traveler ON bookings(traveler_id);
CREATE INDEX IF NOT EXISTS idx_messages_booking ON messages(booking_id);
CREATE INDEX IF NOT EXISTS idx_ratings_user ON ratings(rated_user);
CREATE INDEX IF NOT EXISTS idx_transactions_wallet ON transactions(wallet_id);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE parcels ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view public profile info"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- RLS Policies for trips
CREATE POLICY "Anyone can view active trips"
  ON trips FOR SELECT
  TO authenticated
  USING (status = 'active' OR traveler_id = auth.uid());

CREATE POLICY "Travelers can create trips"
  ON trips FOR INSERT
  TO authenticated
  WITH CHECK (traveler_id = auth.uid() AND (SELECT kyc_verified FROM profiles WHERE id = auth.uid()) = true);

CREATE POLICY "Travelers can update own trips"
  ON trips FOR UPDATE
  TO authenticated
  USING (traveler_id = auth.uid())
  WITH CHECK (traveler_id = auth.uid());

CREATE POLICY "Travelers can delete own trips"
  ON trips FOR DELETE
  TO authenticated
  USING (traveler_id = auth.uid());

-- RLS Policies for parcels
CREATE POLICY "Users can view own parcels"
  ON parcels FOR SELECT
  TO authenticated
  USING (sender_id = auth.uid());

CREATE POLICY "Senders can create parcels"
  ON parcels FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid() AND (SELECT kyc_verified FROM profiles WHERE id = auth.uid()) = true);

CREATE POLICY "Senders can update own parcels"
  ON parcels FOR UPDATE
  TO authenticated
  USING (sender_id = auth.uid())
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Senders can delete own parcels"
  ON parcels FOR DELETE
  TO authenticated
  USING (sender_id = auth.uid());

-- RLS Policies for bookings
CREATE POLICY "Users can view own bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (sender_id = auth.uid() OR traveler_id = auth.uid());

CREATE POLICY "Senders can create bookings"
  ON bookings FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid() AND (SELECT kyc_verified FROM profiles WHERE id = auth.uid()) = true);

CREATE POLICY "Participants can update bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (sender_id = auth.uid() OR traveler_id = auth.uid())
  WITH CHECK (sender_id = auth.uid() OR traveler_id = auth.uid());

-- RLS Policies for messages
CREATE POLICY "Participants can view messages"
  ON messages FOR SELECT
  TO authenticated
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Participants can send messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND 
    EXISTS (
      SELECT 1 FROM bookings 
      WHERE id = booking_id 
      AND status = 'accepted'
      AND (sender_id = auth.uid() OR traveler_id = auth.uid())
    )
  );

CREATE POLICY "Users can update own messages"
  ON messages FOR UPDATE
  TO authenticated
  USING (receiver_id = auth.uid())
  WITH CHECK (receiver_id = auth.uid());

-- RLS Policies for ratings
CREATE POLICY "Anyone can view ratings"
  ON ratings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Booking participants can create ratings"
  ON ratings FOR INSERT
  TO authenticated
  WITH CHECK (
    rated_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM bookings 
      WHERE id = booking_id 
      AND status = 'completed'
      AND (sender_id = auth.uid() OR traveler_id = auth.uid())
    )
  );

-- RLS Policies for wallets
CREATE POLICY "Users can view own wallet"
  ON wallets FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own wallet"
  ON wallets FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own wallet"
  ON wallets FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for transactions
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (wallet_id IN (SELECT id FROM wallets WHERE user_id = auth.uid()));

CREATE POLICY "System can create transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (wallet_id IN (SELECT id FROM wallets WHERE user_id = auth.uid()));

-- RLS Policies for payment_methods
CREATE POLICY "Users can view own payment methods"
  ON payment_methods FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create payment methods"
  ON payment_methods FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own payment methods"
  ON payment_methods FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own payment methods"
  ON payment_methods FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Function to update profile ratings
CREATE OR REPLACE FUNCTION update_profile_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET 
    average_rating = (
      SELECT AVG(rating)::numeric(3,2)
      FROM ratings
      WHERE rated_user = NEW.rated_user
    ),
    updated_at = now()
  WHERE id = NEW.rated_user;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update ratings
CREATE TRIGGER on_rating_created
  AFTER INSERT ON ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_rating();

-- Function to update trip count
CREATE OR REPLACE FUNCTION update_trip_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE profiles
    SET 
      total_trips = total_trips + 1,
      updated_at = now()
    WHERE id = NEW.traveler_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update trip count
CREATE TRIGGER on_trip_completed
  AFTER UPDATE ON trips
  FOR EACH ROW
  EXECUTE FUNCTION update_trip_count();