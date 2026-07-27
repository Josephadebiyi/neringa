import { query, queryOne, withTransaction } from '../../lib/postgres/db.js';

export async function getFlaggedChats(req, res, next) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const offset = (page - 1) * limit;
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
       order by f.created_at desc limit $1 offset $2`,
      [limit, offset],
    );
    const count = await queryOne('select count(*)::int as total from public.chat_policy_flags');
    return res.json({ success: true, data: result.rows, total: count?.total || 0, page, limit });
  } catch (error) {
    return next(error);
  }
}

export async function getFlaggedConversation(req, res, next) {
  try {
    const [flags, messages, conversation] = await Promise.all([
      query(
      `select f.*, concat_ws(' ', p.first_name, p.last_name) as sender_name
       from public.chat_policy_flags f join public.profiles p on p.id = f.sender_id
       where f.conversation_id = $1 order by f.created_at`,
      [req.params.id],
      ),
      query(
      `select m.id, m.sender_id, concat_ws(' ', p.first_name, p.last_name) as sender_name,
              m.content, m.metadata, m.created_at
       from public.messages m left join public.profiles p on p.id = m.sender_id
       where m.conversation_id = $1 order by m.created_at`,
      [req.params.id],
      ),
      queryOne(
        `select id, chat_locked as "chatLocked", chat_lock_reason as "chatLockReason",
                chat_locked_at as "chatLockedAt", chat_policy_unlocked_at as "unlockedAt",
                chat_policy_unlock_note as "unlockNote"
         from public.conversations where id = $1`,
        [req.params.id],
      ),
    ]);
    if (!conversation) return res.status(404).json({ success: false, message: 'Conversation not found.' });
    return res.json({ success: true, conversation, flags: flags.rows, messages: messages.rows });
  } catch (error) {
    return next(error);
  }
}

export async function unlockFlaggedConversation(req, res, next) {
  try {
    const note = String(req.body?.note || '').trim();
    if (note.length < 3) {
      return res.status(400).json({ success: false, message: 'An admin unlock note is required.' });
    }
    const adminId = req.admin?.id;
    const conversation = await withTransaction(async (client) => {
      const current = await client.query(
        `select id, chat_locked from public.conversations where id = $1 for update`,
        [req.params.id],
      );
      if (!current.rows[0]) return null;
      if (!current.rows[0].chat_locked) {
        return { id: req.params.id, chatLocked: false, alreadyUnlocked: true };
      }
      await client.query(
        `update public.conversations
         set chat_locked = false,
             chat_locked_at = null,
             chat_lock_reason = null,
             chat_locked_by = null,
             policy_warning_count = 0,
             chat_policy_unlocked_at = timezone('utc', now()),
             chat_policy_unlocked_by = $2,
             chat_policy_unlock_note = $3,
             updated_at = timezone('utc', now())
         where id = $1`,
        [req.params.id, adminId, note],
      );
      await client.query(
        `update public.chat_policy_flags
         set reviewed_at = coalesce(reviewed_at, timezone('utc', now())),
             reviewed_by = coalesce(reviewed_by, $2),
             review_notes = concat_ws(' | ', nullif(review_notes, ''), $3)
         where conversation_id = $1 and reviewed_at is null`,
        [req.params.id, adminId, `Chat unlocked: ${note}`],
      );
      await client.query(
        `insert into public.messages (conversation_id, sender_id, content, metadata)
         select c.id, c.sender_id,
                'Bago Support has reviewed and unlocked this chat. Keep all shipment discussions, payments, and arrangements inside Bago.',
                $2
         from public.conversations c where c.id = $1`,
        [req.params.id, {
          type: 'system',
          system: true,
          policyNotice: true,
          enforcementAction: 'chat_unlocked',
          adminId,
        }],
      );
      return { id: req.params.id, chatLocked: false, alreadyUnlocked: false };
    });
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }
    return res.json({ success: true, conversation, message: 'Chat unlocked successfully.' });
  } catch (error) {
    return next(error);
  }
}
