import { query, queryOne } from '../../lib/postgres/db.js';
import { sendPushNotification } from '../../services/pushNotificationService.js';
import {
  adminHasPermission,
  ensureSupportSchema,
  listSavedReplies,
  resolveSupportAdminId,
} from '../../services/supportAutomationService.js';

// support_tickets table: id, user_id, subject, status, priority, assigned_to,
// messages (jsonb array), created_at, updated_at

function parseJsonArray(val) {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') { try { return JSON.parse(val); } catch { return []; } }
  return [];
}

// Normalise a postgres row → camelCase shape the admin dashboard expects.
// JOIN-aliased columns (userFirstName etc.) are already camelCase from SQL aliases.
function normaliseAdmin(row) {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    subject: row.subject,
    description: row.description,
    category: row.category,
    status: row.status,
    priority: row.priority,
    assignedTo: row.assigned_to,
    assistantState: row.assistant_state,
    firstAgentResponseDueAt: row.first_agent_response_due_at,
    firstAgentResponseAt: row.first_agent_response_at,
    internalNotes: parseJsonArray(row.internal_notes),
    messages: parseJsonArray(row.messages),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    // JOIN-aliased from SELECT (already camelCase via SQL "as" aliases)
    userFirstName: row.userFirstName,
    userLastName: row.userLastName,
    userEmail: row.userEmail,
    userImage: row.userImage,
  };
}

function isSchemaCompatibilityError(error) {
  return ['42703', '42P01'].includes(error?.code) ||
    /column .* does not exist|relation .* does not exist/i.test(error?.message || '');
}

function ensurePermission(req, res, permission) {
  if (!adminHasPermission(req.admin, permission)) {
    res.status(403).json({ success: false, message: 'You do not have permission for this support action' });
    return false;
  }
  return true;
}

export const getAllTickets = async (req, res) => {
  try {
    await ensureSupportSchema();
    if (!ensurePermission(req, res, 'support.read')) return;
    const result = await query(
      `SELECT t.*, p.first_name as "userFirstName", p.last_name as "userLastName",
              p.email as "userEmail", p.image_url as "userImage"
       FROM public.support_tickets t
       LEFT JOIN public.profiles p ON p.id = t.user_id
       ORDER BY t.created_at DESC`
    );
    res.status(200).json({ success: true, data: result.rows.map(normaliseAdmin) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTicketById = async (req, res) => {
  try {
    await ensureSupportSchema();
    if (!ensurePermission(req, res, 'support.read')) return;
    const ticket = await queryOne(
      `SELECT t.*, p.first_name as "userFirstName", p.last_name as "userLastName",
              p.email as "userEmail", p.image_url as "userImage"
       FROM public.support_tickets t
       LEFT JOIN public.profiles p ON p.id = t.user_id
       WHERE t.id = $1`,
      [req.params.id]
    );
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
    res.status(200).json({ success: true, data: normaliseAdmin(ticket) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateTicketStatus = async (req, res) => {
  try {
    await ensureSupportSchema();
    const { status, priority, assignedTo, assigned_to, internalNotes } = req.body;
    const requestedAssignedTo = assignedTo !== undefined ? assignedTo : assigned_to;
    const isAssignmentUpdate = requestedAssignedTo !== undefined;
    const isStatusUpdate = status !== undefined || priority !== undefined;
    const isNotesUpdate = internalNotes !== undefined;

    if (isStatusUpdate && !ensurePermission(req, res, 'support.status.update')) return;
    if (isAssignmentUpdate && !ensurePermission(req, res, 'support.assign')) return;
    if (isNotesUpdate && !ensurePermission(req, res, 'support.notes.manage')) return;

    const fields = [];
    const values = [];
    let idx = 1;

    if (status) { fields.push(`status = $${idx++}`); values.push(status); }
    if (priority) { fields.push(`priority = $${idx++}`); values.push(priority); }
    const normalizedAssignedTo = requestedAssignedTo === undefined
      ? undefined
      : await resolveSupportAdminId(requestedAssignedTo);
    if (normalizedAssignedTo !== undefined) { fields.push(`assigned_to = $${idx++}`); values.push(normalizedAssignedTo || null); }
    if (internalNotes !== undefined) { fields.push(`internal_notes = $${idx++}`); values.push(JSON.stringify(internalNotes)); }

    if (!fields.length) return res.status(400).json({ success: false, message: 'No fields to update' });

    values.push(req.params.id);
    let ticket;
    try {
      ticket = await queryOne(
        `UPDATE public.support_tickets SET ${fields.join(', ')}, updated_at = NOW()
         WHERE id = $${idx} RETURNING *`,
        values
      );
    } catch (error) {
      if (!isSchemaCompatibilityError(error) || internalNotes === undefined) throw error;

      const safeFields = fields.filter((field) => !field.startsWith('internal_notes ='));
      const safeValues = [];
      let safeIdx = 1;
      if (status) { safeFields[safeValues.length] = `status = $${safeIdx++}`; safeValues.push(status); }
      if (priority) { safeFields[safeValues.length] = `priority = $${safeIdx++}`; safeValues.push(priority); }
      if (normalizedAssignedTo !== undefined) {
        safeFields[safeValues.length] = `assigned_to = $${safeIdx++}`;
        safeValues.push(normalizedAssignedTo || null);
      }
      if (!safeFields.length) {
        return res.status(200).json({ success: true, data: null });
      }
      safeValues.push(req.params.id);
      ticket = await queryOne(
        `UPDATE public.support_tickets SET ${safeFields.join(', ')}, updated_at = NOW()
         WHERE id = $${safeIdx} RETURNING *`,
        safeValues
      );
    }
    res.status(200).json({ success: true, data: normaliseAdmin(ticket) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addTicketMessage = async (req, res) => {
  try {
    await ensureSupportSchema();
    if (!ensurePermission(req, res, 'support.reply')) return;
    const { content, sender = 'ADMIN', senderId, senderName } = req.body;
    const ticket = await queryOne(`SELECT * FROM public.support_tickets WHERE id = $1`, [req.params.id]);
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

    const messages = Array.isArray(ticket.messages) ? ticket.messages : [];
    const resolvedSenderName = senderName || req.admin?.full_name || req.admin?.username || 'Agent';
    const newMsg = {
      sender,
      senderId: senderId || req.admin?.id || null,
      senderName: resolvedSenderName,
      content,
      timestamp: new Date(),
    };
    messages.push(newMsg);

    // Do NOT update status here; the dedicated updateTicketStatus endpoint owns it.
    // We only repair/seed assigned_to when the current value is invalid or empty.
    const newAssistantState = sender === 'ADMIN' ? 'HANDOFF' : (ticket.assistant_state || 'ACTIVE');

    let updated;
    try {
      updated = await queryOne(
        `UPDATE public.support_tickets
         SET messages = $1,
             assistant_state = $3,
             assigned_to = CASE
               WHEN assigned_to IS NULL THEN $4
               WHEN EXISTS (
                 SELECT 1 FROM public.admin_users au
                 WHERE au.id::text = public.support_tickets.assigned_to::text
               ) THEN assigned_to
               ELSE $4
             END,
             first_agent_response_at = COALESCE(first_agent_response_at, NOW()),
             last_agent_at = NOW(),
             updated_at = NOW()
         WHERE id = $2 RETURNING *`,
        [JSON.stringify(messages), req.params.id, newAssistantState, req.admin?.id || null]
      );
    } catch (schemaErr) {
      if (!isSchemaCompatibilityError(schemaErr)) throw schemaErr;
      updated = await queryOne(
        `UPDATE public.support_tickets
         SET messages = $1, updated_at = NOW()
         WHERE id = $2 RETURNING *`,
        [JSON.stringify(messages), req.params.id]
      );
    }

    // Real-time: push to ticket room (user is in it) + agents room
    const io = req.app.get('io');
    if (io) {
      const payload = { ticketId: req.params.id, message: newMsg, senderName: resolvedSenderName };
      // Chained .to() deduplicates: sockets in both rooms receive it only once
      io.to(`support:${req.params.id}`).to('support:agents').emit('support_message', payload);
      // Push notification covers users not actively in the chat screen
      if (ticket.user_id) {
        await sendPushNotification(
          ticket.user_id,
          `💬 Support reply from ${resolvedSenderName}`,
          content.length > 60 ? content.slice(0, 57) + '...' : content,
          { ticketId: req.params.id, type: 'support_message' }
        ).catch(() => {});
      }
    }

    res.status(200).json({ success: true, data: normaliseAdmin(updated) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addInternalNote = async (req, res) => {
  try {
    await ensureSupportSchema();
    if (!ensurePermission(req, res, 'support.notes.manage')) return;
    const { content } = req.body;
    if (!content?.trim()) {
      return res.status(400).json({ success: false, message: 'Internal note content is required' });
    }

    const ticket = await queryOne(`SELECT id, internal_notes FROM public.support_tickets WHERE id = $1`, [req.params.id]);
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

    const notes = Array.isArray(ticket.internal_notes)
      ? ticket.internal_notes
      : (ticket.internal_notes ? JSON.parse(ticket.internal_notes) : []);

    notes.push({
      id: `${Date.now()}`,
      content: content.trim(),
      createdAt: new Date(),
      authorId: req.admin?.id,
      authorName: req.admin?.full_name || req.admin?.username || 'Bago Staff',
    });

    let updated;
    try {
      updated = await queryOne(
        `UPDATE public.support_tickets
         SET internal_notes = $1, updated_at = NOW()
         WHERE id = $2
         RETURNING *`,
        [JSON.stringify(notes), req.params.id]
      );
    } catch (error) {
      if (!isSchemaCompatibilityError(error)) throw error;
      return res.status(200).json({
        success: true,
        data: normaliseAdmin({ id: req.params.id, internal_notes: notes }),
        fallback: true,
      });
    }

    res.status(200).json({ success: true, data: normaliseAdmin(updated) });
  } catch (error) {
    if (isSchemaCompatibilityError(error)) {
      return res.status(200).json({ success: true, data: [] });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSavedReplies = async (req, res) => {
  try {
    await ensureSupportSchema();
    if (!ensurePermission(req, res, 'support.saved_replies.use')) return;
    const replies = await listSavedReplies();
    res.status(200).json({ success: true, data: replies });
  } catch (error) {
    if (isSchemaCompatibilityError(error)) {
      return res.status(200).json({ success: true, data: [], fallback: true });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createSavedReply = async (req, res) => {
  const { title, body } = req.body;
  try {
    await ensureSupportSchema();
    if (!ensurePermission(req, res, 'support.saved_replies.manage')) return;
    if (!title?.trim() || !body?.trim()) {
      return res.status(400).json({ success: false, message: 'Title and body are required' });
    }

    const reply = await queryOne(
      `INSERT INTO public.support_saved_replies (title, body, created_by, is_active)
       VALUES ($1, $2, $3, TRUE)
       RETURNING id, title, body, is_active as "isActive", created_at as "createdAt", updated_at as "updatedAt"`,
      [title.trim(), body.trim(), req.admin?.id || null]
    );

    res.status(201).json({ success: true, data: reply });
  } catch (error) {
    if (isSchemaCompatibilityError(error)) {
      return res.status(200).json({
        success: true,
        data: {
          id: `fallback-${Date.now()}`,
          title: title?.trim(),
          body: body?.trim(),
          isActive: true,
        },
        fallback: true,
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSupportPresence = async (req, res) => {
  try {
    await ensureSupportSchema();
    if (!ensurePermission(req, res, 'support.read')) return;
    const { presence } = req.body;
    if (!['OFFLINE', 'AWAY', 'AVAILABLE'].includes(presence)) {
      return res.status(400).json({ success: false, message: 'Invalid presence value' });
    }

    const admin = await queryOne(
      `UPDATE public.admin_users
       SET support_presence = $2, support_last_seen_at = NOW()
       WHERE id = $1
       RETURNING id, support_presence as "supportPresence", support_last_seen_at as "supportLastSeenAt"`,
      [req.admin.id, presence]
    );

    res.status(200).json({ success: true, data: admin });
  } catch (error) {
    if (isSchemaCompatibilityError(error)) {
      return res.status(200).json({
        success: true,
        data: {
          id: req.admin?.id,
          supportPresence: req.body?.presence,
          supportLastSeenAt: new Date().toISOString(),
        },
        fallback: true,
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};
