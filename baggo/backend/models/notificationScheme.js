import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  request: { type: mongoose.Schema.Types.ObjectId, ref: 'Request' },
  isRead: { type: Boolean, default: false },
  readAt: { type: Date }, // New field to store when notification was marked as read
  createdAt: { type: Date, default: Date.now },
});

// TTL index to delete notifications where isRead: true after 6 days (518,400 seconds)
notificationSchema.index(
  { readAt: 1 },
  {
    expireAfterSeconds: 518400, // 6 days = 6 * 24 * 60 * 60 seconds
    partialFilterExpression: { isRead: true }, // Only delete if isRead: true
  }
);

export const Notification = mongoose.model('Notification', notificationSchema);