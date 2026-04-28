import { query, queryOne } from '../lib/postgres/db.js';

const HUMAN_RESPONSE_SLA_HOURS = 24;
const SUPPORT_ROLES = ['SUPPORT_ADMIN', 'SUPER_ADMIN'];
let supportSchemaPromise = null;

function isSchemaCompatibilityError(error) {
  return ['42703', '42P01'].includes(error?.code) ||
    /column .* does not exist|relation .* does not exist/i.test(error?.message || '');
}

async function bootstrapSupportSchema() {
  // pgcrypto needed for gen_random_uuid() on older PG; ignore if already exists or no permission
  await query(`CREATE EXTENSION IF NOT EXISTS pgcrypto`).catch(() => {});

  await query(`
    CREATE TABLE IF NOT EXISTS public.support_tickets (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
      subject TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'OTHER',
      status TEXT NOT NULL DEFAULT 'OPEN',
      priority TEXT NOT NULL DEFAULT 'MEDIUM',
      assigned_to TEXT,
      messages JSONB NOT NULL DEFAULT '[]'::jsonb,
      internal_notes JSONB NOT NULL DEFAULT '[]'::jsonb,
      assistant_state TEXT NOT NULL DEFAULT 'ACTIVE',
      first_agent_response_due_at TIMESTAMPTZ,
      first_agent_response_at TIMESTAMPTZ,
      last_agent_at TIMESTAMPTZ,
      last_user_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    ALTER TABLE public.support_tickets
    ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'OTHER',
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'OPEN',
    ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'MEDIUM',
    ADD COLUMN IF NOT EXISTS assigned_to TEXT,
    ADD COLUMN IF NOT EXISTS messages JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS internal_notes JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS assistant_state TEXT NOT NULL DEFAULT 'ACTIVE',
    ADD COLUMN IF NOT EXISTS first_agent_response_due_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS first_agent_response_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS last_agent_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS last_user_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  `);

  // Drop the FK on assigned_to — it references profiles but we store admin_user IDs there
  await query(`
    ALTER TABLE public.support_tickets
    DROP CONSTRAINT IF EXISTS support_tickets_assigned_to_fkey
  `).catch(() => {});

  await query(`
    CREATE INDEX IF NOT EXISTS support_tickets_user_idx
    ON public.support_tickets(user_id)
  `);
  await query(`
    CREATE INDEX IF NOT EXISTS support_tickets_status_idx
    ON public.support_tickets(status)
  `);
  await query(`
    CREATE INDEX IF NOT EXISTS support_tickets_created_idx
    ON public.support_tickets(created_at DESC)
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS public.support_saved_replies (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      created_by UUID,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    ALTER TABLE public.admin_users
    ADD COLUMN IF NOT EXISTS permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS support_presence TEXT NOT NULL DEFAULT 'OFFLINE',
    ADD COLUMN IF NOT EXISTS support_last_seen_at TIMESTAMPTZ
  `);

  // Repair legacy assignments that point at deleted / invalid admin rows so
  // later ticket updates do not fail on the assigned_to foreign key.
  await query(`
    UPDATE public.support_tickets
    SET assigned_to = NULL
    WHERE assigned_to IS NOT NULL
      AND NOT EXISTS (
        SELECT 1
        FROM public.admin_users au
        WHERE au.id::text = public.support_tickets.assigned_to::text
      )
  `).catch(() => {});
}

export async function ensureSupportSchema() {
  if (!supportSchemaPromise) {
    supportSchemaPromise = bootstrapSupportSchema().catch((error) => {
      supportSchemaPromise = null;
      throw error;
    });
  }

  return supportSchemaPromise;
}

export const STAFF_PERMISSION_PRESETS = {
  SUPPORT_ADMIN: [
    'support.read',
    'support.reply',
    'support.assign',
    'support.status.update',
    'support.saved_replies.use',
  ],
  SAFETY_ADMIN: [
    'support.read',
    'support.reply',
    'support.assign',
    'support.status.update',
    'support.notes.manage',
    'disputes.manage',
    'kyc.review',
  ],
  SUPER_ADMIN: [
    'support.read',
    'support.reply',
    'support.assign',
    'support.status.update',
    'support.notes.manage',
    'support.saved_replies.manage',
    'staff.manage',
    'settings.manage',
  ],
};

function hasKeyword(text = '', keywords = []) {
  const normalized = text.toLowerCase();
  return keywords.some((keyword) => normalized.includes(keyword));
}

const SUPER_ADMIN_ROLES = new Set(['admin', 'ADMIN', 'SUPER_ADMIN', 'superadmin', 'super_admin']);

export function buildPermissionSet(admin) {
  const explicit = Array.isArray(admin?.permissions)
    ? admin.permissions
    : typeof admin?.permissions === 'string' && admin.permissions.trim()
      ? JSON.parse(admin.permissions)
      : [];

  if (explicit.length) return explicit;
  if (SUPER_ADMIN_ROLES.has(admin?.role)) return STAFF_PERMISSION_PRESETS['SUPER_ADMIN'];
  return STAFF_PERMISSION_PRESETS[admin?.role] || [];
}

export function adminHasPermission(admin, permission) {
  if (SUPER_ADMIN_ROLES.has(admin?.role)) return true;
  const permissions = buildPermissionSet(admin);
  return permissions.includes(permission) || permissions.includes('support.*');
}

export async function countAvailableSupportAgents() {
  await ensureSupportSchema();
  try {
    const result = await queryOne(
      `
        SELECT COUNT(*)::int AS count
        FROM public.admin_users
        WHERE is_active = TRUE
          AND role = ANY($1)
          AND support_presence = 'AVAILABLE'
          AND support_last_seen_at > NOW() - INTERVAL '2 minutes'
      `,
      [SUPPORT_ROLES],
    );

    return result?.count || 0;
  } catch (error) {
    if (!isSchemaCompatibilityError(error)) throw error;

    const fallback = await queryOne(
      `
        SELECT COUNT(*)::int AS count
        FROM public.admin_users
        WHERE is_active = TRUE
          AND role = ANY($1)
      `,
      [SUPPORT_ROLES],
    );

    return fallback?.count || 0;
  }
}

export function buildAssistantMessage({ ticket, incomingText = '', hasAgentsOnline }) {
  const text = incomingText.toLowerCase();
  const isShipment = ticket?.category === 'SHIPMENT' || hasKeyword(text, ['shipment', 'package', 'traveler', 'delivery', 'tracking']);
  const isPayment = ticket?.category === 'PAYMENT' || hasKeyword(text, ['payment', 'refund', 'card', 'withdraw', 'payout']);
  const isAccount = ticket?.category === 'ACCOUNT' || hasKeyword(text, ['login', 'account', 'email', 'verify', 'kyc']);

  const opening = hasAgentsOnline
    ? 'Thanks for messaging Bago support. A teammate is currently available and should join this chat shortly.'
    : `Thanks for messaging Bago support. No teammate is currently live in chat, but we will respond within ${HUMAN_RESPONSE_SLA_HOURS} hours.`;

  let nextStep = 'Please keep any relevant booking, order, or tracking details in this thread so the next agent can continue without asking you to repeat yourself.';

  if (isShipment) {
    nextStep = 'If this is about a shipment, please share the route, traveler, and any tracking details in this thread so the next agent can pick it up quickly.';
  } else if (isPayment) {
    nextStep = 'If this is payment-related, please mention whether it concerns a charge, refund, escrow release, or withdrawal so we route it correctly.';
  } else if (isAccount) {
    nextStep = 'If this is account-related, please mention the exact step that is blocked, such as login, verification, or profile update.';
  }

  return `${opening} ${nextStep}`;
}

export function createAssistantPayload(content) {
  return {
    sender: 'ASSISTANT',
    senderId: 'bago-assistant',
    senderName: 'Bago Assistant',
    content,
    timestamp: new Date(),
  };
}

export async function markTicketHandoff(ticketId, agentId) {
  await ensureSupportSchema();
  let safeAgentId = null;
  if (agentId) {
    const admin = await queryOne(
      `SELECT id FROM public.admin_users WHERE id = $1`,
      [agentId],
    ).catch(() => null);
    safeAgentId = admin?.id || null;
  }
  try {
    return await queryOne(
      `
        UPDATE public.support_tickets
        SET assistant_state = 'HANDOFF',
            assigned_to = CASE
              WHEN assigned_to IS NULL THEN $2
              WHEN EXISTS (
                SELECT 1 FROM public.admin_users au
                WHERE au.id::text = public.support_tickets.assigned_to::text
              ) THEN assigned_to
              ELSE $2
            END,
            first_agent_response_at = COALESCE(first_agent_response_at, NOW()),
            last_agent_at = NOW(),
            updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `,
      [ticketId, safeAgentId],
    );
  } catch (error) {
    if (!isSchemaCompatibilityError(error)) throw error;

    return queryOne(
      `
        UPDATE public.support_tickets
        SET assigned_to = CASE
              WHEN assigned_to IS NULL THEN $2
              WHEN EXISTS (
                SELECT 1 FROM public.admin_users au
                WHERE au.id::text = public.support_tickets.assigned_to::text
              ) THEN assigned_to
              ELSE $2
            END,
            last_agent_at = NOW(),
            updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `,
      [ticketId, safeAgentId],
    );
  }
}

export async function resolveSupportAdminId(candidateId) {
  if (!candidateId) return null;
  const admin = await queryOne(
    `SELECT id FROM public.admin_users WHERE id = $1`,
    [candidateId],
  ).catch(() => null);
  return admin?.id || null;
}

export async function updateSupportPresence(adminId, presence) {
  await ensureSupportSchema();
  try {
    return await queryOne(
      `
        UPDATE public.admin_users
        SET support_presence = $2,
            support_last_seen_at = NOW()
        WHERE id = $1
        RETURNING id
      `,
      [adminId, presence],
    );
  } catch (error) {
    if (!isSchemaCompatibilityError(error)) throw error;
    return { id: adminId };
  }
}

export async function listSavedReplies() {
  await ensureSupportSchema();
  try {
    const result = await query(
      `
        SELECT id, title, body, is_active AS "isActive", created_at AS "createdAt", updated_at AS "updatedAt"
        FROM public.support_saved_replies
        WHERE is_active = TRUE
        ORDER BY created_at DESC
      `,
    );
    return result.rows;
  } catch (error) {
    if (!isSchemaCompatibilityError(error)) throw error;

    return [
      {
        id: 'fallback-1',
        title: 'Warm acknowledgment',
        body: 'Thanks for reaching out to Bago support. I am reviewing this now and will keep this conversation updated.',
        isActive: true,
      },
      {
        id: 'fallback-2',
        title: 'Waiting for handoff',
        body: 'A support teammate is not immediately available, but your ticket is in our queue and we will respond within 24 hours.',
        isActive: true,
      },
      {
        id: 'fallback-3',
        title: 'Shipment coordination',
        body: 'I am checking the shipment details and coordinating with the relevant team. I will update you here as soon as I have the next step.',
        isActive: true,
      },
    ];
  }
}
