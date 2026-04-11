import { createClient } from '@supabase/supabase-js';
import pg from 'pg';

const { Pool } = pg;

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const SUPABASE_DB_URL = process.env.SUPABASE_DB_URL || '';

const hasClientCredentials = Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);
const hasDatabaseCredentials = Boolean(SUPABASE_DB_URL);
const hasServiceRoleCredentials = Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);

export const isSupabaseServerConfigured = () =>
  hasClientCredentials && hasDatabaseCredentials;

export const isSupabaseStorageConfigured = () => hasServiceRoleCredentials;

export function assertSupabaseServerConfig() {
  if (!hasClientCredentials) {
    throw new Error(
      'Supabase client config is incomplete. Expected SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY.',
    );
  }
}

export function createSupabaseUserClient(accessToken) {
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    throw new Error('Supabase client config is incomplete for token verification.');
  }

  return createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}

let serviceRoleClient = null;

export function getSupabaseServiceRoleClient() {
  if (!hasServiceRoleCredentials) {
    throw new Error(
      'Supabase storage upload requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.',
    );
  }

  if (!serviceRoleClient) {
    serviceRoleClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return serviceRoleClient;
}

let pool = null;

export function getPostgresPool() {
  if (!SUPABASE_DB_URL) {
    throw new Error('SUPABASE_DB_URL is not configured.');
  }

  if (!pool) {
    pool = new Pool({
      connectionString: SUPABASE_DB_URL,
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
    });
  }

  return pool;
}
