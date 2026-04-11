import bcrypt from 'bcrypt';

import { query, queryOne } from './db.js';

function normalizeAdmin(row) {
  if (!row) return null;
  return {
    ...row,
    _id: row.id,
    id: row.id,
    userName: row.username,
    passwordHash: row.password_hash,
    fullName: row.full_name,
  };
}

export async function findAdminById(id) {
  const row = await queryOne(
    `
      select id, username, email, full_name, password_hash, role, is_active, last_login_at, created_at, updated_at
      from public.admin_users
      where id = $1
    `,
    [id],
  );
  return normalizeAdmin(row);
}

export async function findAdminByLogin(loginIdentifier) {
  const row = await queryOne(
    `
      select id, username, email, full_name, password_hash, role, is_active, last_login_at, created_at, updated_at
      from public.admin_users
      where lower(username) = lower($1) or lower(email) = lower($1)
    `,
    [loginIdentifier],
  );
  return normalizeAdmin(row);
}

export async function createAdminUser({ username, email, fullName, password, role = 'SUPER_ADMIN' }) {
  const passwordHash = await bcrypt.hash(password, 10);
  const row = await queryOne(
    `
      insert into public.admin_users (username, email, full_name, password_hash, role, is_active)
      values ($1, $2, $3, $4, $5, true)
      returning id, username, email, full_name, password_hash, role, is_active, last_login_at, created_at, updated_at
    `,
    [username, email, fullName, passwordHash, role],
  );
  return normalizeAdmin(row);
}

export async function verifyAdminPassword(admin, password) {
  if (!admin?.passwordHash) return false;
  return bcrypt.compare(password, admin.passwordHash);
}

export async function touchAdminLogin(id) {
  await query(
    `update public.admin_users set last_login_at = timezone('utc', now()) where id = $1`,
    [id],
  );
}
