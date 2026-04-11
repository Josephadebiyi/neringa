import { getPostgresPool } from '../supabase/client.js';

export async function query(text, params = []) {
  const pool = getPostgresPool();
  return pool.query(text, params);
}

export async function withTransaction(work) {
  const pool = getPostgresPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function queryOne(text, params = []) {
  const result = await query(text, params);
  return result.rows[0] ?? null;
}
