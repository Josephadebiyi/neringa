// backend/models/Conversation.js
import mongoose from 'mongoose';

const ConversationSchema = new mongoose.Schema({
  request: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Request',
    required: true,
  },
  trip: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    required: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  traveler: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  last_message: {
    type: String,
    default: '',
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
  unread_count_sender: {
    type: Number,
    default: 0,
  },
  unread_count_traveler: {
    type: Number,
    default: 0,
  },
});

export default mongoose.model('Conversation', ConversationSchema);