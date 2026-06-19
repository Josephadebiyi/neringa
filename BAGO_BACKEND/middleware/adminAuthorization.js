import { createAuditLog } from '../lib/postgres/audit.js';
import { adminHasPermission } from '../services/supportAutomationService.js';

export const requireAdminPermission = (permission) => async (req, res, next) => {
  if (!req.admin) {
    return res.status(401).json({ success: false, message: 'Admin authentication required.' });
  }

  if (adminHasPermission(req.admin, permission)) return next();

  await createAuditLog({
    actorAdminId: req.admin.id,
    action: 'admin.permission.denied',
    targetType: 'admin_route',
    targetId: null,
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    metadata: {
      permission,
      method: req.method,
      path: req.originalUrl,
      role: req.admin.role,
    },
  }).catch(() => {});

  return res.status(403).json({
    success: false,
    code: 'ADMIN_PERMISSION_REQUIRED',
    message: 'You do not have permission to perform this admin action.',
    permission,
  });
};

export const auditAdminAction = (action, targetType, targetParam = 'id') => async (req, _res, next) => {
  if (!req.admin) return next();

  await createAuditLog({
    actorAdminId: req.admin.id,
    action,
    targetType,
    targetId: req.params?.[targetParam] || req.params?.userId || req.params?.transactionId || null,
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    metadata: {
      method: req.method,
      path: req.originalUrl,
      params: req.params || {},
      bodyKeys: Object.keys(req.body || {}),
    },
  }).catch(() => {});

  return next();
};
