/**
 * One-off demo-data seeder for admin dashboard screenshots.
 *
 * Creates 30 tagged demo users (signup_source = DEMO_TAG) and 10 completed
 * shipments between them (trips + packages + shipment_requests +
 * shipment_ledgers), so the admin dashboard shows non-zero stats.
 *
 * Every row this script creates is reachable from the 30 demo profiles —
 * no real user or existing data is touched. Run cleanup_demo_dashboard_data.js
 * to remove everything it created, in one shot.
 *
 * Usage:
 *   DATABASE_URL="postgres://..." node scripts/seed_demo_dashboard_data.js
 *   (or set SUPABASE_DB_URL — either env var works)
 */

import pg from 'pg';
import bcrypt from 'bcryptjs';

const { Pool } = pg;

const CONNECTION_STRING = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
if (!CONNECTION_STRING) {
  console.error('Set DATABASE_URL or SUPABASE_DB_URL before running this script.');
  process.exit(1);
}

export const DEMO_TAG = 'demo_seed_20260714';
const DEMO_EMAIL_DOMAIN = 'bago-demo-seed.internal';
const DEMO_PASSWORD = 'DemoSeed!2026'; // not a real login path for anyone — internal-only email domain

const pool = new Pool({
  connectionString: CONNECTION_STRING,
  ssl: { rejectUnauthorized: false },
});

const FIRST_NAMES = [
  'Ade', 'Bola', 'Chidi', 'Dara', 'Efe', 'Femi', 'Grace', 'Hassan', 'Ifeoma', 'Jide',
  'Kemi', 'Lola', 'Musa', 'Nneka', 'Obi', 'Peju', 'Quincy', 'Remi', 'Sade', 'Tunde',
  'Uche', 'Vera', 'Wale', 'Xola', 'Yemi', 'Zara', 'Amara', 'Bayo', 'Chioma', 'Deji',
];
const LAST_NAMES = [
  'Okafor', 'Adeyemi', 'Mensah', 'Osei', 'Kariuki', 'Ndlovu', 'Abara', 'Bello', 'Chukwu', 'Diallo',
  'Eze', 'Fatunde', 'Gyasi', 'Haruna', 'Ibe', 'Jallow', 'Kamau', 'Lawal', 'Mwangi', 'Nwosu',
  'Oduya', 'Peters', 'Quaye', 'Rahman', 'Sesay', 'Toure', 'Umeh', 'Vance', 'Wanjiru', 'Yusuf',
];
const COUNTRIES = [
  { country: 'NG', currency: 'NGN' },
  { country: 'GH', currency: 'GHS' },
  { country: 'KE', currency: 'KES' },
  { country: 'ZA', currency: 'ZAR' },
  { country: 'DE', currency: 'EUR' },
  { country: 'FR', currency: 'EUR' },
  { country: 'GB', currency: 'GBP' },
  { country: 'US', currency: 'USD' },
];
const CITIES = {
  NG: ['Lagos', 'Abuja'], GH: ['Accra', 'Kumasi'], KE: ['Nairobi', 'Mombasa'],
  ZA: ['Johannesburg', 'Cape Town'], DE: ['Berlin', 'Munich'], FR: ['Paris', 'Lyon'],
  GB: ['London', 'Manchester'], US: ['New York', 'Atlanta'],
};
const CATEGORIES = ['Electronics', 'Documents', 'Clothing', 'Gifts', 'Books'];

function pick(arr, i) {
  return arr[i % arr.length];
}

async function main() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
    const userIds = [];

    console.log(`Seeding 30 demo profiles tagged signup_source='${DEMO_TAG}'...`);
    for (let i = 0; i < 30; i += 1) {
      const first = pick(FIRST_NAMES, i);
      const last = pick(LAST_NAMES, i);
      const { country, currency } = pick(COUNTRIES, i);
      const email = `demo.${first}.${last}.${i}@${DEMO_EMAIL_DOMAIN}`.toLowerCase();

      // Check-then-insert rather than ON CONFLICT — we can't confirm a unique
      // constraint on profiles.email exists without direct schema access, and
      // this works regardless.
      const existing = await client.query(
        `select id from public.profiles where email = $1 limit 1`,
        [email],
      );
      let userId = existing.rows[0]?.id;
      if (!userId) {
        const result = await client.query(
          `
            insert into public.profiles (
              email, first_name, last_name, phone, password_hash, country,
              date_of_birth, payment_gateway, preferred_currency, earning_currency,
              signup_method, signup_source, email_verified, status,
              kyc_status, kyc_verified_at, account_status
            )
            values ($1,$2,$3,$4,$5,$6,$7,'flutterwave',$8,$8,'email',$9,true,'verified','approved',timezone('utc', now()),'active')
            returning id
          `,
          [
            email, first, last, `+1555${String(1000000 + i).slice(-7)}`, passwordHash, country,
            '1995-01-01', currency, DEMO_TAG,
          ],
        );
        userId = result.rows[0].id;
      }
      userIds.push({ id: userId, country, currency, first, last });

      await client.query(
        `
          insert into public.wallet_accounts (user_id, available_balance, escrow_balance, currency)
          values ($1, 0, 0, $2)
          on conflict (user_id) do nothing
        `,
        [userId, currency],
      );
    }
    console.log(`✅ ${userIds.length} demo profiles ready.`);

    console.log('Seeding 10 completed shipments (trip + package + request + ledger)...');
    let completedCount = 0;
    for (let i = 0; i < 10; i += 1) {
      const traveler = userIds[i];
      const sender = userIds[i + 15]; // disjoint half of the pool, so sender != traveler
      const fromCity = pick(CITIES[traveler.country], i);
      const toCity = pick(CITIES[sender.country], i + 1);
      const pricePerKg = 8 + (i % 5) * 2;
      const weight = 2 + (i % 4);
      const amount = Number((pricePerKg * weight * 1.35).toFixed(2)); // sender-side price incl. markup
      const travelerPayout = Number((pricePerKg * weight).toFixed(2));
      const platformCommission = Number((amount * 0.12).toFixed(2));
      const processingFee = Number((amount * 0.03).toFixed(2));
      const fxBuffer = Number((amount * 0.01).toFixed(2));
      const bagoNetRevenue = Number((platformCommission + processingFee + fxBuffer).toFixed(2));
      const currency = traveler.currency;

      const tripResult = await client.query(
        `
          insert into public.trips (
            user_id, trip_number, from_location, from_country, to_location, to_country,
            departure_date, arrival_date, total_kg, available_kg, sold_kg, reserved_kg,
            travel_means, price_per_kg, currency, status
          )
          values ($1, lpad(nextval('public.trips_trip_number_seq')::text, 4, '0'),
                  $2,$3,$4,$5,$6,$7,$8,0,$8,0,'flight',$9,$10,'completed')
          returning id
        `,
        [
          traveler.id, fromCity, traveler.country, toCity, sender.country,
          new Date(Date.now() - (30 - i) * 86400000), new Date(Date.now() - (25 - i) * 86400000),
          weight + 10, pricePerKg, currency,
        ],
      );
      const tripId = tripResult.rows[0].id;

      const packageResult = await client.query(
        `
          insert into public.packages (
            user_id, from_country, from_city, to_country, to_city, package_weight, declared_value,
            receiver_name, receiver_email, receiver_phone, receiver_phone_country_code,
            description, category, pickup_address, delivery_address
          )
          values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'+1','Demo package for dashboard screenshot',$11,'Demo pickup address','Demo delivery address')
          returning id
        `,
        [
          sender.id, traveler.country, fromCity, sender.country, toCity, weight, amount * 3,
          `${pick(FIRST_NAMES, i + 5)} ${pick(LAST_NAMES, i + 5)}`,
          `receiver.${i}@${DEMO_EMAIL_DOMAIN}`, `+1555${String(2000000 + i).slice(-7)}`,
          pick(CATEGORIES, i),
        ],
      );
      const packageId = packageResult.rows[0].id;

      const trackingNumber = `BAGODEMO${String(i + 1).padStart(4, '0')}`;
      const requestResult = await client.query(
        `
          insert into public.shipment_requests (
            sender_id, traveler_id, package_id, trip_id, amount, currency, tracking_number,
            insurance, insurance_cost, estimated_departure, estimated_arrival,
            terms_accepted, terms_accepted_at, payment_info, insurance_status,
            traveler_payout, platform_commission, processing_fee, fx_buffer,
            sender_shipping_fee, bago_net_revenue, status, sender_received
          )
          values ($1,$2,$3,$4,$5,$6,$7,false,0,$8,$9,true,timezone('utc', now()),$10,'not_selected',
                  $11,$12,$13,$14,$5,$15,'completed',true)
          returning id
        `,
        [
          sender.id, traveler.id, packageId, tripId, amount, currency, trackingNumber,
          new Date(Date.now() - (25 - i) * 86400000), new Date(Date.now() - (20 - i) * 86400000),
          JSON.stringify({ gateway: 'flutterwave', method: 'card', demo: true }),
          travelerPayout, platformCommission, processingFee, fxBuffer, bagoNetRevenue,
        ],
      );
      const requestId = requestResult.rows[0].id;

      await client.query(
        `
          insert into public.shipment_ledgers (
            shipment_id, sender_id, traveler_id, payment_provider, payment_reference,
            payment_currency, payment_amount, bago_commission_amount, payment_processing_fee,
            insurance_fee, currency_conversion_fee_or_margin, traveler_earning_amount,
            traveler_wallet_currency, exchange_rate_used, converted_traveler_earning,
            escrow_status, payout_status, wallet_credit_created
          )
          values ($1,$2,$3,'flutterwave',$4,$5,$6,$7,$8,0,$9,$10,$5,1,$10,'released','not_available',false)
        `,
        [
          requestId, sender.id, traveler.id, `demo-ref-${trackingNumber}`,
          currency, amount, platformCommission, processingFee, fxBuffer, travelerPayout,
        ],
      );

      completedCount += 1;
    }

    await client.query('COMMIT');
    console.log(`✅ ${completedCount} completed shipments seeded.`);
    console.log('\nDone. Refresh the admin dashboard to see the new numbers.');
    console.log(`\nTo remove all of this later, run:\n  node scripts/cleanup_demo_dashboard_data.js`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed, rolled back:', error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();
