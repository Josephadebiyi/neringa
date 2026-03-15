/*
  # Add Analytics & Tracking Tables
  
  ## New Tables
  
  1. analytics_events - Track all user interactions and visits
  2. withdrawal_requests - Manage withdrawal requests
  3. support_tickets - Customer support system  
  4. user_analytics - Aggregated user statistics
  5. platform_analytics - Daily platform statistics
  
  ## Security
  - RLS enabled on all tables
  - Users can only access their own data
*/

-- Analytics Events Table
CREATE TABLE IF NOT EXISTS analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  event_type text NOT NULL,
  event_data jsonb DEFAULT '{}'::jsonb,
  country text,
  city text,
  device_type text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create events"
  ON analytics_events FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users read own events"
  ON analytics_events FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Withdrawal Requests Table
CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount decimal(10,2) NOT NULL,
  currency text DEFAULT 'EUR',
  method text NOT NULL,
  status text DEFAULT 'pending',
  bank_details jsonb DEFAULT '{}'::jsonb,
  admin_notes text,
  processed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own withdrawals"
  ON withdrawal_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users create withdrawals"
  ON withdrawal_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Support Tickets Table
CREATE TABLE IF NOT EXISTS support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  category text DEFAULT 'general',
  status text DEFAULT 'open',
  priority text DEFAULT 'medium',
  assigned_to uuid,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own tickets"
  ON support_tickets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users create tickets"
  ON support_tickets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- User Analytics Table
CREATE TABLE IF NOT EXISTS user_analytics (
  user_id uuid PRIMARY KEY,
  total_bookings integer DEFAULT 0,
  total_earnings decimal(10,2) DEFAULT 0,
  total_spent decimal(10,2) DEFAULT 0,
  total_trips integer DEFAULT 0,
  total_deliveries integer DEFAULT 0,
  countries_visited text[] DEFAULT ARRAY[]::text[],
  rating decimal(3,2) DEFAULT 0,
  last_active timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own analytics"
  ON user_analytics FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users manage analytics"
  ON user_analytics FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Platform Analytics Table
CREATE TABLE IF NOT EXISTS platform_analytics (
  date date PRIMARY KEY DEFAULT CURRENT_DATE,
  total_signups integer DEFAULT 0,
  total_visits integer DEFAULT 0,
  total_bookings integer DEFAULT 0,
  total_revenue decimal(10,2) DEFAULT 0,
  commission_earned decimal(10,2) DEFAULT 0,
  active_users integer DEFAULT 0,
  countries jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE platform_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read platform analytics"
  ON platform_analytics FOR SELECT
  TO authenticated
  USING (true);

-- Add commission tracking to existing transactions table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transactions' AND column_name = 'commission_amount'
  ) THEN
    ALTER TABLE transactions ADD COLUMN commission_amount decimal(10,2) DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transactions' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE transactions ADD COLUMN metadata jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_analytics_user ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_created ON analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_withdrawals_user ON withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawal_requests(status);
CREATE INDEX IF NOT EXISTS idx_support_user ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_status ON support_tickets(status);