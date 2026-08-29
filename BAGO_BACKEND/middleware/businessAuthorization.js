import { createAuditLog } from '../lib/postgres/audit.js';

// Gates a business-scoped endpoint by permission. A no-op when the real
// business owner is logged in directly (req.actingStaff unset) — only a
// staff sub-account session is ever restricted. Modeled on
// middleware/adminAuthorization.js's requireAdminPermission.
export const requireBusinessPermission = (permission) => async (req, res, next) => {
  if (!req.actingStaff) return next();

  if (req.actingStaff.permissions.includes(permission)) return next();

  await createAuditLog({
    actorUserId: req.user?.id,
    action: 'business.staff.permission.denied',
    targetType: 'business_staff_account',
    targetId: req.actingStaff.id,
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    metadata: { permission, method: req.method, path: req.originalUrl },
  }).catch(() => {});

  return res.status(403).json({
    success: false,
    code: 'BUSINESS_PERMISSION_REQUIRED',
    message: 'You do not have permission to perform this action.',
    permission,
  });
};

// Attaches audit metadata identifying which staff member acted, for routes
// that already call the generic createAuditLog themselves.
export function actingStaffMetadata(req) {
  return req.actingStaff ? { actingStaffId: req.actingStaff.id, actingStaffEmail: req.actingStaff.email } : {};
}
