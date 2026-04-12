import bcrypt from 'bcrypt';
import { queryOne } from '../../lib/postgres/db.js';
import { resend } from '../../server.js';

const buildOtpEmail = ({ fullName, otp, pendingEmail }) => `
  <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937">
    <h2>Admin Credential Change Verification</h2>
    <p>Hello ${fullName || 'Admin'},</p>
    <p>We received a request to update your admin login details.</p>
    <p>Requested new email: <strong>${pendingEmail}</strong></p>
    <p>Use this verification code to complete the change:</p>
    <div style="font-size:32px;font-weight:800;letter-spacing:8px;color:#5240e8;margin:24px 0;">${otp}</div>
    <p>This code expires in 10 minutes.</p>
    <p>If you did not request this change, ignore this email and review admin access immediately.</p>
  </div>
`;

export const requestAdminCredentialChange = async (req, res) => {
  try {
    const admin = req.admin;
    const { currentPassword, newEmail, newPassword } = req.body;

    if (!admin) return res.status(401).json({ success: false, message: 'Admin not authenticated' });
    if (!currentPassword || !newEmail || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current password, new email, and new password are required' });
    }

    const normalizedEmail = String(newEmail).trim().toLowerCase();
    if (!normalizedEmail.includes('@')) {
      return res.status(400).json({ success: false, message: 'Enter a valid email address' });
    }
    if (String(newPassword).trim().length < 7) {
      return res.status(400).json({ success: false, message: 'New password must be at least 7 characters' });
    }

    // Verify current password
    const fullAdmin = await queryOne(
      `SELECT id, email, full_name, password_hash FROM public.admin_users WHERE id = $1`, [admin.id]
    );
    const matches = await bcrypt.compare(currentPassword, fullAdmin.password_hash);
    if (!matches) return res.status(401).json({ success: false, message: 'Current password is incorrect' });

    const emailTaken = await queryOne(
      `SELECT id FROM public.admin_users WHERE lower(email) = $1 AND id != $2`,
      [normalizedEmail, admin.id]
    );
    if (emailTaken) return res.status(400).json({ success: false, message: 'That email is already used by another admin account' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const pendingPasswordHash = await bcrypt.hash(String(newPassword).trim(), 12);

    await queryOne(
      `UPDATE public.admin_users SET
         credential_change_otp = $1,
         credential_change_otp_expires = $2,
         pending_email = $3,
         pending_password_hash = $4
       WHERE id = $5`,
      [otp, expiresAt, normalizedEmail, pendingPasswordHash, admin.id]
    );

    if (resend) {
      await resend.emails.send({
        from: process.env.EMAIL_FROM || 'Bago Admin <no-reply@sendwithbago.com>',
        to: fullAdmin.email,
        subject: 'Verify your Bago admin credential change',
        html: buildOtpEmail({ fullName: fullAdmin.full_name, otp, pendingEmail: normalizedEmail }),
      });
    } else {
      console.log(`Admin credential change OTP for ${fullAdmin.email}: ${otp}`);
    }

    return res.status(200).json({
      success: true,
      message: resend ? `Verification code sent to ${fullAdmin.email}` : 'Verification code generated. Check backend logs.',
    });
  } catch (error) {
    console.error('requestAdminCredentialChange error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to request credential change' });
  }
};

export const verifyAdminCredentialChange = async (req, res) => {
  try {
    const admin = req.admin;
    const { otp } = req.body;

    if (!admin) return res.status(401).json({ success: false, message: 'Admin not authenticated' });
    if (!otp) return res.status(400).json({ success: false, message: 'Verification code is required' });

    const fullAdmin = await queryOne(
      `SELECT id, email, username, credential_change_otp, credential_change_otp_expires,
              pending_email, pending_password_hash
       FROM public.admin_users WHERE id = $1`,
      [admin.id]
    );

    if (!fullAdmin.credential_change_otp || !fullAdmin.pending_email) {
      return res.status(400).json({ success: false, message: 'No pending credential change found' });
    }
    if (new Date(fullAdmin.credential_change_otp_expires) < new Date()) {
      await queryOne(`UPDATE public.admin_users SET credential_change_otp = NULL WHERE id = $1`, [admin.id]);
      return res.status(400).json({ success: false, message: 'Verification code has expired' });
    }
    if (String(fullAdmin.credential_change_otp) !== String(otp).trim()) {
      return res.status(400).json({ success: false, message: 'Invalid verification code' });
    }

    await queryOne(
      `UPDATE public.admin_users SET
         email = $1, password_hash = $2,
         credential_change_otp = NULL, credential_change_otp_expires = NULL,
         pending_email = NULL, pending_password_hash = NULL
       WHERE id = $3`,
      [fullAdmin.pending_email, fullAdmin.pending_password_hash, admin.id]
    );

    return res.status(200).json({
      success: true,
      message: 'Admin login credentials updated successfully',
      admin: { id: admin.id, username: fullAdmin.username, email: fullAdmin.pending_email },
    });
  } catch (error) {
    console.error('verifyAdminCredentialChange error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to verify credential change' });
  }
};
