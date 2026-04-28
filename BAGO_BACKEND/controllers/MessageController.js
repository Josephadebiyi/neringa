import {
  listUserConversations,
  resolveConversationForUser,
  listConversationMessages,
  createConversationMessage,
  markConversationRead,
  getUnreadConversationCount,
  softDeleteConversation,
  getConversationById,
} from '../lib/postgres/messaging.js';
import cloudinary from 'cloudinary';
import { sendPushNotification } from '../services/pushNotificationService.js';
import { resolveSupportAdminId } from '../services/supportAutomationService.js';

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function uploadMessageImage(file, userId) {
  const mime = file?.mimetype || 'image/jpeg';
  const base64 = file?.data?.toString('base64');
  if (!base64) {
    throw new Error('Invalid image upload');
  }

  const result = await cloudinary.v2.uploader.upload(
    `data:${mime};base64,${base64}`,
    {
      folder: 'bago/chat_images',
      public_id: `chat_${userId}_${Date.now()}`,
    },
  );

  return {
    fileUrl: result.secure_url,
    fileName: file?.name || `chat-image-${Date.now()}.jpg`,
    mimeType: mime,
  };
}

export const messageController = (io) => {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join_user', (userId) => {
      socket.join(userId.toString());
      socket.data.userId = userId.toString();
    });

    socket.on('join_conversation', (conversationId) => {
      socket.join(conversationId.toString());
      console.log(`User ${socket.id} joined conversation ${conversationId}`);
    });

    socket.on('send_message', async ({ conversationId, senderId, text }) => {
      try {
        // Reject if the claimed senderId doesn't match the authenticated socket user
        if (socket.data.userId && socket.data.userId !== senderId?.toString()) {
          socket.emit('error', { message: 'Sender identity mismatch' });
          return;
        }
        const result = await createConversationMessage({ conversationId, senderId, text });

        if (!result) {
          socket.emit('error', { message: 'Conversation not found' });
          return;
        }

        const { conversation, message } = result;

        const messageData = {
          _id: message.id,
          id: message.id,
          conversationId,
          text,
          sender: senderId,
          timestamp: message.createdAt,
        };

        io.to(conversationId.toString()).emit('new_message', messageData);
        io.to(conversation.sender?._id?.toString()).emit('update_conversation', conversation);
        io.to(conversation.traveler?._id?.toString()).emit('update_conversation', conversation);

        // Send push notification to recipient
        const recipientId = conversation.sender?._id === senderId
          ? conversation.traveler?._id
          : conversation.sender?._id;
        const senderName = conversation.sender?._id === senderId
          ? (conversation.sender?.firstName || 'Sender')
          : (conversation.traveler?.firstName || 'Traveler');

        if (recipientId) {
          await sendPushNotification(
            recipientId,
            `💬 New message from ${senderName}`,
            text.length > 50 ? text.substring(0, 47) + '...' : text,
            { conversationId, type: 'chat_message' }
          ).catch(() => {});
        }
      } catch (error) {
        console.error('Error sending message (socket):', error);
        if (error.code === 'CONVERSATION_CLOSED') {
          socket.emit('error', { message: 'This conversation is closed' });
        } else {
          socket.emit('error', { message: 'Failed to send message' });
        }
      }
    });

    // ── Support / CRM ─────────────────────────────────────────────────────────

    // Admin agent joins the global agent broadcast room
    socket.on('join_support_agents', () => {
      socket.join('support:agents');
      console.log(`Agent ${socket.id} joined support:agents`);
    });

    // Anyone (user or agent) joins a specific ticket room
    socket.on('join_support_ticket', (ticketId) => {
      socket.join(`support:${ticketId}`);
      console.log(`Socket ${socket.id} joined support:${ticketId}`);
    });

    // Agent sends a reply — stored in DB then broadcast
    socket.on('support_agent_message', async ({ ticketId, agentId, agentName, content }) => {
      try {
        if (!ticketId || !content?.trim()) return;
        const { query: pgq, queryOne: pgone } = await import('../lib/postgres/db.js');
        const safeAgentId = await resolveSupportAdminId(agentId || null);

        const ticket = await pgone(`SELECT * FROM public.support_tickets WHERE id = $1`, [ticketId]);
        if (!ticket) return;

        const messages = Array.isArray(ticket.messages) ? ticket.messages : [];
        const newMsg = {
          sender: 'ADMIN',
          senderId: safeAgentId,
          senderName: agentName,
          content: content.trim(),
          timestamp: new Date(),
        };
        messages.push(newMsg);

        await pgq(
          `UPDATE public.support_tickets
           SET messages = $1,
               assistant_state = 'HANDOFF',
               first_agent_response_at = COALESCE(first_agent_response_at, NOW()),
               last_agent_at = NOW(),
               updated_at = NOW()
           WHERE id = $2`,
          [JSON.stringify(messages), ticketId]
        );

        const payload = { ticketId, message: newMsg, senderName: agentName };
        io.to(`support:${ticketId}`).to('support:agents').emit('support_message', payload);
        // Push notification to ticket owner
        await import('../services/pushNotificationService.js').then(({ sendPushNotification }) =>
          sendPushNotification(ticket.user_id, `💬 Support reply from ${agentName || 'Agent'}`, content.length > 60 ? content.slice(0, 57) + '...' : content, { ticketId, type: 'support_message' }).catch(() => {})
        );
      } catch (err) {
        console.error('support_agent_message error:', err);
      }
    });

    // Agent joined ticket notification
    socket.on('support_agent_joined', async ({ ticketId, agentName }) => {
      try {
        if (ticketId) {
          const { query: pgq } = await import('../lib/postgres/db.js');
          await pgq(
            `UPDATE public.support_tickets
             SET assistant_state = 'HANDOFF', updated_at = NOW()
             WHERE id = $1`,
            [ticketId]
          );
        }
      } catch (err) {
        console.error('support_agent_joined error:', err);
      }

      io.to(`support:${ticketId}`).emit('support_agent_joined', { ticketId, agentName });
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
};

// Fetch all conversations for a user
export const getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversations = await listUserConversations(userId);
    res.status(200).json({
      success: true,
      data: { conversations },
      message: 'Conversations fetched successfully',
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Fetch messages for a conversation
export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const before = req.query.before || null; // ISO timestamp cursor for older messages

    const conversation = await getConversationById(conversationId, userId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    if (conversation.sender?._id !== userId && conversation.traveler?._id !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const messages = await listConversationMessages(conversationId, { limit, before });

    // Mark as read
    await markConversationRead(conversationId, userId).catch(() => {});

    const io = req.app.get('io');
    if (io) {
      const updatedConv = await getConversationById(conversationId, userId);
      io.to(conversationId.toString()).emit('update_conversation', updatedConv);
      if (conversation.sender?._id) io.to(conversation.sender._id.toString()).emit('update_conversation', updatedConv);
      if (conversation.traveler?._id) io.to(conversation.traveler._id.toString()).emit('update_conversation', updatedConv);
    }

    res.status(200).json({
      success: true,
      data: { messages },
      message: 'Messages fetched successfully',
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const resolveConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { receiverId, requestId, tripId } = req.body;

    if (!receiverId) {
      return res.status(400).json({ success: false, message: 'receiverId is required' });
    }

    const conversation = await resolveConversationForUser({ userId, receiverId, requestId, tripId });

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    return res.status(200).json({
      success: true,
      data: { conversation },
      message: 'Conversation resolved successfully',
    });
  } catch (error) {
    console.error('Error resolving conversation:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// REST endpoint to send a message
export const sendMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const text = req.body.text || req.body.content || '';
    let type = req.body.type || 'text';
    const userId = req.user.id;
    let fileUrl = null;
    let fileName = null;
    let mimeType = null;

    if (req.files?.image) {
      const upload = await uploadMessageImage(req.files.image, userId);
      fileUrl = upload.fileUrl;
      fileName = upload.fileName;
      mimeType = upload.mimeType;
      type = 'image';
    }

    if (!text.trim() && !fileUrl) {
      return res.status(400).json({ success: false, message: 'Message text or image is required' });
    }

    const result = await createConversationMessage({
      conversationId,
      senderId: userId,
      text,
      type,
      fileUrl,
      fileName,
      mimeType,
    });

    if (!result) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    const { conversation, message } = result;
    const trimmedText = text.trim();
    const pushPreview = type === 'image'
      ? (trimmedText ? `Image: ${trimmedText}` : 'Sent an image')
      : text;

    const messageData = {
      _id: message.id,
      id: message.id,
      conversationId,
      text: message.content || text,
      content: message.content || text,
      sender: userId,
      timestamp: message.createdAt,
      type,
      fileUrl,
      fileName,
    };

    const io = req.app.get('io');
    if (io) {
      io.to(conversationId.toString()).emit('new_message', messageData);
      if (conversation.sender?._id) io.to(conversation.sender._id.toString()).emit('update_conversation', conversation);
      if (conversation.traveler?._id) io.to(conversation.traveler._id.toString()).emit('update_conversation', conversation);
    }

    const recipientId = conversation.sender?._id === userId
      ? conversation.traveler?._id
      : conversation.sender?._id;
    const senderName = conversation.sender?._id === userId
      ? (conversation.sender?.firstName || 'Sender')
      : (conversation.traveler?.firstName || 'Traveler');

    if (recipientId) {
      await sendPushNotification(
        recipientId,
        `💬 New message from ${senderName}`,
        pushPreview.length > 50 ? pushPreview.substring(0, 47) + '...' : pushPreview,
        { conversationId, type: 'chat_message' }
      ).catch(() => {});
    }

    res.status(201).json({
      success: true,
      data: message,
      message: 'Message sent',
    });
  } catch (error) {
    console.error('Error in sendMessage REST:', error);
    if (error.code === 'CONVERSATION_CLOSED') {
      return res.status(400).json({ success: false, message: 'This conversation is closed' });
    }
    if (error.code === 'UNAUTHORIZED') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const markMessagesRead = async (req, res) => {
  try {
    const { conversationId } = req.body;
    const userId = req.user.id;

    if (!conversationId) {
      return res.status(400).json({ success: false, message: 'conversationId is required' });
    }

    await markConversationRead(conversationId, userId);
    return res.status(200).json({ success: true, message: 'Messages marked as read' });
  } catch (error) {
    console.error('Error marking messages read:', error);
    if (error.code === 'UNAUTHORIZED') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await getUnreadConversationCount(userId);
    return res.status(200).json({
      success: true,
      data: { count },
      message: 'Unread count fetched successfully',
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const deleteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    await softDeleteConversation(conversationId, userId);
    res.status(200).json({ success: true, message: 'Conversation removed from inbox' });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    if (error.code === 'INVALID_STATUS') {
      return res.status(400).json({ success: false, message: error.message });
    }
    if (error.code === 'UNAUTHORIZED') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
