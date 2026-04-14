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
import { sendPushNotification } from '../services/pushNotificationService.js';

export const messageController = (io) => {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join_user', (userId) => {
      socket.join(userId.toString());
      console.log(`User ${userId} joined their private room ${userId}`);
    });

    socket.on('join_conversation', (conversationId) => {
      socket.join(conversationId.toString());
      console.log(`User ${socket.id} joined conversation ${conversationId}`);
    });

    socket.on('send_message', async ({ conversationId, senderId, text }) => {
      try {
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

    const conversation = await getConversationById(conversationId, userId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    if (conversation.sender?._id !== userId && conversation.traveler?._id !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const messages = await listConversationMessages(conversationId);

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
    const text = req.body.text || req.body.content;
    const userId = req.user.id;

    if (!text) {
      return res.status(400).json({ success: false, message: 'Message text is required' });
    }

    const result = await createConversationMessage({ conversationId, senderId: userId, text });

    if (!result) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    const { conversation, message } = result;

    const messageData = {
      _id: message.id,
      id: message.id,
      conversationId,
      text,
      sender: userId,
      timestamp: message.createdAt,
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
        text.length > 50 ? text.substring(0, 47) + '...' : text,
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
