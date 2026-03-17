import Conversation from '../models/conversationScheme.js';
import Message from '../models/messageScheme.js';
import Request from '../models/RequestScheme.js';
import User from '../models/userScheme.js';
import { sendPushNotification } from '../services/pushNotificationService.js';

export const messageController = (io) => {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join a room for the specific user so we can send private updates (e.g. inbox refresh)
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
        const conversation = await Conversation.findById(conversationId)
          .populate('sender', 'email firstName lastName pushTokens')
          .populate('traveler', 'email firstName lastName pushTokens');

        if (!conversation) {
          socket.emit('error', { message: 'Conversation not found' });
          return;
        }

        const message = new Message({
          conversation: conversationId,
          sender: senderId,
          text,
        });
        await message.save();

        conversation.last_message = text;
        conversation.updated_at = Date.now();

        let recipientId;
        let senderName = 'Someone';

        if (conversation.sender._id.toString() === senderId.toString()) {
          conversation.unread_count_traveler += 1;
          recipientId = conversation.traveler._id;
          senderName = conversation.sender.firstName || 'Sender';
        } else if (conversation.traveler._id.toString() === senderId.toString()) {
          conversation.unread_count_sender += 1;
          recipientId = conversation.sender._id;
          senderName = conversation.traveler.firstName || 'Traveler';
        }
        await conversation.save();

        const messageData = {
          _id: message._id,
          id: message._id,
          conversationId,
          text,
          sender: senderId,
          timestamp: message.timestamp,
        };

        // Emit to the conversation room (for users currently in the chat screen)
        io.to(conversationId.toString()).emit('new_message', messageData);

        // Emit to participants' private rooms (to refresh their conversation list/inbox)
        const updatedConv = await Conversation.findById(conversationId)
          .populate('sender', 'email firstName lastName image')
          .populate('traveler', 'email firstName lastName image')
          .populate({
            path: 'request',
            populate: { path: 'package' }
          });

        io.to(conversation.sender._id.toString()).emit('update_conversation', updatedConv);
        io.to(conversation.traveler._id.toString()).emit('update_conversation', updatedConv);

        // ✅ Send Push Notification to recipient
        if (recipientId) {
          await sendPushNotification(
            recipientId,
            `💬 New message from ${senderName}`,
            text.length > 50 ? text.substring(0, 47) + '...' : text,
            { conversationId, type: 'chat_message' }
          );
        }

      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
}

// Fetch all conversations for a user
export const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    // Auto-create missing conversations for active requests (Healing)
    const orphanedRequests = await Request.find({
      $or: [{ sender: userId }, { traveler: userId }],
      status: { $in: ['pending', 'accepted', 'intransit', 'delivering', 'completed'] }
    });

    for (const reqObj of orphanedRequests) {
      if (!reqObj.sender || !reqObj.traveler) {
        continue;
      }

      const existing = await Conversation.findOne({ request: reqObj._id });
      if (!existing) {
        try {
          await new Conversation({
            request: reqObj._id,
            trip: reqObj.trip,
            sender: reqObj.sender,
            traveler: reqObj.traveler,
            last_message: 'Conversation started',
            updated_at: reqObj.updatedAt || new Date(),
          }).save();
          console.log(`✅ Healed conversation for request ${reqObj._id}`);
        } catch (healErr) {
          console.error(`❌ Healing failed for request ${reqObj._id}:`, healErr.message);
        }
      }
    }

    const conversations = await Conversation.find({
      $or: [
        { sender: userId, deletedBySender: { $ne: true } },
        { traveler: userId, deletedByTraveler: { $ne: true } }
      ],
    })
      .populate('sender', 'email firstName lastName image')
      .populate('traveler', 'email firstName lastName image')
      .populate({
        path: 'request',
        populate: { path: 'package' }
      })
      .sort({ updated_at: -1 });

    // Filter out conversations where request was deleted/null somehow or failed to populate
    const validConversations = conversations.filter(conv => conv.request && typeof conv.request === 'object');

    res.status(200).json({
      success: true,
      data: { conversations: validConversations },
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
    const userId = req.user._id;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    if (
      conversation.sender.toString() !== userId.toString() &&
      conversation.traveler.toString() !== userId.toString()
    ) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const messages = await Message.find({ conversation: conversationId })
      .populate('sender', 'email firstName lastName image')
      .sort({ timestamp: 1 });

    // Reset unread count for the current user
    if (conversation.sender.toString() === userId.toString()) {
      conversation.unread_count_sender = 0;
    } else {
      conversation.unread_count_traveler = 0;
    }
    await conversation.save();

    // Notify other participan via socket that this conversation was read (to update their UI)
    const io = req.app.get('io');
    if (io) {
      const populatedConv = await Conversation.findById(conversationId)
        .populate('sender', 'email firstName lastName image')
        .populate('traveler', 'email firstName lastName image');
      
      io.to(conversationId.toString()).emit('update_conversation', populatedConv);
      io.to(conversation.sender.toString()).emit('update_conversation', populatedConv);
      io.to(conversation.traveler.toString()).emit('update_conversation', populatedConv);
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

// REST endpoint to send a message
export const sendMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    if (!text) {
      return res.status(400).json({ success: false, message: 'Message text is required' });
    }

    const conversation = await Conversation.findById(conversationId)
      .populate('sender', 'email firstName lastName')
      .populate('traveler', 'email firstName lastName');

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    if (conversation.sender._id.toString() !== userId.toString() &&
      conversation.traveler._id.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const message = new Message({
      conversation: conversationId,
      sender: userId,
      text: text,
    });
    await message.save();

    conversation.last_message = text;
    conversation.updated_at = Date.now();

    let recipientId;
    let senderName = 'Someone';

    if (conversation.sender._id.toString() === userId.toString()) {
      conversation.unread_count_traveler += 1;
      recipientId = conversation.traveler._id;
      senderName = conversation.sender.firstName || 'Sender';
    } else {
      conversation.unread_count_sender += 1;
      recipientId = conversation.sender._id;
      senderName = conversation.traveler.firstName || 'Traveler';
    }

    await conversation.save();

    const messageData = {
      _id: message._id,
      id: message._id,
      conversationId,
      text,
      sender: userId,
      timestamp: message.timestamp,
    };

    const io = req.app.get('io');
    if (io) {
      const updatedConv = await Conversation.findById(conversationId)
        .populate('sender', 'email firstName lastName image')
        .populate('traveler', 'email firstName lastName image')
        .populate({
          path: 'request',
          populate: { path: 'package' }
        });

      io.to(conversationId.toString()).emit('new_message', messageData);
      io.to(conversation.sender._id.toString()).emit('update_conversation', updatedConv);
      io.to(conversation.traveler._id.toString()).emit('update_conversation', updatedConv);
    }

    // ✅ Send Push Notification
    if (recipientId) {
      await sendPushNotification(
        recipientId,
        `💬 New message from ${senderName}`,
        text.length > 50 ? text.substring(0, 47) + '...' : text,
        { conversationId, type: 'chat_message' }
      );
    }

    res.status(201).json({
      success: true,
      data: message,
      message: 'Message sent'
    });
  } catch (error) {
    console.error('Error in sendMessage REST:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const deleteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    const conversation = await Conversation.findById(conversationId).populate('request');
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    if (conversation.request && !['completed', 'cancelled', 'rejected'].includes(conversation.request.status)) {
       return res.status(400).json({ success: false, message: 'Can only delete inactive or completed chats' });
    }

    if (conversation.sender.toString() === userId.toString()) {
      conversation.deletedBySender = true;
    } else if (conversation.traveler.toString() === userId.toString()) {
      conversation.deletedByTraveler = true;
    } else {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    await conversation.save();
    res.status(200).json({ success: true, message: 'Conversation removed from inbox' });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

