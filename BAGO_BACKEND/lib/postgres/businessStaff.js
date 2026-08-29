import bcrypt from 'bcrypt';
import { query, queryOne } from './db.js';

export const MAX_STAFF_PER_BUSINESS = 5;

function normalizeStaff(row) {
  if (!row) return null;
  return {
    id: row.id,
    businessProfileId: row.business_profile_id,
    email: row.email,
    fullName: row.full_name,
    permissions: Array.isArray(row.permissions) ? row.permissions : [],
    isActive: row.is_active,
    lastLoginAt: row.last_login_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listStaffForBusiness(businessProfileId) {
  const result = await query(
    `select id, business_profile_id, email, full_name, permissions, is_active, last_login_at, created_at, updated_at
     from public.business_staff_accounts
     where business_profile_id = $1
     order by created_at asc`,
    [businessProfileId],
  );
  return result.rows.map(normalizeStaff);
}

export async function countActiveStaffForBusiness(businessProfileId) {
  const row = await queryOne(
    `select count(*)::int as total from public.business_staff_accounts where business_profile_id = $1 and is_active = true`,
    [businessProfileId],
  );
  return row?.total || 0;
}

export async function findStaffById(id) {
  const row = await queryOne(
    `select id, business_profile_id, email, password_hash, full_name, permissions, is_active, last_login_at, created_at, updated_at
     from public.business_staff_accounts
     where id = $1`,
    [id],
  );
  return row ? { ...normalizeStaff(row), passwordHash: row.password_hash } : null;
}

export async function findStaffByEmail(email) {
  const row = await queryOne(
    `select id, business_profile_id, email, password_hash, full_name, permissions, is_active, last_login_at, created_at, updated_at
     from public.business_staff_accounts
     where lower(trim(email)) = lower(trim($1))`,
    [email],
  );
  return row ? { ...normalizeStaff(row), passwordHash: row.password_hash } : null;
}

export async function createStaffAccount({ businessProfileId, email, password, fullName, permissions = [] }) {
  const existing = await findStaffByEmail(email);
  if (existing) {
    const error = new Error('A staff account with this email already exists.');
    error.code = 'EMAIL_TAKEN';
    throw error;
  }
  const activeCount = await countActiveStaffForBusiness(businessProfileId);
  if (activeCount >= MAX_STAFF_PER_BUSINESS) {
    const error = new Error(`A business can have at most ${MAX_STAFF_PER_BUSINESS} active staff accounts.`);
    error.code = 'STAFF_LIMIT_REACHED';
    throw error;
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const row = await queryOne(
    `insert into public.business_staff_accounts (business_profile_id, email, password_hash, full_name, permissions)
     values ($1, $2, $3, $4, $5)
     returning id, business_profile_id, email, full_name, permissions, is_active, last_login_at, created_at, updated_at`,
    [businessProfileId, email.trim().toLowerCase(), passwordHash, fullName || null, JSON.stringify(permissions)],
  );
  return normalizeStaff(row);
}

export async function updateStaffAccount(id, businessProfileId, updates) {
  const fields = [];
  const values = [];
  let index = 1;

  if (updates.fullName !== undefined) { fields.push(`full_name = $${index++}`); values.push(updates.fullName); }
  if (updates.permissions !== undefined) { fields.push(`permissions = $${index++}`); values.push(JSON.stringify(updates.permissions)); }
  if (updates.isActive !== undefined) { fields.push(`is_active = $${index++}`); values.push(Boolean(updates.isActive)); }
  if (updates.password) {
    const passwordHash = await bcrypt.hash(updates.password, 12);
    fields.push(`password_hash = $${index++}`);
    values.push(passwordHash);
  }

  if (!fields.length) return findStaffById(id);

  values.push(id, businessProfileId);
  const row = await queryOne(
    `update public.business_staff_accounts
     set ${fields.join(', ')}, updated_at = timezone('utc', now())
     where id = $${index} and business_profile_id = $${index + 1}
     returning id, business_profile_id, email, full_name, permissions, is_active, last_login_at, created_at, updated_at`,
    values,
  );
  return normalizeStaff(row);
}

export async function deleteStaffAccount(id, businessProfileId) {
  const row = await queryOne(
    `delete from public.business_staff_accounts where id = $1 and business_profile_id = $2 returning id`,
    [id, businessProfileId],
  );
  return Boolean(row);
}

export async function verifyStaffPassword(staff, password) {
  if (!staff?.passwordHash) return false;
  return bcrypt.compare(password, staff.passwordHash);
}

export async function touchStaffLogin(id) {
  await query(`update public.business_staff_accounts set last_login_at = timezone('utc', now()) where id = $1`, [id]);
}
