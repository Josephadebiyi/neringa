import { query, queryOne, withTransaction } from './db.js';

const UNLOCK_NOTICE =
  'Bago Support has reviewed and unlocked this chat. Keep all shipment discussions, payments, and arrangements inside Bago.';

/** Find the conversation for an order (shipment request tracking number). */
export async function findConversationIdByOrderNumber(orderNumber) {
  const normalized = String(orderNumber || '').trim();
  if (!normalized) return null;
  const row = await queryOne(
    `select c.id
     from public.shipment_requests sr
     join public.conversations c
       on c.request_id = sr.id
       or (c.sender_id = sr.sender_id and c.traveler_id = sr.traveler_id)
     where upper(sr.tracking_number) = upper($1)
     order by (c.request_id = sr.id) desc, c.chat_locked desc, c.updated_at desc
     limit 1`,
    [normalized],
  );
  return row?.id || null;
}

export async function findActiveAdminIdByEmail(email) {
  if (!email) return null;
  const row = await queryOne(
    `select id from public.admin_users where lower(email) = lower($1) and is_active = true limit 1`,
    [email],
  );
  return row?.id || null;
}

/**
 * Everything an admin needs to decide: the order, both users, the lock state,
 * every flagged message (what was actually typed) and the recent chat history.
 */
export async function getChatModerationDetails(conversationId) {
  const conversation = await queryOne(
    `select c.id, c.chat_locked as "chatLocked", c.chat_lock_reason as "chatLockReason",
            c.chat_locked_at as "chatLockedAt", c.chat_policy_unlocked_at as "unlockedAt",
            c.chat_policy_unlock_note as "unlockNote", c.policy_warning_count as "warningCount",
            c.request_id as "requestId",
            sr.tracking_number as "orderNumber",
            c.sender_id as "senderId",
            concat_ws(' ', s.first_name, s.last_name) as "senderName", s.email as "senderEmail",
            c.traveler_id as "travelerId",
            concat_ws(' ', t.first_name, t.last_name) as "travelerName", t.email as "travelerEmail"
     from public.conversations c
     left join public.shipment_requests sr on sr.id = c.request_id
     left join public.profiles s on s.id = c.sender_id
     left join public.profiles t on t.id = c.traveler_id
     where c.id = $1`,
    [conversationId],
  );
  if (!conversation) return null;

  const [flags, messages] = await Promise.all([
    query(
      `select f.id, f.sender_id as "senderId",
              concat_ws(' ', p.first_name, p.last_name) as "senderName",
              f.message_content as "messageContent", f.reason_code as "reasonCode",
              f.reason, f.confidence, f.classifier_provider as "classifierProvider",
              f.enforcement_action as "enforcementAction",
              f.reviewed_at as "reviewedAt", f.review_notes as "reviewNotes",
              f.created_at as "createdAt"
       from public.chat_policy_flags f
       join public.profiles p on p.id = f.sender_id
       where f.conversation_id = $1
       order by f.created_at`,
      [conversationId],
    ),
    query(
      `select * from (
         select m.id, m.sender_id as "senderId",
                concat_ws(' ', p.first_name, p.last_name) as "senderName",
                m.content, m.metadata, m.created_at as "createdAt"
         from public.messages m
         left join public.profiles p on p.id = m.sender_id
         where m.conversation_id = $1
         order by m.created_at desc
         limit 50
       ) recent order by "createdAt"`,
      [conversationId],
    ),
  ]);

  return { conversation, flags: flags.rows, messages: messages.rows };
}

export async function unlockChat({ conversationId, adminId = null, note }) {
  const cleanNote = String(note || '').trim() || 'Unlocked by admin after review.';
  return withTransaction(async (client) => {
    const current = await client.query(
      `select id, chat_locked from public.conversations where id = $1 for update`,
      [conversationId],
    );
    if (!current.rows[0]) return null;
    if (!current.rows[0].chat_locked) {
      return { id: conversationId, chatLocked: false, alreadyUnlocked: true };
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
      [conversationId, adminId, cleanNote],
    );
    await client.query(
      `update public.chat_policy_flags
       set reviewed_at = coalesce(reviewed_at, timezone('utc', now())),
           reviewed_by = coalesce(reviewed_by, $2),
           review_notes = concat_ws(' | ', nullif(review_notes, ''), $3)
       where conversation_id = $1 and reviewed_at is null`,
      [conversationId, adminId, `Chat unlocked: ${cleanNote}`],
    );
    await client.query(
      `insert into public.messages (conversation_id, sender_id, content, metadata)
       select c.id, c.sender_id, $2, $3
       from public.conversations c where c.id = $1`,
      [conversationId, UNLOCK_NOTICE, {
        type: 'system',
        system: true,
        policyNotice: true,
        enforcementAction: 'chat_unlocked',
        adminId,
      }],
    );
    return { id: conversationId, chatLocked: false, alreadyUnlocked: false };
  });
}

/** Admin reviewed the lock and decided it stays. Marks the flags as reviewed. */
export async function keepChatLocked({ conversationId, adminId = null, note }) {
  const cleanNote = String(note || '').trim() || 'Reviewed by admin: chat stays locked.';
  return withTransaction(async (client) => {
    const current = await client.query(
      `select id, chat_locked from public.conversations where id = $1 for update`,
      [conversationId],
    );
    if (!current.rows[0]) return null;
    if (!current.rows[0].chat_locked) {
      return { id: conversationId, chatLocked: false, notLocked: true };
    }
    await client.query(
      `update public.chat_policy_flags
       set reviewed_at = coalesce(reviewed_at, timezone('utc', now())),
           reviewed_by = coalesce(reviewed_by, $2),
           review_notes = concat_ws(' | ', nullif(review_notes, ''), $3)
       where conversation_id = $1 and reviewed_at is null`,
      [conversationId, adminId, `Kept locked: ${cleanNote}`],
    );
    await client.query(
      `update public.conversations
       set chat_lock_reason = concat_ws(' | ', nullif(chat_lock_reason, ''), $2),
           updated_at = timezone('utc', now())
       where id = $1`,
      [conversationId, `Reviewed, kept locked: ${cleanNote}`],
    );
    return { id: conversationId, chatLocked: true, keptLocked: true };
  });
}
