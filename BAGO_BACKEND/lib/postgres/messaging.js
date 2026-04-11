import { query, queryOne, withTransaction } from './db.js';

function normalizeConversation(row, currentUserId = null) {
  if (!row) return null;

  const sender = row.sender_id
    ? {
        _id: row.sender_id,
        id: row.sender_id,
        firstName: row.sender_first_name,
        lastName: row.sender_last_name,
        email: row.sender_email,
        image: row.sender_image_url,
        avatar: row.sender_image_url,
      }
    : null;

  const traveler = row.traveler_id
    ? {
        _id: row.traveler_id,
        id: row.traveler_id,
        firstName: row.traveler_first_name,
        lastName: row.traveler_last_name,
        email: row.traveler_email,
        image: row.traveler_image_url,
        avatar: row.traveler_image_url,
      }
    : null;

  return {
    _id: row.id,
    id: row.id,
    request: row.request_id
      ? {
          _id: row.request_id,
          id: row.request_id,
          status: row.request_status,
          trackingNumber: row.tracking_number,
          package: row.package_id
            ? {
                _id: row.package_id,
                id: row.package_id,
                description: row.package_description,
                packageWeight: Number(row.package_weight || 0),
                fromCity: row.package_from_city,
                fromCountry: row.package_from_country,
                toCity: row.package_to_city,
                toCountry: row.package_to_country,
                image: row.package_image_url,
              }
            : null,
        }
      : null,
    trip: row.trip_id ? { _id: row.trip_id, id: row.trip_id } : null,
    sender,
    traveler,
    last_message: row.last_message || '',
    lastMessage: row.last_message || '',
    updated_at: row.updated_at,
    updatedAt: row.updated_at,
    unread_count_sender: Number(row.unread_count_sender || 0),
    unread_count_traveler: Number(row.unread_count_traveler || 0),
    unreadCount:
      currentUserId && sender?._id === currentUserId
        ? Number(row.unread_count_sender || 0)
        : currentUserId && traveler?._id === currentUserId
          ? Number(row.unread_count_traveler || 0)
          : 0,
    deletedBySender: Boolean(row.deleted_by_sender),
    deletedByTraveler: Boolean(row.deleted_by_traveler),
  };
}

function normalizeMessage(row) {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    conversation: row.conversation_id,
    conversationId: row.conversation_id,
    sender: {
      _id: row.sender_id,
      id: row.sender_id,
      firstName: row.sender_first_name,
      lastName: row.sender_last_name,
      email: row.sender_email,
      image: row.sender_image_url,
      avatar: row.sender_image_url,
    },
    text: row.content,
    content: row.content,
    metadata: row.metadata || {},
    timestamp: row.created_at,
    createdAt: row.created_at,
    readAt: row.read_at,
  };
}

const conversationSelect = `
  select
    c.id,
    c.request_id,
    c.trip_id,
    c.sender_id,
    c.traveler_id,
    c.last_message,
    c.unread_count_sender,
    c.unread_count_traveler,
    c.deleted_by_sender,
    c.deleted_by_traveler,
    c.created_at,
    c.updated_at,
    sr.status as request_status,
    sr.tracking_number,
    pkg.id as package_id,
    pkg.description as package_description,
    pkg.package_weight,
    pkg.from_city as package_from_city,
    pkg.from_country as package_from_country,
    pkg.to_city as package_to_city,
    pkg.to_country as package_to_country,
    pkg.image_url as package_image_url,
    sender.first_name as sender_first_name,
    sender.last_name as sender_last_name,
    sender.email as sender_email,
    sender.image_url as sender_image_url,
    traveler.first_name as traveler_first_name,
    traveler.last_name as traveler_last_name,
    traveler.email as traveler_email,
    traveler.image_url as traveler_image_url
  from public.conversations c
  left join public.shipment_requests sr on sr.id = c.request_id
  left join public.packages pkg on pkg.id = sr.package_id
  left join public.profiles sender on sender.id = c.sender_id
  left join public.profiles traveler on traveler.id = c.traveler_id
`;

export async function getConversationById(conversationId, currentUserId = null) {
  const row = await queryOne(`${conversationSelect} where c.id = $1`, [conversationId]);
  return normalizeConversation(row, currentUserId);
}

export async function listUserConversations(userId) {
  const result = await query(
    `
      ${conversationSelect}
      where (
        (c.sender_id = $1 and c.deleted_by_sender = false)
        or
        (c.traveler_id = $1 and c.deleted_by_traveler = false)
      )
      order by c.updated_at desc
    `,
    [userId],
  );

  return result.rows.map((row) => normalizeConversation(row, userId));
}

export async function resolveConversationForUser({ userId, receiverId, requestId = null, tripId = null }) {
  const conditions = [
    `((c.sender_id = $1 and c.traveler_id = $2) or (c.sender_id = $2 and c.traveler_id = $1))`,
  ];
  const params = [userId, receiverId];
  let index = 3;

  if (requestId) {
    conditions.push(`c.request_id = $${index}`);
    params.push(requestId);
    index += 1;
  }

  if (tripId) {
    conditions.push(`c.trip_id = $${index}`);
    params.push(tripId);
  }

  const row = await queryOne(
    `
      ${conversationSelect}
      where ${conditions.join(' and ')}
      order by c.updated_at desc
      limit 1
    `,
    params,
  );

  return normalizeConversation(row, userId);
}

export async function listConversationMessages(conversationId) {
  const result = await query(
    `
      select
        m.id,
        m.conversation_id,
        m.sender_id,
        m.content,
        m.metadata,
        m.read_at,
        m.created_at,
        p.first_name as sender_first_name,
        p.last_name as sender_last_name,
        p.email as sender_email,
        p.image_url as sender_image_url
      from public.messages m
      join public.profiles p on p.id = m.sender_id
      where m.conversation_id = $1
      order by m.created_at asc
    `,
    [conversationId],
  );

  return result.rows.map(normalizeMessage);
}

export async function createConversationMessage({ conversationId, senderId, text }) {
  return withTransaction(async (client) => {
    const conversationResult = await client.query(
      `
        select *
        from public.conversations
        where id = $1
        for update
      `,
      [conversationId],
    );

    const conversation = conversationResult.rows[0];
    if (!conversation) return null;

    const requestResult = conversation.request_id
      ? await client.query(`select status from public.shipment_requests where id = $1`, [conversation.request_id])
      : { rows: [] };
    const requestStatus = requestResult.rows[0]?.status || null;

    if (requestStatus && ['completed', 'cancelled', 'rejected'].includes(requestStatus)) {
      const error = new Error('This conversation is closed');
      error.code = 'CONVERSATION_CLOSED';
      throw error;
    }

    if (![conversation.sender_id, conversation.traveler_id].includes(senderId)) {
      const error = new Error('Unauthorized');
      error.code = 'UNAUTHORIZED';
      throw error;
    }

    const messageResult = await client.query(
      `
        insert into public.messages (conversation_id, sender_id, content, metadata)
        values ($1, $2, $3, $4)
        returning id
      `,
      [conversationId, senderId, text, {}],
    );

    const senderIsSender = conversation.sender_id === senderId;

    await client.query(
      `
        update public.conversations
        set last_message = $2,
            updated_at = timezone('utc', now()),
            unread_count_sender = case when $3 then unread_count_sender else unread_count_sender + 1 end,
            unread_count_traveler = case when $3 then unread_count_traveler + 1 else unread_count_traveler end,
            deleted_by_sender = false,
            deleted_by_traveler = false
        where id = $1
      `,
      [conversationId, text, senderIsSender],
    );

    return {
      conversation: await getConversationById(conversationId, senderId),
      message: (await listConversationMessages(conversationId)).slice(-1)[0] || { id: messageResult.rows[0].id },
    };
  });
}

export async function markConversationRead(conversationId, userId) {
  const conversation = await getConversationById(conversationId, userId);
  if (!conversation) return null;
  if (conversation.sender?._id !== userId && conversation.traveler?._id !== userId) {
    const error = new Error('Unauthorized');
    error.code = 'UNAUTHORIZED';
    throw error;
  }

  await query(
    `
      update public.conversations
      set unread_count_sender = case when sender_id = $2 then 0 else unread_count_sender end,
          unread_count_traveler = case when traveler_id = $2 then 0 else unread_count_traveler end,
          updated_at = updated_at
      where id = $1
    `,
    [conversationId, userId],
  );

  await query(
    `
      update public.messages
      set read_at = timezone('utc', now())
      where conversation_id = $1
        and sender_id <> $2
        and read_at is null
    `,
    [conversationId, userId],
  );

  return getConversationById(conversationId, userId);
}

export async function getUnreadConversationCount(userId) {
  const row = await queryOne(
    `
      select
        coalesce(sum(
          case
            when sender_id = $1 and deleted_by_sender = false then unread_count_sender
            when traveler_id = $1 and deleted_by_traveler = false then unread_count_traveler
            else 0
          end
        ), 0) as count
      from public.conversations
      where sender_id = $1 or traveler_id = $1
    `,
    [userId],
  );

  return Number(row?.count || 0);
}

export async function softDeleteConversation(conversationId, userId) {
  const conversation = await getConversationById(conversationId, userId);
  if (!conversation) return null;
  if (conversation.request && !['completed', 'cancelled', 'rejected'].includes(conversation.request.status)) {
    const error = new Error('Can only delete inactive or completed chats');
    error.code = 'INVALID_STATUS';
    throw error;
  }

  await query(
    `
      update public.conversations
      set deleted_by_sender = case when sender_id = $2 then true else deleted_by_sender end,
          deleted_by_traveler = case when traveler_id = $2 then true else deleted_by_traveler end
      where id = $1
    `,
    [conversationId, userId],
  );

  return true;
}
