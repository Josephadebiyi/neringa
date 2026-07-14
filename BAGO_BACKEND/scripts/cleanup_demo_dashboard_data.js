/**
 * Removes everything created by seed_demo_dashboard_data.js.
 *
 * Deletes in FK-safe order using only rows reachable from profiles tagged
 * signup_source = 'demo_seed_20260714' — never touches any other row.
 *
 * Usage:
 *   DATABASE_URL="postgres://..." node scripts/cleanup_demo_dashboard_data.js
 *   (or set SUPABASE_DB_URL — either env var works)
 */

import pg from 'pg';

const { Pool } = pg;

const CONNECTION_STRING = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
if (!CONNECTION_STRING) {
  console.error('Set DATABASE_URL or SUPABASE_DB_URL before running this script.');
  process.exit(1);
}

const DEMO_TAG = 'demo_seed_20260714';

const pool = new Pool({
  connectionString: CONNECTION_STRING,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const demoUsers = await client.query(
      `select id from public.profiles where signup_source = $1`,
      [DEMO_TAG],
    );
    const userIds = demoUsers.rows.map((r) => r.id);
    console.log(`Found ${userIds.length} demo profiles tagged '${DEMO_TAG}'.`);

    if (userIds.length === 0) {
      console.log('Nothing to clean up.');
      await client.query('ROLLBACK');
      return;
    }

    const requestIds = (
      await client.query(
        `select id from public.shipment_requests where sender_id = any($1) or traveler_id = any($1)`,
        [userIds],
      )
    ).rows.map((r) => r.id);

    const ledgerDeleted = await client.query(
      `delete from public.shipment_ledgers where shipment_id = any($1)`,
      [requestIds],
    );
    console.log(`Deleted ${ledgerDeleted.rowCount} shipment_ledgers rows.`);

    const requestsDeleted = await client.query(
      `delete from public.shipment_requests where id = any($1)`,
      [requestIds],
    );
    console.log(`Deleted ${requestsDeleted.rowCount} shipment_requests rows.`);

    const packagesDeleted = await client.query(
      `delete from public.packages where user_id = any($1)`,
      [userIds],
    );
    console.log(`Deleted ${packagesDeleted.rowCount} packages rows.`);

    const tripsDeleted = await client.query(
      `delete from public.trips where user_id = any($1)`,
      [userIds],
    );
    console.log(`Deleted ${tripsDeleted.rowCount} trips rows.`);

    const walletsDeleted = await client.query(
      `delete from public.wallet_accounts where user_id = any($1)`,
      [userIds],
    );
    console.log(`Deleted ${walletsDeleted.rowCount} wallet_accounts rows.`);

    const profilesDeleted = await client.query(
      `delete from public.profiles where id = any($1)`,
      [userIds],
    );
    console.log(`Deleted ${profilesDeleted.rowCount} profiles rows.`);

    await client.query('COMMIT');
    console.log('\n✅ Demo data fully removed.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Cleanup failed, rolled back:', error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();
