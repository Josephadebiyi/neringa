import { query } from './db.js';

function executorFor(client) {
  return client?.query ? client : { query };
}

export async function ensureOperationalRecords(client) {
  const executor = executorFor(client);
  await executor.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto`);
  await executor.query(`
    CREATE TABLE IF NOT EXISTS public.operational_records (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      entity_type TEXT NOT NULL,
      entity_id UUID,
      event_type TEXT NOT NULL,
      status TEXT,
      previous_status TEXT,
      actor_user_id UUID,
      sender_id UUID,
      traveler_id UUID,
      package_id UUID,
      trip_id UUID,
      amount NUMERIC,
      currency TEXT,
      item_category TEXT,
      item_description TEXT,
      package_weight NUMERIC,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
    )
  `);
  await executor.query(`
    CREATE INDEX IF NOT EXISTS operational_records_entity_idx
      ON public.operational_records (entity_type, entity_id, created_at DESC)
  `);
  await executor.query(`
    CREATE INDEX IF NOT EXISTS operational_records_trip_idx
      ON public.operational_records (trip_id, created_at DESC)
  `);
  await executor.query(`
    CREATE INDEX IF NOT EXISTS operational_records_package_idx
      ON public.operational_records (package_id, created_at DESC)
  `);
  await executor.query(`
    CREATE INDEX IF NOT EXISTS operational_records_user_idx
      ON public.operational_records (sender_id, traveler_id, created_at DESC)
  `);
}

export async function recordOperationalEvent(client, event) {
  const executor = executorFor(client);
  await ensureOperationalRecords(executor);
  await executor.query(
    `
      INSERT INTO public.operational_records (
        entity_type,
        entity_id,
        event_type,
        status,
        previous_status,
        actor_user_id,
        sender_id,
        traveler_id,
        package_id,
        trip_id,
        amount,
        currency,
        item_category,
        item_description,
        package_weight,
        metadata
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
    `,
    [
      event.entityType,
      event.entityId || null,
      event.eventType,
      event.status || null,
      event.previousStatus || null,
      event.actorUserId || null,
      event.senderId || null,
      event.travelerId || null,
      event.packageId || null,
      event.tripId || null,
      event.amount ?? null,
      event.currency || null,
      event.itemCategory || null,
      event.itemDescription || null,
      event.packageWeight ?? null,
      event.metadata || {},
    ],
  );
}
