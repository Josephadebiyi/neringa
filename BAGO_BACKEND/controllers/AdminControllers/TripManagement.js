import { query, queryOne } from '../../lib/postgres/db.js';
import { sendPushNotification } from '../../services/pushNotificationService.js';
import { sendTripApprovedEmail, sendTripDeclinedEmail } from '../../services/emailNotifications.js';
import { updateTripRecord, ensureTripBatchColumn } from '../../lib/postgres/trips.js';

function normalizeTrip(row) {
  return {
    _id: row.id,
    id: row.id,
    tripNumber: row.trip_number,
    trip_number: row.trip_number,
    batchId: row.batch_id,
    userId: row.user_id,
    user: row.user_id
      ? {
          _id: row.user_id,
          id: row.user_id,
          firstName: row.first_name,
          lastName: row.last_name,
          email: row.email,
          phone: row.phone,
          accountType: row.account_type,
          companyName: row.company_name,
          tradingName: row.trading_name,
        }
      : null,
    fromLocation: row.from_location,
    fromCountry: row.from_country,
    toLocation: row.to_location,
    toCountry: row.to_country,
    departureDate: row.departure_date,
    arrivalDate: row.arrival_date,
    availableKg: Number(row.available_kg || 0),
    travelMeans: row.travel_means,
    status: row.status,
    request: Number(row.request_count || 0),
    pricePerKg: Number(row.price_per_kg || 0),
    currency: row.currency,
    landmark: row.landmark,
    travelDocument: row.travel_document_url,
    travelDocumentVerified: row.travel_document_verified,
    collectionCity: row.collection_city,
    collectionCountry: row.collection_country,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    soldShipments: Array.isArray(row.sold_shipments) ? row.sold_shipments : [],
  };
}

const adminTripSelect = `
  select
    t.*,
    p.first_name,
    p.last_name,
    p.email,
    p.phone,
    p.account_type,
    p.company_name,
    p.trading_name,
    coalesce(shipments.sold_shipments, '[]'::json) as sold_shipments
  from public.trips t
  left join public.profiles p on p.id = t.user_id
  left join lateral (
    select json_agg(
      json_build_object(
        'id', sr.id,
        'trackingNumber', sr.tracking_number,
        'status', sr.status,
        'amount', sr.amount,
        'currency', sr.currency,
        'senderId', sr.sender_id,
        'senderName', trim(concat_ws(' ', sender.first_name, sender.last_name)),
        'travelerId', sr.traveler_id,
        'packageId', sr.package_id,
        'packageTitle', coalesce(pkg.category, pkg.description),
        'packageDescription', pkg.description,
        'packageWeight', pkg.package_weight,
        'pickupAddress', pkg.pickup_address,
        'deliveryAddress', pkg.delivery_address,
        'receiverName', pkg.receiver_name,
        'receiverPhone', pkg.receiver_phone,
        'createdAt', sr.created_at,
        'updatedAt', sr.updated_at
      )
      order by sr.created_at desc
    ) as sold_shipments
    from public.shipment_requests sr
    left join public.profiles sender on sender.id = sr.sender_id
    left join public.packages pkg on pkg.id = sr.package_id
    where sr.trip_id = t.id
  ) shipments on true
`;

const LEGACY_BATCH_WINDOW_MS = 30 * 60 * 1000;

// Trips created before batch_id existed have no recorded link to the
// submission they came from. Reconstruct their probable batches by
// clustering same-user/same-route/same-price trips whose created_at
// timestamps land close together in time — exactly the signature of one
// multi-date submission (all inserted back-to-back in a single request).
// Purely a read-time heuristic — no data is written or migrated.
function clusterLegacyTrips(trips) {
  const submissionKey = (t) =>
    [t.userId, t.fromLocation, t.toLocation, t.travelMeans, t.pricePerKg, t.currency].join('|');

  const sorted = [...trips].sort((a, b) => {
    const keyA = submissionKey(a);
    const keyB = submissionKey(b);
    if (keyA !== keyB) return keyA < keyB ? -1 : 1;
    return new Date(a.createdAt) - new Date(b.createdAt);
  });

  const clusters = [];
  let currentKey = null;
  let lastCreatedAt = null;
  for (const trip of sorted) {
    const key = submissionKey(trip);
    const createdAt = new Date(trip.createdAt).getTime();
    const withinWindow = lastCreatedAt != null && createdAt - lastCreatedAt <= LEGACY_BATCH_WINDOW_MS;
    if (key === currentKey && withinWindow) {
      clusters[clusters.length - 1].push(trip);
    } else {
      clusters.push([trip]);
      currentKey = key;
    }
    lastCreatedAt = createdAt;
  }
  return clusters;
}

// Groups trips that were posted together (same batch_id — one multi-date
// submission) into a single entry with a date count, instead of one row per
// date. Trips without a batch_id (legacy rows) are clustered heuristically
// via clusterLegacyTrips; anything left over forms its own singleton batch.
export function groupTripsByBatch(trips) {
  const explicitGroups = new Map();
  const legacyTrips = [];
  for (const trip of trips) {
    if (trip.batchId) {
      if (!explicitGroups.has(trip.batchId)) explicitGroups.set(trip.batchId, []);
      explicitGroups.get(trip.batchId).push(trip);
    } else {
      legacyTrips.push(trip);
    }
  }

  const allGroups = [...explicitGroups.values(), ...clusterLegacyTrips(legacyTrips)];

  return allGroups.map((group) => {
    group.sort((a, b) => new Date(a.departureDate) - new Date(b.departureDate));
    const first = group[0];
    const statuses = new Set(group.map((t) => t.status));
    const groupKey = first.batchId || first.id;
    return {
      ...first,
      id: groupKey,
      _id: groupKey,
      batchId: groupKey,
      tripIds: group.map((t) => t.id),
      dateCount: group.length,
      dates: group.map((t) => ({
        id: t.id,
        departureDate: t.departureDate,
        arrivalDate: t.arrivalDate,
        status: t.status,
        availableKg: t.availableKg,
        soldShipments: t.soldShipments,
      })),
      status: statuses.size === 1 ? first.status : 'mixed',
      request: group.reduce((sum, t) => sum + (t.request || 0), 0),
      soldShipments: group.flatMap((t) => t.soldShipments || []),
      createdAt: group.reduce((min, t) => (t.createdAt < min ? t.createdAt : min), first.createdAt),
    };
  }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export const getTripById = async (req, res) => {
  try {
    const { id } = req.params;
    const row = await queryOne(`${adminTripSelect} where t.id = $1`, [id]);
    if (!row) return res.status(404).json({ success: false, message: 'Trip not found' });
    res.status(200).json({ success: true, data: normalizeTrip(row) });
  } catch (error) {
    console.error('Get Trip By ID Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllTrips = async (req, res) => {
  try {
    await ensureTripBatchColumn({ query });

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    // Group *before* paginating: individual date rows only ever belong to a
    // single posting, so slicing raw rows first (then grouping) can spread
    // one posting's rows across the row-budget of a page, silently pushing
    // other users' trips onto later pages. Grouping is done in memory
    // (cheap at current trip volumes), then the grouped list is paginated.
    const tripsResult = await query(`${adminTripSelect} order by t.created_at desc`);
    const groups = groupTripsByBatch(tripsResult.rows.map(normalizeTrip));

    res.status(200).json({
      success: true,
      data: groups.slice(skip, skip + limit),
      totalCount: groups.length,
      page,
      limit,
    });
  } catch (error) {
    console.error('Get All Trips Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateTripStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;
    const normalizedStatus = String(status || '').trim().toLowerCase();
    const nextStatus = ['verified', 'approved', 'live', 'active'].includes(normalizedStatus)
      ? 'active'
      : ['pending', 'pending_review', 'admin_review', 'pending_admin_review'].includes(normalizedStatus)
        ? 'pending_admin_review'
        : normalizedStatus;

    if (!nextStatus) {
      return res.status(400).json({ success: false, message: 'Trip status is required' });
    }

    const travelDocumentVerified = nextStatus === 'active'
      ? true
      : ['pending_admin_review', 'declined', 'cancelled'].includes(nextStatus)
        ? false
        : null;

    const updatedRow = await queryOne(
      `
        update public.trips
        set status = $2,
            travel_document_verified = coalesce($3, travel_document_verified),
            updated_at = timezone('utc', now())
        where id = $1
        returning id
      `,
      [id, nextStatus, travelDocumentVerified],
    );

    if (!updatedRow) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    const tripRow = await queryOne(`${adminTripSelect} where t.id = $1`, [id]);
    const trip = normalizeTrip(tripRow);

    const userEmail = trip.user?.email;
    const userName = trip.user?.firstName || 'Traveler';

    if (nextStatus === 'active' && trip.userId) {
      Promise.allSettled([
        sendPushNotification(
          trip.userId,
          'Trip Approved!',
          `Your trip from ${trip.fromLocation} to ${trip.toLocation} has been approved and is now live.`,
        ),
        userEmail ? sendTripApprovedEmail(userEmail, userName, trip) : Promise.resolve(),
      ]).then((results) => {
        results.forEach((result) => {
          if (result.status === 'rejected') {
            console.error('Trip approval notification failed:', result.reason);
          }
        });
      });
    } else if (nextStatus === 'declined' && trip.userId) {
      Promise.allSettled([
        sendPushNotification(
          trip.userId,
          'Trip Declined',
          `Your trip from ${trip.fromLocation} to ${trip.toLocation} was declined. Please check your travel documents and try again.`,
        ),
        userEmail ? sendTripDeclinedEmail(userEmail, userName, trip, reason) : Promise.resolve(),
      ]).then((results) => {
        results.forEach((result) => {
          if (result.status === 'rejected') {
            console.error('Trip decline notification failed:', result.reason);
          }
        });
      });
    }

    res.status(200).json({
      success: true,
      data: trip,
      message: 'Trip status updated successfully',
    });
  } catch (error) {
    console.error('Error updating trip status:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateTripPrice = async (req, res) => {
  try {
    const { id } = req.params;
    const { pricePerKg } = req.body;

    const existingRow = await queryOne(`${adminTripSelect} where t.id = $1`, [id]);
    if (!existingRow) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }
    const existing = normalizeTrip(existingRow);
    if (!existing.userId) {
      return res.status(409).json({ success: false, message: 'Trip has no owner on record' });
    }

    const currency = req.body.currency || existing.currency;
    const price = parseFloat(pricePerKg);
    if (!Number.isFinite(price) || price <= 0) {
      return res.status(400).json({ success: false, message: 'Price per kg must be a positive number' });
    }
    if (!currency) {
      return res.status(400).json({ success: false, message: 'Currency is required' });
    }

    const updates = { price_per_kg: price, currency };
    const updated = await updateTripRecord(id, existing.userId, updates);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    sendPushNotification(
      existing.userId,
      'Trip Price Updated',
      `An admin adjusted the price for your trip from ${existing.fromLocation} to ${existing.toLocation} to ${price} ${currency}/kg.`,
    ).catch((err) => console.error('Trip price update notification failed:', err.message));

    const tripRow = await queryOne(`${adminTripSelect} where t.id = $1`, [id]);

    res.status(200).json({
      success: true,
      data: normalizeTrip(tripRow),
      message: 'Trip price updated successfully',
    });
  } catch (error) {
    console.error('Error updating trip price:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteTrip = async (req, res) => {
  try {
    const { id } = req.params;
    const trip = await queryOne(`delete from public.trips where id = $1 returning id`, [id]);

    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Trip deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Batch-scoped variants ───────────────────────────────────────────────────
// A "batch" is every trip posted together from one multi-date submission
// (batch_id), or a single ungrouped trip addressed by its own id. These let
// admin approve/decline/reprice/delete an entire posting in one action
// instead of repeating it per date.

async function tripIdsInBatch(batchId) {
  await ensureTripBatchColumn({ query });
  const rows = await query(
    `select id from public.trips where batch_id::text = $1 or id::text = $1`,
    [batchId],
  );
  return rows.rows.map((r) => r.id);
}

export const updateTripStatusBatch = async (req, res) => {
  try {
    const { batchId } = req.params;
    const { status, reason } = req.body;
    const normalizedStatus = String(status || '').trim().toLowerCase();
    const nextStatus = ['verified', 'approved', 'live', 'active'].includes(normalizedStatus)
      ? 'active'
      : ['pending', 'pending_review', 'admin_review', 'pending_admin_review'].includes(normalizedStatus)
        ? 'pending_admin_review'
        : normalizedStatus;

    if (!nextStatus) {
      return res.status(400).json({ success: false, message: 'Trip status is required' });
    }

    const ids = await tripIdsInBatch(batchId);
    if (!ids.length) {
      return res.status(404).json({ success: false, message: 'Trip batch not found' });
    }

    const travelDocumentVerified = nextStatus === 'active'
      ? true
      : ['pending_admin_review', 'declined', 'cancelled'].includes(nextStatus)
        ? false
        : null;

    // Only touch dates still under admin review (or being re-approved/declined
    // from that state) — a batch can contain dates that already departed and
    // were auto-archived to 'completed', which a bulk Approve/Decline must
    // never reopen.
    await query(
      `
        update public.trips
        set status = $1,
            travel_document_verified = coalesce($2, travel_document_verified),
            updated_at = timezone('utc', now())
        where id = any($3::uuid[])
          and status not in ('completed', 'cancelled')
      `,
      [nextStatus, travelDocumentVerified, ids],
    );

    const rows = await query(`${adminTripSelect} where t.id = any($1::uuid[]) order by t.departure_date`, [ids]);
    const trips = rows.rows.map(normalizeTrip);
    const first = trips[0];
    const userEmail = first?.user?.email;
    const userName = first?.user?.firstName || 'Traveler';
    const dateNote = ids.length > 1 ? ` (${ids.length} dates)` : '';

    if (nextStatus === 'active' && first?.userId) {
      Promise.allSettled([
        sendPushNotification(
          first.userId,
          'Trip Approved!',
          `Your trip from ${first.fromLocation} to ${first.toLocation}${dateNote} has been approved and is now live.`,
        ),
        userEmail ? sendTripApprovedEmail(userEmail, userName, first) : Promise.resolve(),
      ]).then((results) => {
        results.forEach((result) => {
          if (result.status === 'rejected') console.error('Trip approval notification failed:', result.reason);
        });
      });
    } else if (nextStatus === 'declined' && first?.userId) {
      Promise.allSettled([
        sendPushNotification(
          first.userId,
          'Trip Declined',
          `Your trip from ${first.fromLocation} to ${first.toLocation}${dateNote} was declined. Please check your travel documents and try again.`,
        ),
        userEmail ? sendTripDeclinedEmail(userEmail, userName, first, reason) : Promise.resolve(),
      ]).then((results) => {
        results.forEach((result) => {
          if (result.status === 'rejected') console.error('Trip decline notification failed:', result.reason);
        });
      });
    }

    res.status(200).json({
      success: true,
      data: groupTripsByBatch(trips)[0],
      message: 'Trip status updated successfully',
    });
  } catch (error) {
    console.error('Error updating trip batch status:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateTripPriceBatch = async (req, res) => {
  try {
    const { batchId } = req.params;
    const { pricePerKg } = req.body;

    const ids = await tripIdsInBatch(batchId);
    if (!ids.length) {
      return res.status(404).json({ success: false, message: 'Trip batch not found' });
    }

    const firstRow = await queryOne(`${adminTripSelect} where t.id = $1`, [ids[0]]);
    const existing = normalizeTrip(firstRow);
    if (!existing.userId) {
      return res.status(409).json({ success: false, message: 'Trip has no owner on record' });
    }

    const currency = req.body.currency || existing.currency;
    const price = parseFloat(pricePerKg);
    if (!Number.isFinite(price) || price <= 0) {
      return res.status(400).json({ success: false, message: 'Price per kg must be a positive number' });
    }
    if (!currency) {
      return res.status(400).json({ success: false, message: 'Currency is required' });
    }

    await query(
      `update public.trips set price_per_kg = $1, currency = $2, updated_at = timezone('utc', now()) where id = any($3::uuid[])`,
      [price, currency, ids],
    );

    sendPushNotification(
      existing.userId,
      'Trip Price Updated',
      `An admin adjusted the price for your trip from ${existing.fromLocation} to ${existing.toLocation} to ${price} ${currency}/kg.`,
    ).catch((err) => console.error('Trip price update notification failed:', err.message));

    const rows = await query(`${adminTripSelect} where t.id = any($1::uuid[]) order by t.departure_date`, [ids]);
    res.status(200).json({
      success: true,
      data: groupTripsByBatch(rows.rows.map(normalizeTrip))[0],
      message: 'Trip price updated successfully',
    });
  } catch (error) {
    console.error('Error updating trip batch price:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteTripBatch = async (req, res) => {
  try {
    const { batchId } = req.params;
    const ids = await tripIdsInBatch(batchId);
    if (!ids.length) {
      return res.status(404).json({ success: false, message: 'Trip batch not found' });
    }

    await query(`delete from public.trips where id = any($1::uuid[])`, [ids]);

    res.status(200).json({
      success: true,
      message: ids.length > 1 ? `${ids.length} trips deleted successfully` : 'Trip deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
