import { get } from 'mongoose';
import Conversation from '../models/conversationScheme.js';
import Message from '../models/messageScheme.js';
import Request from '../models/RequestScheme.js';

export const messageController = (io) => {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join_conversation', (conversationId) => {
      socket.join(conversationId);
      console.log(`User ${socket.id} joined conversation ${conversationId}`);
    });

    socket.on('send_message', async ({ conversationId, senderId, text }) => {
      try {
        const conversation = await Conversation.findById(conversationId);
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
        if (conversation.sender.toString() === senderId) {
          conversation.unread_count_traveler += 1;
        } else if (conversation.traveler.toString() === senderId) {
          conversation.unread_count_sender += 1;
        }
        await conversation.save();

        io.to(conversationId).emit('new_message', {
          id: message._id,
          conversationId,
          text,
          sender: senderId,
          timestamp: message.timestamp,
        });

        const populatedConversation = await Conversation.findById(conversationId)
          .populate('sender', 'email firstName')
          .populate('traveler', 'email firstName');
        io.to(conversationId).emit('update_conversation', populatedConversation);
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
    const conversations = await Conversation.find({
      $or: [{ sender: userId }, { traveler: userId }],
    })
      .populate('sender', 'email firstName')
      .populate('traveler', 'email firstName')
      .sort({ updated_at: -1 });
  console.log("conversation",conversations  )
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
    const userId = req.user._id;

    // Find the conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    // Check if the user is a participant
    if (
      conversation.sender.toString() !== userId.toString() &&
      conversation.traveler.toString() !== userId.toString()
    ) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to conversation' });
    }

    // Fetch messages
    const messages = await Message.find({ conversation: conversationId })
      .populate('sender', 'email firstName');

    // Reset unread count for the user
    if (conversation.sender.toString() === userId.toString()) {
      conversation.unread_count_sender = 0;
    }
    if (conversation.traveler.toString() === userId.toString()) {
      conversation.unread_count_traveler = 0;
    }
    await conversation.save();

    // Emit socket event to update conversation in real-time
    const io = req.app.get('io'); // Assuming io is set up in your app
    io.to(conversationId).emit('update_conversation', conversation);

    console.log('Messages fetched and unread count reset:', {
      conversationId,
      userId,
      unread_count_sender: conversation.unread_count_sender,
      unread_count_traveler: conversation.unread_count_traveler,
      messageCount: messages.length,
    });

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
