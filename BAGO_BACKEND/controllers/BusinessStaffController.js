import jwt from 'jsonwebtoken';
import {
  listStaffForBusiness,
  createStaffAccount,
  updateStaffAccount,
  deleteStaffAccount,
  findStaffByEmail,
  verifyStaffPassword,
  touchStaffLogin,
  MAX_STAFF_PER_BUSINESS,
} from '../lib/postgres/businessStaff.js';
import { createAuditLog } from '../lib/postgres/audit.js';
import { findProfileById } from '../lib/postgres/profiles.js';
import { buildUserResponse } from './postgresUserController.js';

const VALID_PERMISSIONS = new Set(['deliveries.manage', 'accounts.view', 'accounts.withdraw', 'chats.manage']);

function sanitizePermissions(permissions) {
  if (!Array.isArray(permissions)) return [];
  return [...new Set(permissions.filter((p) => VALID_PERMISSIONS.has(p)))];
}

function requireBusinessOwnerRequest(req, res) {
  if (req.actingStaff) {
    res.status(403).json({ success: false, message: 'Only the business owner can manage staff accounts.' });
    return null;
  }
  if (req.user?.accountType !== 'company') {
    res.status(403).json({ success: false, message: 'Only business accounts can have staff sub-accounts.' });
    return null;
  }
  return req.user.id;
}

export const listBusinessStaff = async (req, res, next) => {
  try {
    const businessId = requireBusinessOwnerRequest(req, res);
    if (!businessId) return;
    const staff = await listStaffForBusiness(businessId);
    res.status(200).json({ success: true, data: staff, maxStaff: MAX_STAFF_PER_BUSINESS });
  } catch (error) {
    next(error);
  }
};

export const createBusinessStaff = async (req, res, next) => {
  try {
    const businessId = requireBusinessOwnerRequest(req, res);
    if (!businessId) return;

    const { email, password, fullName, permissions } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }
    if (String(password).length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
    }

    const staff = await createStaffAccount({
      businessProfileId: businessId,
      email,
      password,
      fullName,
      permissions: sanitizePermissions(permissions),
    });

    await createAuditLog({
      actorUserId: businessId,
      action: 'business.staff.create',
      targetType: 'business_staff_account',
      targetId: staff.id,
      metadata: { email: staff.email, permissions: staff.permissions },
    }).catch(() => {});

    res.status(201).json({ success: true, data: staff });
  } catch (error) {
    if (error.code === 'EMAIL_TAKEN' || error.code === 'STAFF_LIMIT_REACHED') {
      return res.status(400).json({ success: false, message: error.message, code: error.code });
    }
    next(error);
  }
};

export const updateBusinessStaff = async (req, res, next) => {
  try {
    const businessId = requireBusinessOwnerRequest(req, res);
    if (!businessId) return;

    const { id } = req.params;
    const { fullName, permissions, isActive, password } = req.body;
    const updates = {};
    if (fullName !== undefined) updates.fullName = fullName;
    if (permissions !== undefined) updates.permissions = sanitizePermissions(permissions);
    if (isActive !== undefined) updates.isActive = isActive;
    if (password) {
      if (String(password).length < 8) {
        return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
      }
      updates.password = password;
    }

    const staff = await updateStaffAccount(id, businessId, updates);
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff account not found.' });
    }

    await createAuditLog({
      actorUserId: businessId,
      action: 'business.staff.update',
      targetType: 'business_staff_account',
      targetId: id,
      metadata: { updatedFields: Object.keys(updates) },
    }).catch(() => {});

    res.status(200).json({ success: true, data: staff });
  } catch (error) {
    next(error);
  }
};

export const deleteBusinessStaff = async (req, res, next) => {
  try {
    const businessId = requireBusinessOwnerRequest(req, res);
    if (!businessId) return;

    const { id } = req.params;
    const deleted = await deleteStaffAccount(id, businessId);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Staff account not found.' });
    }

    await createAuditLog({
      actorUserId: businessId,
      action: 'business.staff.delete',
      targetType: 'business_staff_account',
      targetId: id,
      metadata: {},
    }).catch(() => {});

    res.status(200).json({ success: true, message: 'Staff account deleted.' });
  } catch (error) {
    next(error);
  }
};

// Public: staff sign in with their own credentials. Issues a token shaped
// like the business owner's own (id = the owning business's profile id) so
// every existing req.user.id-scoped endpoint keeps working unmodified —
// isAuthenticated re-fetches the live staff row from actingAsStaffId on
// every request rather than trusting permissions baked into this token.
export const businessStaffLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const staff = await findStaffByEmail(email);
    if (!staff || !staff.isActive) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }
    const passwordOk = await verifyStaffPassword(staff, password);
    if (!passwordOk) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    await touchStaffLogin(staff.id);

    const accessToken = jwt.sign(
      { id: staff.businessProfileId, actingAsStaffId: staff.id, email: staff.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
    );

    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('token', accessToken, {
      httpOnly: true,
      secure: isProd,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: isProd ? 'none' : 'lax',
    });

    const ownerProfile = await findProfileById(staff.businessProfileId);
    const user = ownerProfile ? await buildUserResponse(ownerProfile) : null;

    res.status(200).json({
      success: true,
      message: 'Sign-in successful',
      token: accessToken,
      // Same `user` shape a normal business-owner login returns, so the
      // existing dashboard renders unchanged — plus staff session context
      // the frontend uses to hide/disable what this sub-account can't do.
      user: user ? { ...user, isStaffSession: true, staffPermissions: staff.permissions, staffId: staff.id, staffFullName: staff.fullName } : null,
    });
  } catch (error) {
    next(error);
  }
};
