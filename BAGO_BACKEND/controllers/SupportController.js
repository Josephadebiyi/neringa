import { query, queryOne } from '../lib/postgres/db.js';
import { sendPushNotification } from '../services/pushNotificationService.js';
import {
  buildAssistantMessage,
  countAvailableSupportAgents,
  createAssistantPayload,
  ensureSupportSchema,
} from '../services/supportAutomationService.js';

// Helper: normalise a ticket row for the mobile app
function normalise(row) {
  if (!row) return null;
  return {
    id: row.id,
    _id: row.id,
    subject: row.subject,
    description: row.description,
    category: row.category,
    status: row.status,
    priority: row.priority,
    assignedTo: row.assigned_to,
    assistantState: row.assistant_state,
    firstAgentResponseDueAt: row.first_agent_response_due_at,
    firstAgentResponseAt: row.first_agent_response_at,
    internalNotes: Array.isArray(row.internal_notes) ? row.internal_notes : (row.internal_notes ? JSON.parse(row.internal_notes) : []),
    messages: Array.isArray(row.messages) ? row.messages : (row.messages ? JSON.parse(row.messages) : []),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function isSchemaCompatibilityError(error) {
  return ['42703', '42P01'].includes(error?.code) ||
      /column .* does not exist|relation .* does not exist/i
          .test(error?.message || '');
}

// POST /api/bago/support/tickets
export async function createTicket(req, res) {
  try {
    await ensureSupportSchema();
    const { subject, description, category = 'OTHER' } = req.body;
    const userId = req.user?.id;

    if (!subject?.trim() || !description?.trim()) {
      return res.status(400).json({ success: false, message: 'Subject and description are required' });
    }

    const availableAgents = await countAvailableSupportAgents();
    const assistantMsg = createAssistantPayload(
      buildAssistantMessage({
        ticket: { category, subject: subject.trim(), description: description.trim() },
        incomingText: description.trim(),
        hasAgentsOnline: availableAgents > 0,
      }),
    );

    let ticket;
    try {
      ticket = await queryOne(
        `INSERT INTO public.support_tickets (
            user_id,
            subject,
            description,
            category,
            last_user_at,
            assistant_state,
            first_agent_response_due_at,
            messages
         )
         VALUES ($1, $2, $3, $4, NOW(), 'ACTIVE', NOW() + INTERVAL '24 hours', $5)
         RETURNING *`,
        [userId, subject.trim(), description.trim(), category, JSON.stringify([assistantMsg])]
      );
    } catch (error) {
      if (!isSchemaCompatibilityError(error)) throw error;
      ticket = await queryOne(
        `INSERT INTO public.support_tickets (
            user_id,
            subject,
            description,
            category,
            last_user_at,
            messages
         )
         VALUES ($1, $2, $3, $4, NOW(), $5)
         RETURNING *`,
        [userId, subject.trim(), description.trim(), category, JSON.stringify([assistantMsg])]
      );
    }

    // Notify all agents in the support:agents room via socket
    const io = req.app.get('io');
    if (io) {
      let profile = null;
      try {
        profile = await queryOne(
          `SELECT first_name, last_name, image_url FROM public.profiles WHERE id = $1`,
          [userId],
        );
      } catch (profileError) {
        console.warn('createTicket profile lookup warning:', profileError.message);
      }
      io.to('support:agents').emit('new_support_ticket', {
        ticket: normalise(ticket),
        user: {
          id: userId,
          firstName: profile?.first_name,
          lastName: profile?.last_name,
          avatar: profile?.image_url,
        },
      });
    }

    return res.status(201).json({ success: true, data: normalise(ticket) });
  } catch (err) {
    console.error('createTicket error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/bago/support/tickets
export async function listMyTickets(req, res) {
  try {
    await ensureSupportSchema();
    const userId = req.user?.id;
    const result = await query(
      `SELECT * FROM public.support_tickets WHERE user_id = $1 ORDER BY updated_at DESC`,
      [userId]
    );
    return res.json({ success: true, data: result.rows.map(normalise) });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/bago/support/tickets/:id
export async function getMyTicket(req, res) {
  try {
    await ensureSupportSchema();
    const ticket = await queryOne(
      `SELECT * FROM public.support_tickets WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user?.id]
    );
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
    return res.json({ success: true, data: normalise(ticket) });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// POST /api/bago/support/tickets/:id/message  (user sends a message)
export async function sendUserMessage(req, res) {
  try {
    await ensureSupportSchema();
    const { content } = req.body;
    const userId = req.user?.id;
    if (!content?.trim()) return res.status(400).json({ success: false, message: 'Content required' });

    const ticket = await queryOne(
      `SELECT * FROM public.support_tickets WHERE id = $1 AND user_id = $2`,
      [req.params.id, userId]
    );
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
    if (ticket.status === 'CLOSED') return res.status(400).json({ success: false, message: 'Ticket is closed' });

    const messages = Array.isArray(ticket.messages) ? ticket.messages : [];
    const newMsg = { sender: 'USER', senderId: userId, content: content.trim(), timestamp: new Date() };
    messages.push(newMsg);
    let assistantMsg = null;

    if ((ticket.assistant_state == null || ticket.assistant_state == 'ACTIVE') &&
        !ticket.first_agent_response_at) {
      const availableAgents = await countAvailableSupportAgents();
      assistantMsg = createAssistantPayload(
        buildAssistantMessage({
          ticket,
          incomingText: content.trim(),
          hasAgentsOnline: availableAgents > 0,
        }),
      );
      messages.push(assistantMsg);
    }

    const updated = await queryOne(
      `UPDATE public.support_tickets
       SET messages = $1, last_user_at = NOW(), updated_at = NOW()
       WHERE id = $2 RETURNING *`,
      [JSON.stringify(messages), req.params.id]
    );

    const io = req.app.get('io');
    if (io) {
      // Broadcast to all agents and the ticket room
      const profile = await queryOne(`SELECT first_name, last_name FROM public.profiles WHERE id = $1`, [userId]);
      const payload = {
        ticketId: req.params.id,
        message: newMsg,
        senderName: `${profile?.first_name ?? ''} ${profile?.last_name ?? ''}`.trim(),
      };
      io.to(`support:${req.params.id}`).to('support:agents').emit('support_message', payload);

      if (assistantMsg) {
        const assistantPayload = {
          ticketId: req.params.id,
          message: assistantMsg,
          senderName: assistantMsg.senderName,
        };
        io.to(`support:${req.params.id}`).to('support:agents').emit('support_message', assistantPayload);
      }
    }

    return res.json({ success: true, data: normalise(updated) });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
