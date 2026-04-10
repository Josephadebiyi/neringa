import bcrypt from 'bcryptjs';
import Admin from '../../models/adminScheme.js';
import { resend } from '../../server.js';

const buildOtpEmail = ({ fullName, otp, pendingEmail }) => `
  <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937">
    <h2 style="margin-bottom:8px;">Admin Credential Change Verification</h2>
    <p>Hello ${fullName || 'Admin'},</p>
    <p>We received a request to update your admin login details.</p>
    <p>Requested new email: <strong>${pendingEmail}</strong></p>
    <p>Use this verification code to complete the change:</p>
    <div style="font-size:32px;font-weight:800;letter-spacing:8px;color:#5240e8;margin:24px 0;">
      ${otp}
    </div>
    <p>This code expires in 10 minutes.</p>
    <p>If you did not request this change, ignore this email and review admin access immediately.</p>
  </div>
`;

export const requestAdminCredentialChange = async (req, res) => {
  try {
    const admin = req.admin;
    const { currentPassword, newEmail, newPassword } = req.body;

    if (!admin) {
      return res.status(401).json({ success: false, message: 'Admin not authenticated' });
    }

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

    const matches = await admin.comparePassword(currentPassword);
    if (!matches) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    const existingAdmin = await Admin.findOne({
      email: normalizedEmail,
      _id: { $ne: admin._id },
    });
    if (existingAdmin) {
      return res.status(400).json({ success: false, message: 'That email is already used by another admin account' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const pendingPasswordHash = await bcrypt.hash(String(newPassword).trim(), 12);

    admin.credentialChangeOtp = {
      code: otp,
      expiresAt,
      pendingEmail: normalizedEmail,
      pendingPasswordHash,
    };
    await admin.save();

    if (resend) {
      await resend.emails.send({
        from: process.env.EMAIL_FROM || 'Bago Admin <no-reply@bago.app>',
        to: admin.email,
        subject: 'Verify your Bago admin credential change',
        html: buildOtpEmail({
          fullName: admin.fullName,
          otp,
          pendingEmail: normalizedEmail,
        }),
      });
    } else {
      console.log(`Admin credential change OTP for ${admin.email}: ${otp}`);
    }

    return res.status(200).json({
      success: true,
      message: resend
        ? `Verification code sent to ${admin.email}`
        : 'Verification code generated. Check backend logs because email is not configured.',
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

    if (!admin) {
      return res.status(401).json({ success: false, message: 'Admin not authenticated' });
    }

    if (!otp) {
      return res.status(400).json({ success: false, message: 'Verification code is required' });
    }

    const pending = admin.credentialChangeOtp;
    if (!pending?.code || !pending?.expiresAt || !pending?.pendingEmail || !pending?.pendingPasswordHash) {
      return res.status(400).json({ success: false, message: 'No pending credential change found' });
    }

    if (pending.expiresAt.getTime() < Date.now()) {
      admin.credentialChangeOtp = undefined;
      await admin.save();
      return res.status(400).json({ success: false, message: 'Verification code has expired' });
    }

    if (String(pending.code) !== String(otp).trim()) {
      return res.status(400).json({ success: false, message: 'Invalid verification code' });
    }

    admin.email = pending.pendingEmail;
    admin.passwordHash = pending.pendingPasswordHash;
    admin.credentialChangeOtp = undefined;
    await admin.save();

    return res.status(200).json({
      success: true,
      message: 'Admin login credentials updated successfully',
      admin: {
        id: admin._id,
        username: admin.userName,
        email: admin.email,
      },
    });
  } catch (error) {
    console.error('verifyAdminCredentialChange error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to verify credential change' });
  }
};
