import { query, queryOne } from '../../lib/postgres/db.js';
import {
  findConversationIdByOrderNumber,
  getChatModerationDetails,
  keepChatLocked,
  unlockChat,
} from '../../lib/postgres/chatModeration.js';

export async function getFlaggedChats(req, res, next) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const offset = (page - 1) * limit;
    // ?status=locked → only chats that are locked right now and still need a decision
    const onlyLocked = String(req.query.status || '').toLowerCase() === 'locked';
    const where = onlyLocked ? 'where c.chat_locked = true' : '';
    const result = await query(
      `select
         f.id, f.conversation_id as "conversationId", f.request_id as "requestId",
         f.message_id as "messageId", f.sender_id as "senderId",
         f.message_content as "messageContent", f.reason_code as "reasonCode",
         f.reason, f.confidence, f.classifier_provider as "classifierProvider",
         f.classifier_model as "classifierModel", f.enforcement_action as "enforcementAction",
         f.reviewed_at as "reviewedAt", f.review_notes as "reviewNotes",
         f.created_at as "createdAt",
         concat_ws(' ', sender.first_name, sender.last_name) as "senderName",
         sender.email as "senderEmail",
         c.chat_locked as "chatLocked", c.chat_lock_reason as "chatLockReason",
         sr.tracking_number as "trackingNumber"
       from public.chat_policy_flags f
       join public.conversations c on c.id = f.conversation_id
       join public.profiles sender on sender.id = f.sender_id
       left join public.shipment_requests sr on sr.id = f.request_id
       ${where}
       order by f.created_at desc limit $1 offset $2`,
      [limit, offset],
    );
    const count = await queryOne(
      `select count(*)::int as total from public.chat_policy_flags f
       join public.conversations c on c.id = f.conversation_id ${where}`,
    );
    return res.json({ success: true, data: result.rows, total: count?.total || 0, page, limit });
  } catch (error) {
    return next(error);
  }
}

export async function getFlaggedConversation(req, res, next) {
  try {
    const details = await getChatModerationDetails(req.params.id);
    if (!details) return res.status(404).json({ success: false, message: 'Conversation not found.' });
    return res.json({ success: true, ...details });
  } catch (error) {
    return next(error);
  }
}

// Look a chat up by the order number users and support quote (e.g. SVV2GVX93).
export async function getFlaggedConversationByOrder(req, res, next) {
  try {
    const conversationId = await findConversationIdByOrderNumber(req.params.orderNumber);
    if (!conversationId) return res.status(404).json({ success: false, message: 'No chat found for that order number.' });
    const details = await getChatModerationDetails(conversationId);
    return res.json({ success: true, ...details });
  } catch (error) {
    return next(error);
  }
}

export async function unlockFlaggedConversation(req, res, next) {
  try {
    const note = String(req.body?.note || '').trim().slice(0, 500);
    const conversation = await unlockChat({ conversationId: req.params.id, adminId: req.admin?.id, note });
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }
    if (!conversation.alreadyUnlocked) {
      req.app.get('io')?.to(String(req.params.id)).emit('chat_policy_action', {
        action: 'chat_unlocked',
        message: 'Bago Support has reviewed and unlocked this chat.',
      });
    }
    return res.json({
      success: true,
      conversation,
      message: conversation.alreadyUnlocked ? 'Chat was already unlocked.' : 'Chat unlocked successfully.',
    });
  } catch (error) {
    return next(error);
  }
}

export async function keepFlaggedConversationLocked(req, res, next) {
  try {
    const note = String(req.body?.note || '').trim().slice(0, 500);
    const conversation = await keepChatLocked({ conversationId: req.params.id, adminId: req.admin?.id, note });
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }
    return res.json({
      success: true,
      conversation,
      message: conversation.notLocked ? 'Chat is not locked; nothing changed.' : 'Chat kept locked and flags marked reviewed.',
    });
  } catch (error) {
    return next(error);
  }
}
