import { query, queryOne } from '../lib/postgres/db.js';

const uid = (req) => req.user?.id || req.user?._id || req.userId;

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
    messages: Array.isArray(row.messages)
      ? row.messages
      : (typeof row.messages === 'string' ? JSON.parse(row.messages) : []),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// POST /api/bago/support/tickets
export async function createTicket(req, res) {
  try {
    const userId = uid(req);
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { subject, description, category = 'OTHER' } = req.body;
    if (!description?.trim()) {
      return res.status(400).json({ success: false, message: 'Description is required' });
    }
    const finalSubject = subject?.trim() || 'Support Request';

    const ticket = await queryOne(
      `INSERT INTO public.support_tickets (user_id, subject, description, category, last_user_at)
       VALUES ($1, $2, $3, $4, NOW()) RETURNING *`,
      [userId, finalSubject, description.trim(), category]
    );

    // Notify agents via socket
    const io = req.app.get('io');
    if (io) {
      const profile = await queryOne(
        `SELECT first_name, last_name, image_url FROM public.profiles WHERE id = $1`,
        [userId]
      ).catch(() => null);
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
    const userId = uid(req);
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const result = await query(
      `SELECT * FROM public.support_tickets WHERE user_id = $1 ORDER BY updated_at DESC`,
      [userId]
    );
    return res.json({ success: true, data: result.rows.map(normalise) });
  } catch (err) {
    console.error('listMyTickets error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/bago/support/tickets/:id
export async function getMyTicket(req, res) {
  try {
    const userId = uid(req);
    const ticket = await queryOne(
      `SELECT * FROM public.support_tickets WHERE id = $1 AND user_id = $2`,
      [req.params.id, userId]
    );
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
    return res.json({ success: true, data: normalise(ticket) });
  } catch (err) {
    console.error('getMyTicket error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

// POST /api/bago/support/tickets/:id/message
export async function sendUserMessage(req, res) {
  try {
    const userId = uid(req);
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ success: false, message: 'Content required' });

    const ticket = await queryOne(
      `SELECT * FROM public.support_tickets WHERE id = $1 AND user_id = $2`,
      [req.params.id, userId]
    );
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
    if (ticket.status === 'CLOSED') return res.status(400).json({ success: false, message: 'Ticket is closed' });

    const messages = Array.isArray(ticket.messages)
      ? ticket.messages
      : (typeof ticket.messages === 'string' ? JSON.parse(ticket.messages) : []);

    const newMsg = { sender: 'USER', senderId: userId, content: content.trim(), timestamp: new Date() };
    messages.push(newMsg);

    const updated = await queryOne(
      `UPDATE public.support_tickets
       SET messages = $1, last_user_at = NOW(), updated_at = NOW()
       WHERE id = $2 RETURNING *`,
      [JSON.stringify(messages), req.params.id]
    );

    const io = req.app.get('io');
    if (io) {
      const profile = await queryOne(
        `SELECT first_name, last_name FROM public.profiles WHERE id = $1`,
        [userId]
      ).catch(() => null);
      const payload = {
        ticketId: req.params.id,
        message: newMsg,
        senderName: profile ? `${profile.first_name} ${profile.last_name}`.trim() : 'User',
      };
      io.to(`support:${req.params.id}`).emit('support_message', payload);
      io.to('support:agents').emit('support_message', payload);
    }

    return res.json({ success: true, data: normalise(updated) });
  } catch (err) {
    console.error('sendUserMessage error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
}
