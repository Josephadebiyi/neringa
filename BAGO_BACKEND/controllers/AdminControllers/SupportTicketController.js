import { query, queryOne } from '../../lib/postgres/db.js';
import { sendPushNotification } from '../../services/pushNotificationService.js';

// support_tickets table: id, user_id, subject, status, priority, assigned_to,
// messages (jsonb array), created_at, updated_at

const withId = (row) => row ? { ...row, _id: row.id } : null;

export const getAllTickets = async (req, res) => {
  try {
    const result = await query(
      `SELECT t.*, p.first_name as "userFirstName", p.last_name as "userLastName",
              p.email as "userEmail", p.image_url as "userImage"
       FROM public.support_tickets t
       LEFT JOIN public.profiles p ON p.id = t.user_id
       ORDER BY t.created_at DESC`
    );
    res.status(200).json({ success: true, data: result.rows.map(withId) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTicketById = async (req, res) => {
  try {
    const ticket = await queryOne(
      `SELECT t.*, p.first_name as "userFirstName", p.last_name as "userLastName",
              p.email as "userEmail", p.image_url as "userImage"
       FROM public.support_tickets t
       LEFT JOIN public.profiles p ON p.id = t.user_id
       WHERE t.id = $1`,
      [req.params.id]
    );
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
    res.status(200).json({ success: true, data: withId(ticket) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateTicketStatus = async (req, res) => {
  try {
    const { status, priority, assignedTo } = req.body;
    const fields = [];
    const values = [];
    let idx = 1;

    if (status) { fields.push(`status = $${idx++}`); values.push(status); }
    if (priority) { fields.push(`priority = $${idx++}`); values.push(priority); }
    if (assignedTo !== undefined) { fields.push(`assigned_to = $${idx++}`); values.push(assignedTo); }

    if (!fields.length) return res.status(400).json({ success: false, message: 'No fields to update' });

    values.push(req.params.id);
    const ticket = await queryOne(
      `UPDATE public.support_tickets SET ${fields.join(', ')}, updated_at = NOW()
       WHERE id = $${idx} RETURNING *`,
      values
    );
    res.status(200).json({ success: true, data: withId(ticket) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addTicketMessage = async (req, res) => {
  try {
    const { content, sender = 'ADMIN', senderId, senderName } = req.body;
    const ticket = await queryOne(`SELECT * FROM public.support_tickets WHERE id = $1`, [req.params.id]);
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

    const messages = Array.isArray(ticket.messages) ? ticket.messages : [];
    const newMsg = { sender, senderId, senderName, content, timestamp: new Date() };
    messages.push(newMsg);

    const newStatus = sender === 'ADMIN' ? 'IN_PROGRESS' : ticket.status;
    const updated = await queryOne(
      `UPDATE public.support_tickets SET messages = $1, status = $2, last_agent_at = NOW(), updated_at = NOW()
       WHERE id = $3 RETURNING *`,
      [JSON.stringify(messages), newStatus, req.params.id]
    );

    // Real-time: push to ticket room and user's personal room
    const io = req.app.get('io');
    if (io) {
      const payload = { ticketId: req.params.id, message: newMsg, senderName: senderName ?? 'Agent' };
      io.to(`support:${req.params.id}`).emit('support_message', payload);
      io.to('support:agents').emit('support_message', payload);
      // Notify user via their personal room
      if (ticket.user_id) {
        io.to(ticket.user_id.toString()).emit('support_message', payload);
        await sendPushNotification(
          ticket.user_id,
          `💬 Support reply from ${senderName ?? 'Agent'}`,
          content.length > 60 ? content.slice(0, 57) + '...' : content,
          { ticketId: req.params.id, type: 'support_message' }
        ).catch(() => {});
      }
    }

    res.status(200).json({ success: true, data: withId(updated) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
