import crypto from 'crypto';
import { query, queryOne } from './db.js';

// Auto-creates table on first use (same pattern as adminSessions.js)
let tableReady = false;
async function ensureTable() {
  if (tableReady) return;
  await query(`
    CREATE TABLE IF NOT EXISTS public.user_refresh_tokens (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
      token_hash  TEXT NOT NULL UNIQUE,
      device_hint TEXT,
      expires_at  TIMESTAMPTZ NOT NULL,
      revoked_at  TIMESTAMPTZ,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
    )
  `);
  await query(`CREATE INDEX IF NOT EXISTS idx_urt_user_id ON public.user_refresh_tokens (user_id)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_urt_hash    ON public.user_refresh_tokens (token_hash)`);
  tableReady = true;
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function storeRefreshToken(userId, rawToken, expiresInDays = 30, deviceHint = null) {
  await ensureTable();
  const hash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);
  await query(
    `INSERT INTO public.user_refresh_tokens (user_id, token_hash, device_hint, expires_at)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (token_hash) DO NOTHING`,
    [userId, hash, deviceHint, expiresAt.toISOString()],
  );
}

export async function validateRefreshToken(rawToken) {
  await ensureTable();
  const hash = hashToken(rawToken);
  const row = await queryOne(
    `SELECT id, user_id FROM public.user_refresh_tokens
     WHERE token_hash = $1
       AND revoked_at IS NULL
       AND expires_at > timezone('utc', now())`,
    [hash],
  );
  return row || null;
}

export async function revokeRefreshToken(rawToken) {
  await ensureTable();
  const hash = hashToken(rawToken);
  await query(
    `UPDATE public.user_refresh_tokens
     SET revoked_at = timezone('utc', now())
     WHERE token_hash = $1`,
    [hash],
  );
}

export async function revokeAllUserTokens(userId) {
  await ensureTable();
  await query(
    `UPDATE public.user_refresh_tokens
     SET revoked_at = timezone('utc', now())
     WHERE user_id = $1 AND revoked_at IS NULL`,
    [userId],
  );
}

export async function pruneExpiredTokens() {
  await ensureTable();
  await query(
    `DELETE FROM public.user_refresh_tokens
     WHERE expires_at < timezone('utc', now()) - INTERVAL '1 day'`,
  );
}
