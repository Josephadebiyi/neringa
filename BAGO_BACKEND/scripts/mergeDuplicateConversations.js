import dotenv from 'dotenv';

import { query, withTransaction } from '../lib/postgres/db.js';

dotenv.config();

const apply = process.argv.includes('--apply');

async function main() {
  const duplicateGroups = await query(`
    select
      sender_id,
      traveler_id,
      array_agg(id order by updated_at desc, created_at desc) as conversation_ids,
      count(*)::int as conversation_count
    from public.conversations
    where sender_id is not null
      and traveler_id is not null
    group by sender_id, traveler_id
    having count(*) > 1
    order by count(*) desc
  `);

  const report = [];

  for (const group of duplicateGroups.rows) {
    const conversationIds = group.conversation_ids || [];
    const primaryId = conversationIds[0];
    const duplicateIds = conversationIds.slice(1);
    if (!primaryId || duplicateIds.length === 0) continue;

    const messageCounts = await query(
      `
        select conversation_id, count(*)::int as count
        from public.messages
        where conversation_id = any($1::uuid[])
        group by conversation_id
      `,
      [conversationIds],
    );

    report.push({
      senderId: group.sender_id,
      travelerId: group.traveler_id,
      primaryConversationId: primaryId,
      mergedConversationIds: duplicateIds,
      messageCounts: messageCounts.rows,
    });

    if (!apply) continue;

    await withTransaction(async (client) => {
      await client.query(
        `
          update public.messages
          set conversation_id = $1
          where conversation_id = any($2::uuid[])
        `,
        [primaryId, duplicateIds],
      );

      await client.query(
        `
          insert into public.conversation_participants (conversation_id, user_id)
          select $1, user_id
          from public.conversation_participants
          where conversation_id = any($2::uuid[])
          on conflict do nothing
        `,
        [primaryId, duplicateIds],
      );

      const latestMessage = await client.query(
        `
          select content, created_at
          from public.messages
          where conversation_id = $1
          order by created_at desc
          limit 1
        `,
        [primaryId],
      );

      await client.query(
        `
          update public.conversations
          set last_message = coalesce($2, last_message),
              updated_at = coalesce($3, timezone('utc', now())),
              deleted_by_sender = false,
              deleted_by_traveler = false
          where id = $1
        `,
        [
          primaryId,
          latestMessage.rows[0]?.content || null,
          latestMessage.rows[0]?.created_at || null,
        ],
      );

      await client.query(
        `
          delete from public.conversation_participants
          where conversation_id = any($1::uuid[])
        `,
        [duplicateIds],
      );

      await client.query(
        `
          delete from public.conversations
          where id = any($1::uuid[])
        `,
        [duplicateIds],
      );
    });
  }

  console.log(JSON.stringify({
    mode: apply ? 'apply' : 'dry-run',
    duplicateGroups: report.length,
    report,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
