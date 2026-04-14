import bcrypt from 'bcrypt';
import { query, queryOne } from '../../lib/postgres/db.js';

export const getAllStaff = async (req, res) => {
  try {
    const result = await query(
      `SELECT id, id as "_id", username, email, full_name as "fullName", role, is_active as "isActive",
              created_at as "createdAt" FROM public.admin_users ORDER BY created_at DESC`
    );
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createStaff = async (req, res) => {
  try {
    const { fullName, email, userName, password, role } = req.body;

    const existing = await queryOne(
      `SELECT id FROM public.admin_users WHERE lower(email) = lower($1) OR lower(username) = lower($2)`,
      [email || '', userName || '']
    );
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email or Username already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const newStaff = await queryOne(
      `INSERT INTO public.admin_users (username, email, full_name, password_hash, role, is_active)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING id, id as "_id", username, email, full_name as "fullName", role, is_active as "isActive"`,
      [userName, email || `${userName}@bago.com`, fullName || userName, passwordHash, role || 'admin']
    );

    res.status(201).json({ success: true, data: newStaff });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, email, userName, password, role, isActive } = req.body;

    const fields = [];
    const values = [];
    let idx = 1;

    if (fullName !== undefined) { fields.push(`full_name = $${idx++}`); values.push(fullName); }
    if (email !== undefined) { fields.push(`email = $${idx++}`); values.push(email); }
    if (userName !== undefined) { fields.push(`username = $${idx++}`); values.push(userName); }
    if (role !== undefined) { fields.push(`role = $${idx++}`); values.push(role); }
    if (isActive !== undefined) { fields.push(`is_active = $${idx++}`); values.push(isActive); }
    if (password && password.trim()) {
      const hash = await bcrypt.hash(password, 12);
      fields.push(`password_hash = $${idx++}`);
      values.push(hash);
    }

    if (!fields.length) return res.status(400).json({ success: false, message: 'No fields to update' });

    values.push(id);
    const staff = await queryOne(
      `UPDATE public.admin_users SET ${fields.join(', ')} WHERE id = $${idx}
       RETURNING id, id as "_id", username, email, full_name as "fullName", role, is_active as "isActive"`,
      values
    );

    if (!staff) return res.status(404).json({ success: false, message: 'Staff not found' });
    res.status(200).json({ success: true, data: staff });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await queryOne(
      `DELETE FROM public.admin_users WHERE id = $1 RETURNING id`, [id]
    );
    if (!deleted) return res.status(404).json({ success: false, message: 'Staff not found' });
    res.status(200).json({ success: true, message: 'Staff deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
