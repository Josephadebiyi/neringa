import crypto from 'crypto';

import { query, queryOne } from './db.js';

let sessionsTableReady = false;

async function ensureAdminSessionsTable() {
  if (sessionsTableReady) return;

  await query(`
    create table if not exists public.admin_sessions (
      session_token text primary key,
      admin_user_id uuid not null references public.admin_users(id) on delete cascade,
      expires_at timestamptz not null,
      created_at timestamptz not null default timezone('utc', now())
    )
  `);

  await query(`
    create index if not exists idx_admin_sessions_admin_user_id
    on public.admin_sessions (admin_user_id)
  `);

  await query(`
    create index if not exists idx_admin_sessions_expires_at
    on public.admin_sessions (expires_at)
  `);

  sessionsTableReady = true;
}

function normalizeAdminSession(row) {
  if (!row) return null;
  return {
    token: row.session_token,
    adminUserId: row.admin_user_id,
    expiresAt: row.expires_at,
    admin: row.id
      ? {
          id: row.id,
          _id: row.id,
          userName: row.username,
          username: row.username,
          email: row.email,
          fullName: row.full_name,
          role: row.role,
          is_active: row.is_active,
          created_at: row.created_at,
          updated_at: row.updated_at,
          last_login_at: row.last_login_at,
        }
      : null,
  };
}

export async function createAdminSession(adminId, ttlMs = 24 * 60 * 60 * 1000) {
  await ensureAdminSessionsTable();

  const token = crypto.randomBytes(48).toString('hex');
  const expiresAt = new Date(Date.now() + ttlMs);

  await query(
    `
      insert into public.admin_sessions (session_token, admin_user_id, expires_at)
      values ($1, $2, $3)
    `,
    [token, adminId, expiresAt.toISOString()],
  );

  return { token, expiresAt };
}

export async function findAdminSession(token) {
  if (!token) return null;

  await ensureAdminSessionsTable();

  const row = await queryOne(
    `
      select
        s.session_token,
        s.admin_user_id,
        s.expires_at,
        a.id,
        a.username,
        a.email,
        a.full_name,
        a.role,
        a.is_active,
        a.last_login_at,
        a.created_at,
        a.updated_at
      from public.admin_sessions s
      join public.admin_users a on a.id = s.admin_user_id
      where s.session_token = $1
        and s.expires_at > timezone('utc', now())
    `,
    [token],
  );

  return normalizeAdminSession(row);
}

export async function deleteAdminSession(token) {
  if (!token) return;
  await ensureAdminSessionsTable();
  await query(`delete from public.admin_sessions where session_token = $1`, [token]);
}

export async function deleteExpiredAdminSessions() {
  await ensureAdminSessionsTable();
  await query(`delete from public.admin_sessions where expires_at <= timezone('utc', now())`);
}
