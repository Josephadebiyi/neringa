-- Demo data for admin dashboard screenshots: 30 tagged users + 10 completed shipments.
-- Every row is tagged signup_source = 'demo_seed_20260714' (profiles) or reachable
-- only from those profiles (everything else) — safe to delete later in one shot
-- with cleanup_demo_dashboard_data.sql. Paste this whole block into your SQL editor.

create extension if not exists pgcrypto;

do $$
declare
  demo_tag text := 'demo_seed_20260714';
  demo_password_hash text := crypt('DemoSeed!2026', gen_salt('bf', 10));
  first_names text[] := array['Ade','Bola','Chidi','Dara','Efe','Femi','Grace','Hassan','Ifeoma','Jide',
                               'Kemi','Lola','Musa','Nneka','Obi','Peju','Quincy','Remi','Sade','Tunde',
                               'Uche','Vera','Wale','Xola','Yemi','Zara','Amara','Bayo','Chioma','Deji'];
  last_names  text[] := array['Okafor','Adeyemi','Mensah','Osei','Kariuki','Ndlovu','Abara','Bello','Chukwu','Diallo',
                               'Eze','Fatunde','Gyasi','Haruna','Ibe','Jallow','Kamau','Lawal','Mwangi','Nwosu',
                               'Oduya','Peters','Quaye','Rahman','Sesay','Toure','Umeh','Vance','Wanjiru','Yusuf'];
  countries   text[] := array['NG','GH','KE','ZA','DE','FR','GB','US'];
  currencies  text[] := array['NGN','GHS','KES','ZAR','EUR','EUR','GBP','USD'];
  cities_ng text[] := array['Lagos','Abuja']; cities_gh text[] := array['Accra','Kumasi'];
  cities_ke text[] := array['Nairobi','Mombasa']; cities_za text[] := array['Johannesburg','Cape Town'];
  cities_de text[] := array['Berlin','Munich']; cities_fr text[] := array['Paris','Lyon'];
  cities_gb text[] := array['London','Manchester']; cities_us text[] := array['New York','Atlanta'];
  categories  text[] := array['Electronics','Documents','Clothing','Gifts','Books'];

  user_ids uuid[] := '{}';
  user_countries text[] := '{}';
  user_currencies text[] := '{}';

  v_email text;
  v_country text;
  v_currency text;
  v_id uuid;

  v_traveler uuid; v_sender uuid;
  v_traveler_country text; v_sender_country text; v_currency2 text;
  v_from_city text; v_to_city text;
  v_price_per_kg numeric; v_weight numeric; v_amount numeric;
  v_traveler_payout numeric; v_platform_commission numeric; v_processing_fee numeric;
  v_fx_buffer numeric; v_bago_net_revenue numeric;
  v_trip_id uuid; v_package_id uuid; v_request_id uuid;
  v_tracking text;
begin
  raise notice 'Seeding 30 demo profiles tagged %...', demo_tag;

  for i in 0..29 loop
    v_country := countries[(i % 8) + 1];
    v_currency := currencies[(i % 8) + 1];
    v_email := format('demo.%s.%s.%s@bago-demo-seed.internal',
                       lower(first_names[(i % 30) + 1]), lower(last_names[(i % 30) + 1]), i);

    select id into v_id from public.profiles where email = v_email limit 1;
    if v_id is null then
      insert into public.profiles (
        email, first_name, last_name, phone, password_hash, country,
        date_of_birth, payment_gateway, preferred_currency, earning_currency,
        signup_method, signup_source, email_verified, status,
        kyc_status, kyc_verified_at, account_status
      )
      values (
        v_email, first_names[(i % 30) + 1], last_names[(i % 30) + 1],
        '+1555' || lpad((1000000 + i)::text, 7, '0'), demo_password_hash, v_country,
        '1995-01-01', 'flutterwave', v_currency, v_currency,
        'email', demo_tag, true, 'verified', 'approved', timezone('utc', now()), 'active'
      )
      returning id into v_id;
    end if;

    insert into public.wallet_accounts (user_id, available_balance, escrow_balance, currency)
    values (v_id, 0, 0, v_currency)
    on conflict (user_id) do nothing;

    user_ids := array_append(user_ids, v_id);
    user_countries := array_append(user_countries, v_country);
    user_currencies := array_append(user_currencies, v_currency);
  end loop;

  raise notice '30 demo profiles ready. Seeding 10 completed shipments...';

  for i in 0..9 loop
    v_traveler := user_ids[i + 1];
    v_sender := user_ids[i + 16]; -- disjoint half of the 30, so sender <> traveler
    v_traveler_country := user_countries[i + 1];
    v_sender_country := user_countries[i + 16];
    v_currency2 := user_currencies[i + 1];

    v_from_city := case v_traveler_country
      when 'NG' then cities_ng[(i % 2) + 1] when 'GH' then cities_gh[(i % 2) + 1]
      when 'KE' then cities_ke[(i % 2) + 1] when 'ZA' then cities_za[(i % 2) + 1]
      when 'DE' then cities_de[(i % 2) + 1] when 'FR' then cities_fr[(i % 2) + 1]
      when 'GB' then cities_gb[(i % 2) + 1] else cities_us[(i % 2) + 1] end;
    v_to_city := case v_sender_country
      when 'NG' then cities_ng[((i + 1) % 2) + 1] when 'GH' then cities_gh[((i + 1) % 2) + 1]
      when 'KE' then cities_ke[((i + 1) % 2) + 1] when 'ZA' then cities_za[((i + 1) % 2) + 1]
      when 'DE' then cities_de[((i + 1) % 2) + 1] when 'FR' then cities_fr[((i + 1) % 2) + 1]
      when 'GB' then cities_gb[((i + 1) % 2) + 1] else cities_us[((i + 1) % 2) + 1] end;

    v_price_per_kg := 8 + (i % 5) * 2;
    v_weight := 2 + (i % 4);
    v_amount := round((v_price_per_kg * v_weight * 1.35)::numeric, 2);
    v_traveler_payout := round((v_price_per_kg * v_weight)::numeric, 2);
    v_platform_commission := round((v_amount * 0.12)::numeric, 2);
    v_processing_fee := round((v_amount * 0.03)::numeric, 2);
    v_fx_buffer := round((v_amount * 0.01)::numeric, 2);
    v_bago_net_revenue := v_platform_commission + v_processing_fee + v_fx_buffer;
    v_tracking := 'BAGODEMO' || lpad((i + 1)::text, 4, '0');

    insert into public.trips (
      user_id, trip_number, from_location, from_country, to_location, to_country,
      departure_date, arrival_date, total_kg, available_kg, sold_kg, reserved_kg,
      travel_means, price_per_kg, currency, status
    )
    values (
      v_traveler, lpad(nextval('public.trips_trip_number_seq')::text, 4, '0'),
      v_from_city, v_traveler_country, v_to_city, v_sender_country,
      now() - ((30 - i) || ' days')::interval, now() - ((25 - i) || ' days')::interval,
      v_weight + 10, 0, v_weight + 10, 0, 'flight', v_price_per_kg, v_currency2, 'completed'
    )
    returning id into v_trip_id;

    insert into public.packages (
      user_id, from_country, from_city, to_country, to_city, package_weight, declared_value,
      receiver_name, receiver_email, receiver_phone, receiver_phone_country_code,
      description, category, pickup_address, delivery_address
    )
    values (
      v_sender, v_traveler_country, v_from_city, v_sender_country, v_to_city, v_weight, v_amount * 3,
      first_names[((i + 5) % 30) + 1] || ' ' || last_names[((i + 5) % 30) + 1],
      format('receiver.%s@bago-demo-seed.internal', i), '+1555' || lpad((2000000 + i)::text, 7, '0'),
      categories[(i % 5) + 1], 'Demo package for dashboard screenshot',
      'Demo pickup address', 'Demo delivery address'
    )
    returning id into v_package_id;

    insert into public.shipment_requests (
      sender_id, traveler_id, package_id, trip_id, amount, currency, tracking_number,
      insurance, insurance_cost, estimated_departure, estimated_arrival,
      terms_accepted, terms_accepted_at, payment_info, insurance_status,
      traveler_payout, platform_commission, processing_fee, fx_buffer,
      sender_shipping_fee, bago_net_revenue, status, sender_received
    )
    values (
      v_sender, v_traveler, v_package_id, v_trip_id, v_amount, v_currency2, v_tracking,
      false, 0, now() - ((25 - i) || ' days')::interval, now() - ((20 - i) || ' days')::interval,
      true, timezone('utc', now()),
      jsonb_build_object('gateway', 'flutterwave', 'method', 'card', 'demo', true), 'not_selected',
      v_traveler_payout, v_platform_commission, v_processing_fee, v_fx_buffer,
      v_amount, v_bago_net_revenue, 'completed', true
    )
    returning id into v_request_id;

    insert into public.shipment_ledgers (
      shipment_id, sender_id, traveler_id, payment_provider, payment_reference,
      payment_currency, payment_amount, bago_commission_amount, payment_processing_fee,
      insurance_fee, currency_conversion_fee_or_margin, traveler_earning_amount,
      traveler_wallet_currency, exchange_rate_used, converted_traveler_earning,
      escrow_status, payout_status, wallet_credit_created
    )
    values (
      v_request_id, v_sender, v_traveler, 'flutterwave', 'demo-ref-' || v_tracking,
      v_currency2, v_amount, v_platform_commission, v_processing_fee,
      0, v_fx_buffer, v_traveler_payout,
      v_currency2, 1, v_traveler_payout,
      'released', 'not_available', false
    );
  end loop;

  raise notice '10 completed shipments seeded. Refresh the admin dashboard.';
end $$;
