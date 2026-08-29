-- Seeds a permanent demo/showcase business account for recording walkthrough
-- videos and showing new signups how the app works — realistic trips,
-- wallet balance, transaction history, and a chat thread.
--
-- Uses an email on Bago's own domain (not a customer's) so it can never
-- collide with a real signup. Unlike the earlier seed_demo_account.sql
-- (which incorrectly targeted support@etktglobal.com — a real customer
-- account — and silently flagged it as demo without ever setting its
-- password), this script REFUSES to touch any account that isn't already
-- flagged is_demo_account, so it can never hijack a real user again.
--
-- SAFE BY DESIGN: every profile this script creates is flagged
-- is_demo_account = true. The backend excludes is_demo_account rows from
-- real customer trip search, admin revenue/analytics totals, and blocks
-- withdrawals outright (see migrations/is_demo_account.sql and the guards in
-- lib/postgres/shipping.js, server.js, controllers/AdminControllers/
-- getDasboarddata.js, and controllers/FlutterwaveController.js).
--
-- This is a standalone script, NOT a migration — it is not auto-applied by
-- the server's migration runner. Run it once manually against your database:
--   psql "$DATABASE_URL" -f scripts/seed_showcase_demo_account.sql
--
-- Demo login: demo.business@sendwithbago.com / BagoDemo2026!
--
-- Re-running is safe for the business/sender profiles (upserted by email,
-- password always reset to the value above) but inserts a fresh batch of
-- trips/shipments/wallet transactions/messages each time — don't run it
-- more than once unless you want to add to the demo data.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  v_business_id     uuid;
  v_existing_demo   boolean;
  v_sender1_id      uuid;
  v_sender2_id      uuid;
  v_password_hash   text := crypt('BagoDemo2026!', gen_salt('bf'));

  v_trip1_id        uuid := gen_random_uuid();
  v_trip2_id        uuid := gen_random_uuid();
  v_trip3_id        uuid := gen_random_uuid();
  v_trip1_number    text;
  v_trip2_number    text;
  v_trip3_number    text;

  v_wallet_id       uuid;

  v_pkg1_id         uuid := gen_random_uuid();
  v_pkg2_id         uuid := gen_random_uuid();
  v_pkg3_id         uuid := gen_random_uuid();

  v_req1_id         uuid := gen_random_uuid(); -- completed
  v_req2_id         uuid := gen_random_uuid(); -- completed
  v_req3_id         uuid := gen_random_uuid(); -- in transit

  v_conv_id         uuid := gen_random_uuid();
BEGIN
  -- ── Demo business account ────────────────────────────────────────────
  SELECT id, is_demo_account INTO v_business_id, v_existing_demo
    FROM public.profiles WHERE email = 'demo.business@sendwithbago.com';

  IF v_business_id IS NOT NULL AND v_existing_demo IS NOT TRUE THEN
    RAISE EXCEPTION 'demo.business@sendwithbago.com already exists and is NOT flagged as a demo account — refusing to overwrite it. Pick a different demo email.';
  END IF;

  IF v_business_id IS NULL THEN
    INSERT INTO public.profiles (
      email, first_name, last_name, phone, password_hash, country, date_of_birth,
      payment_gateway, preferred_currency, earning_currency, signup_method, signup_source,
      email_verified, image_url, status,
      account_type, company_name, trading_name, business_registration_number,
      business_type, business_address, business_tax_id, representative_role,
      business_status, must_change_password, business_grace_period_started_at,
      kyc_status, kyc_provider, is_demo_account
    ) VALUES (
      'demo.business@sendwithbago.com', 'Bago', 'Demo', '+10000000000', v_password_hash, 'US', '1990-01-01',
      'flutterwave', 'USD', 'USD', 'demo', 'demo',
      true, null, 'verified',
      'company', 'Bago Demo Logistics Ltd', 'Bago Demo', 'DEMO-0001',
      'Logistics', '1 Demo Street, New York, USA', 'DEMO-TAX-0001', 'Operations Manager',
      'verified', false, now(),
      'approved', 'manual', true
    )
    RETURNING id INTO v_business_id;
  ELSE
    -- Already our own demo account from a prior run — reset its password
    -- and identity fields so login always works, no matter how many times
    -- this script has been run before.
    UPDATE public.profiles SET
      password_hash = v_password_hash, is_demo_account = true, must_change_password = false,
      company_name = 'Bago Demo Logistics Ltd', trading_name = 'Bago Demo',
      account_type = 'company', business_status = 'verified', kyc_status = 'approved'
    WHERE id = v_business_id;
  END IF;

  -- ── Two demo sender counterparties (also flagged demo, so their own
  --    activity never pollutes real search/analytics either) ────────────
  SELECT id INTO v_sender1_id FROM public.profiles WHERE email = 'demo.sender1@sendwithbago.com';
  IF v_sender1_id IS NULL THEN
    INSERT INTO public.profiles (
      email, first_name, last_name, phone, password_hash, country, date_of_birth,
      payment_gateway, preferred_currency, earning_currency, signup_method, signup_source,
      email_verified, status, account_type, kyc_status, is_demo_account
    ) VALUES (
      'demo.sender1@sendwithbago.com', 'Ava', 'Sender', '+10000000001', v_password_hash, 'US', '1992-05-10',
      'flutterwave', 'USD', 'USD', 'demo', 'demo', true, 'verified', 'individual', 'approved', true
    )
    RETURNING id INTO v_sender1_id;
  ELSE
    UPDATE public.profiles SET is_demo_account = true, password_hash = v_password_hash WHERE id = v_sender1_id;
  END IF;

  SELECT id INTO v_sender2_id FROM public.profiles WHERE email = 'demo.sender2@sendwithbago.com';
  IF v_sender2_id IS NULL THEN
    INSERT INTO public.profiles (
      email, first_name, last_name, phone, password_hash, country, date_of_birth,
      payment_gateway, preferred_currency, earning_currency, signup_method, signup_source,
      email_verified, status, account_type, kyc_status, is_demo_account
    ) VALUES (
      'demo.sender2@sendwithbago.com', 'Noah', 'Sender', '+10000000002', v_password_hash, 'US', '1988-11-20',
      'flutterwave', 'USD', 'USD', 'demo', 'demo', true, 'verified', 'individual', 'approved', true
    )
    RETURNING id INTO v_sender2_id;
  ELSE
    UPDATE public.profiles SET is_demo_account = true, password_hash = v_password_hash WHERE id = v_sender2_id;
  END IF;

  -- ── Wallet: realistic available + escrow balance ─────────────────────
  INSERT INTO public.wallet_accounts (user_id, available_balance, escrow_balance, currency)
  VALUES (v_business_id, 1450.00, 320.00, 'USD')
  ON CONFLICT (user_id) DO UPDATE SET available_balance = 1450.00, escrow_balance = 320.00
  RETURNING id INTO v_wallet_id;

  -- ── Three demo trips (already active/verified, but excluded from real
  --    search by the is_demo_account filter) ───────────────────────────
  v_trip1_number := lpad(nextval('public.trips_trip_number_seq')::text, 4, '0');
  v_trip2_number := lpad(nextval('public.trips_trip_number_seq')::text, 4, '0');
  v_trip3_number := lpad(nextval('public.trips_trip_number_seq')::text, 4, '0');

  INSERT INTO public.trips (
    id, user_id, trip_number, from_location, from_country, to_location, to_country,
    departure_date, arrival_date, total_kg, available_kg, sold_kg, reserved_kg,
    travel_means, price_per_kg, currency, landmark, travel_document_verified, status
  ) VALUES
    (v_trip1_id, v_business_id, v_trip1_number, 'New York, United States', 'United States', 'London, United Kingdom', 'United Kingdom',
     now() + interval '5 days', now() + interval '6 days', 100, 60, 40, 0, 'airplane', 8.50, 'USD', 'JFK Cargo Terminal', true, 'active'),
    (v_trip2_id, v_business_id, v_trip2_number, 'Lagos, Nigeria', 'Nigeria', 'Accra, Ghana', 'Ghana',
     now() + interval '3 days', now() + interval '4 days', 200, 150, 50, 0, 'car', 4.00, 'USD', 'Murtala Muhammed Airport', true, 'active'),
    (v_trip3_id, v_business_id, v_trip3_number, 'Dubai, United Arab Emirates', 'United Arab Emirates', 'Nairobi, Kenya', 'Kenya',
     now() + interval '2 days', now() + interval '3 days', 80, 65, 15, 0, 'airplane', 9.25, 'USD', 'Dubai International Airport', true, 'active')
  ON CONFLICT (id) DO NOTHING;

  -- ── Three demo packages ──────────────────────────────────────────────
  INSERT INTO public.packages (
    id, user_id, from_country, from_city, to_country, to_city, package_weight, declared_value,
    receiver_name, receiver_email, receiver_phone, description, category, pickup_address, delivery_address
  ) VALUES
    (v_pkg1_id, v_sender1_id, 'United States', 'New York', 'United Kingdom', 'London', 12, 300,
     'Emily Receiver', 'demo.receiver1@sendwithbago.com', '+10000000011', 'Box of clothing samples', 'clothing', '10 Demo Ave, New York', '20 Demo Rd, London'),
    (v_pkg2_id, v_sender2_id, 'Nigeria', 'Lagos', 'Ghana', 'Accra', 8, 150,
     'Kwame Receiver', 'demo.receiver2@sendwithbago.com', '+10000000012', 'Electronics accessories', 'electronics', '5 Demo Close, Lagos', '9 Demo Way, Accra'),
    (v_pkg3_id, v_sender1_id, 'United Arab Emirates', 'Dubai', 'Kenya', 'Nairobi', 20, 500,
     'Amina Receiver', 'demo.receiver3@sendwithbago.com', '+10000000013', 'Cosmetics and skincare bundle', 'cosmetics', '2 Demo Blvd, Dubai', '14 Demo St, Nairobi')
  ON CONFLICT (id) DO NOTHING;

  -- ── Three demo shipment requests: two completed, one in transit ──────
  INSERT INTO public.shipment_requests (
    id, sender_id, traveler_id, package_id, trip_id, amount, currency, status,
    tracking_number, insurance, insurance_cost, insurance_status,
    traveler_payout, platform_commission, terms_accepted, terms_accepted_at,
    sender_received, created_at, updated_at
  ) VALUES
    (v_req1_id, v_sender1_id, v_business_id, v_pkg1_id, v_trip1_id, 102.00, 'USD', 'completed',
     'BAGO-DEMO0001', true, 5.00, 'active', 86.70, 15.30, true, now() - interval '10 days',
     true, now() - interval '10 days', now() - interval '7 days'),
    (v_req2_id, v_sender2_id, v_business_id, v_pkg2_id, v_trip2_id, 32.00, 'USD', 'completed',
     'BAGO-DEMO0002', false, 0, 'not_selected', 27.20, 4.80, true, now() - interval '6 days',
     true, now() - interval '6 days', now() - interval '4 days'),
    (v_req3_id, v_sender1_id, v_business_id, v_pkg3_id, v_trip3_id, 185.00, 'USD', 'intransit',
     'BAGO-DEMO0003', true, 8.00, 'active', 157.25, 27.75, true, now() - interval '1 days',
     false, now() - interval '1 days', now())
  ON CONFLICT (id) DO NOTHING;

  -- ── Wallet transaction history backing the two completed shipments,
  --    plus one still-held escrow for the in-transit one ────────────────
  INSERT INTO public.wallet_transactions (
    wallet_id, user_id, request_id, trip_id, type, amount, currency, status, description, metadata
  ) VALUES
    (v_wallet_id, v_business_id, v_req1_id, v_trip1_id, 'escrow_hold', 86.70, 'USD', 'completed',
     'Escrow held for BAGO-DEMO0001', '{"demo": true}'::jsonb),
    (v_wallet_id, v_business_id, v_req1_id, v_trip1_id, 'earning', 86.70, 'USD', 'completed',
     'Earned for delivering BAGO-DEMO0001', '{"demo": true}'::jsonb),
    (v_wallet_id, v_business_id, v_req2_id, v_trip2_id, 'escrow_hold', 27.20, 'USD', 'completed',
     'Escrow held for BAGO-DEMO0002', '{"demo": true}'::jsonb),
    (v_wallet_id, v_business_id, v_req2_id, v_trip2_id, 'earning', 27.20, 'USD', 'completed',
     'Earned for delivering BAGO-DEMO0002', '{"demo": true}'::jsonb),
    (v_wallet_id, v_business_id, v_req3_id, v_trip3_id, 'escrow_hold', 157.25, 'USD', 'completed',
     'Escrow held for BAGO-DEMO0003', '{"demo": true}'::jsonb)
  ON CONFLICT DO NOTHING;

  -- ── Chat thread between the demo business and demo sender 1, tied to
  --    the in-transit shipment ────────────────────────────────────────
  INSERT INTO public.conversations (id, request_id, trip_id, sender_id, traveler_id, last_message)
  VALUES (v_conv_id, v_req3_id, v_trip3_id, v_sender1_id, v_business_id,
          'Perfect, thank you for the update!')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.conversation_participants (conversation_id, user_id)
  VALUES (v_conv_id, v_sender1_id), (v_conv_id, v_business_id)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.messages (conversation_id, sender_id, content, metadata, created_at) VALUES
    (v_conv_id, v_sender1_id, 'Hi! Just checking in on my package to Nairobi.', '{}'::jsonb, now() - interval '20 hours'),
    (v_conv_id, v_business_id, 'Hello! Your package is packed and on the truck to the airport now.', '{}'::jsonb, now() - interval '19 hours'),
    (v_conv_id, v_business_id, 'It will depart today and should arrive within 24 hours of landing.', '{}'::jsonb, now() - interval '19 hours'),
    (v_conv_id, v_sender1_id, 'Perfect, thank you for the update!', '{}'::jsonb, now() - interval '18 hours');

END $$;

COMMIT;
