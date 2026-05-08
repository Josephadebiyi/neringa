/**
 * One-time migration: copy historical shipment requests from MongoDB → PostgreSQL.
 *
 * Run once:
 *   node scripts/migrate_mongodb_to_postgres.js
 *
 * The script is idempotent — it skips any request whose MongoDB _id already
 * appears in the shipment_requests.mongo_id column (added on first run).
 *
 * Requires:
 *   MONGODB_URI   – your Atlas / Mongo connection string
 *   DATABASE_URL  – Supabase / Postgres connection string  (or SUPABASE_DB_URL)
 */

import mongoose from 'mongoose';
import pg from 'pg';
import dotenv from 'dotenv';

import User from '../models/userScheme.js';
import Package from '../models/PackageScheme.js';
import Request from '../models/RequestScheme.js';

dotenv.config();

const { Pool } = pg;

// ── helpers ──────────────────────────────────────────────────────────────────

function log(msg) {
  process.stdout.write(`[migrate] ${msg}\n`);
}

function safe(val, fallback = null) {
  if (val == null) return fallback;
  const s = String(val).trim();
  return s === '' ? fallback : s;
}

// ── main ─────────────────────────────────────────────────────────────────────

async function run() {
  // 1. Connect MongoDB
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) throw new Error('MONGODB_URI not set');
  log('Connecting to MongoDB...');
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });
  log('MongoDB connected');

  // 2. Connect PostgreSQL
  const pgUri = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
  if (!pgUri) throw new Error('DATABASE_URL (or SUPABASE_DB_URL) not set');
  log('Connecting to PostgreSQL...');
  const pool = new Pool({ connectionString: pgUri, ssl: { rejectUnauthorized: false } });
  log('PostgreSQL connected');

  // 3. Ensure mongo_id column exists in shipment_requests (idempotency key)
  await pool.query(`
    alter table public.shipment_requests
    add column if not exists mongo_id text unique;
  `);
  log('mongo_id column ready');

  // 4. Also ensure packages table has mongo_id for idempotency
  await pool.query(`
    alter table public.packages
    add column if not exists mongo_id text unique;
  `);

  // 5. Build email → pg_uuid lookup for profiles
  const pgProfiles = await pool.query(
    `select id, email from public.profiles`
  );
  const emailToUuid = {};
  for (const row of pgProfiles.rows) {
    emailToUuid[row.email.toLowerCase().trim()] = row.id;
  }
  log(`Loaded ${pgProfiles.rows.length} PG profiles`);

  // 6. Load all MongoDB requests
  const mongoRequests = await Request.find({})
    .populate('sender traveler package trip')
    .lean();
  log(`Found ${mongoRequests.length} MongoDB requests`);

  let migrated = 0;
  let skipped = 0;
  let failed = 0;

  for (const req of mongoRequests) {
    const mongoId = String(req._id);

    try {
      // Already migrated?
      const exists = await pool.query(
        `select 1 from public.shipment_requests where mongo_id = $1`,
        [mongoId]
      );
      if (exists.rows.length > 0) { skipped++; continue; }

      // Resolve PG UUIDs for sender and traveler via email
      const senderEmail = req.sender?.email?.toLowerCase().trim();
      const travelerEmail = req.traveler?.email?.toLowerCase().trim();

      const senderUuid = senderEmail ? emailToUuid[senderEmail] : null;
      const travelerUuid = travelerEmail ? emailToUuid[travelerEmail] : null;

      if (!senderUuid) {
        log(`SKIP ${mongoId}: sender email '${senderEmail}' not in PG profiles`);
        skipped++;
        continue;
      }
      if (!travelerUuid) {
        log(`SKIP ${mongoId}: traveler email '${travelerEmail}' not in PG profiles`);
        skipped++;
        continue;
      }

      // Migrate package (if not already migrated)
      let pgPackageId = null;
      if (req.package) {
        const pkgMongoId = String(req.package._id);
        const pkgExists = await pool.query(
          `select id from public.packages where mongo_id = $1`,
          [pkgMongoId]
        );
        if (pkgExists.rows.length > 0) {
          pgPackageId = pkgExists.rows[0].id;
        } else {
          const pkg = req.package;
          const pkgInsert = await pool.query(
            `insert into public.packages (
              user_id, from_country, from_city, to_country, to_city,
              package_weight, declared_value, receiver_name, receiver_email,
              receiver_phone, description, category, image_url,
              is_restricted, created_at, updated_at, mongo_id
            ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
            returning id`,
            [
              senderUuid,
              safe(pkg.fromCountry, ''),
              safe(pkg.fromCity, ''),
              safe(pkg.toCountry, ''),
              safe(pkg.toCity, ''),
              Number(pkg.packageWeight) || 0,
              Number(pkg.value) || 0,
              safe(pkg.receiverName, ''),
              safe(pkg.receiverEmail),
              safe(pkg.receiverPhone, ''),
              safe(pkg.description, ''),
              safe(pkg.category, 'other'),
              safe(pkg.image),
              pkg.isRestricted === true,
              pkg.createdAt || new Date(),
              pkg.createdAt || new Date(),
              pkgMongoId,
            ]
          );
          pgPackageId = pkgInsert.rows[0].id;
        }
      }

      // Insert shipment request
      await pool.query(
        `insert into public.shipment_requests (
          sender_id, traveler_id, package_id,
          amount, currency, insurance, insurance_cost,
          status, tracking_number, image_url,
          sender_proof_url, traveler_proof_url, sender_received,
          estimated_departure, estimated_arrival,
          terms_accepted, terms_accepted_at,
          payment_info, created_at, updated_at, mongo_id
        ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)`,
        [
          senderUuid,
          travelerUuid,
          pgPackageId,
          Number(req.amount) || 0,
          safe(req.currency, 'USD'),
          req.insurance === true,
          Number(req.insuranceCost) || 0,
          safe(req.status, 'pending'),
          safe(req.trackingNumber),
          safe(req.image),
          safe(req.senderProof),
          safe(req.travelerProof),
          req.senderReceived === true,
          req.estimatedDeparture || null,
          req.estimatedArrival || null,
          req.termsAccepted === true,
          req.termsAcceptedAt || null,
          req.paymentInfo ? JSON.stringify(req.paymentInfo) : null,
          req.createdAt || new Date(),
          req.updatedAt || new Date(),
          mongoId,
        ]
      );

      migrated++;
      if (migrated % 10 === 0) log(`Progress: ${migrated} migrated so far...`);

    } catch (err) {
      log(`ERROR on ${mongoId}: ${err.message}`);
      failed++;
    }
  }

  log(`\nDone: ${migrated} migrated, ${skipped} skipped, ${failed} failed`);

  await mongoose.connection.close();
  await pool.end();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
