import bcrypt from 'bcryptjs';
import cloudinary from 'cloudinary';
import { query, queryOne } from '../../lib/postgres/db.js';

async function ensureProfileImageColumn() {
  await query(`
    ALTER TABLE public.admin_users
    ADD COLUMN IF NOT EXISTS profile_image TEXT
  `).catch(() => {});
}

export const getAdminProfile = async (req, res) => {
  try {
    const admin = await queryOne(
      `SELECT id, username, email, full_name as "fullName", role, profile_image as "profileImage",
              support_presence as "supportPresence", is_active as "isActive"
       FROM public.admin_users WHERE id = $1`,
      [req.admin.id]
    );
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });
    res.json({ success: true, data: admin });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateAdminProfile = async (req, res) => {
  try {
    await ensureProfileImageColumn();
    const { fullName, email, username, currentPassword, newPassword } = req.body;
    const fields = [];
    const values = [];
    let idx = 1;

    // Validate current password if changing password or sensitive fields
    if (newPassword || email || username) {
      const row = await queryOne(
        `SELECT password_hash FROM public.admin_users WHERE id = $1`,
        [req.admin.id]
      );
      if (!currentPassword) {
        return res.status(400).json({ success: false, message: 'Current password is required to change login details.' });
      }
      const valid = await bcrypt.compare(currentPassword, row.password_hash);
      if (!valid) {
        return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
      }
    }

    if (fullName !== undefined) { fields.push(`full_name = $${idx++}`); values.push(fullName.trim()); }
    if (email !== undefined)    { fields.push(`email = $${idx++}`);     values.push(email.trim().toLowerCase()); }
    if (username !== undefined) { fields.push(`username = $${idx++}`);  values.push(username.trim()); }

    if (newPassword) {
      if (newPassword.length < 8) {
        return res.status(400).json({ success: false, message: 'New password must be at least 8 characters.' });
      }
      const hash = await bcrypt.hash(newPassword, 12);
      fields.push(`password_hash = $${idx++}`);
      values.push(hash);
    }

    // Profile image upload
    if (req.file) {
      const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.v2.uploader.upload_stream(
          { folder: 'bago_admin_profiles', resource_type: 'image', transformation: [{ width: 300, height: 300, crop: 'fill', gravity: 'face' }] },
          (err, result) => err ? reject(err) : resolve(result)
        );
        stream.end(req.file.buffer);
      });
      fields.push(`profile_image = $${idx++}`);
      values.push(uploadResult.secure_url);
    }

    if (!fields.length) {
      return res.status(400).json({ success: false, message: 'No fields to update.' });
    }

    fields.push(`updated_at = NOW()`);
    values.push(req.admin.id);

    const updated = await queryOne(
      `UPDATE public.admin_users SET ${fields.join(', ')}
       WHERE id = $${idx}
       RETURNING id, username, email, full_name as "fullName", role, profile_image as "profileImage"`,
      values
    );

    res.json({ success: true, data: updated, message: 'Profile updated successfully.' });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ success: false, message: 'Email or username already in use.' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};
