import { query } from './db.js';

export async function createAuditLog({
  actorUserId = null,
  actorAdminId = null,
  action,
  targetType,
  targetId = null,
  ipAddress = null,
  userAgent = null,
  metadata = {},
}) {
  if (!action || !targetType) return;

  // An audit row is a record of what happened, never a reason for it to fail:
  // a logging error must not abort a booking, payment or admin action.
  await query(
    `
      insert into public.audit_logs (
        actor_user_id,
        actor_admin_id,
        action,
        target_type,
        target_id,
        ip_address,
        user_agent,
        metadata
      )
      values ($1,$2,$3,$4,$5,$6,$7,$8)
    `,
    [actorUserId, actorAdminId, action, targetType, targetId, ipAddress, userAgent, metadata],
  ).catch((error) => console.error(`Audit log failed (${action}):`, error.message));
}
