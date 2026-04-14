import { query, queryOne, withTransaction } from './db.js';

function toNumber(value, fallback = 0) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function normalizeProfile(row) {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    image: row.image_url,
    avatar: row.image_url,
    kycStatus: row.kyc_status,
    selectedAvatar: row.selected_avatar,
    preferredCurrency: row.preferred_currency,
    balance: toNumber(row.available_balance),
    escrowBalance: toNumber(row.escrow_balance),
    bankDetails: row.bank_details || {},
    paystackRecipientCode: row.paystack_recipient_code,
  };
}

function normalizePackage(row) {
  if (!row) return null;
  const images = Array.isArray(row.images) ? row.images : row.image_url ? [row.image_url] : [];
  return {
    _id: row.id,
    id: row.id,
    userId: row.user_id,
    fromCountry: row.from_country,
    fromCity: row.from_city,
    toCountry: row.to_country,
    toCity: row.to_city,
    packageWeight: toNumber(row.package_weight),
    value: toNumber(row.declared_value),
    receiverName: row.receiver_name,
    receiverEmail: row.receiver_email,
    receiverPhone: row.receiver_phone,
    receiverPhoneCountryCode: row.receiver_phone_country_code,
    description: row.description,
    image: row.image_url,
    images,
    packageImages: images,
    category: row.category,
    isRestricted: row.is_restricted,
    restrictedReason: row.restricted_reason,
    pickupAddress: row.pickup_address,
    deliveryAddress: row.delivery_address,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalizeTrip(row) {
  if (!row) return null;
  return {
    _id: row.trip_id || row.id,
    id: row.trip_id || row.id,
    userId: row.user_id,
    fromLocation: row.from_location,
    fromCountry: row.from_country,
    toLocation: row.to_location,
    toCountry: row.to_country,
    departureDate: row.departure_date,
    arrivalDate: row.arrival_date,
    availableKg: toNumber(row.available_kg),
    travelMeans: row.travel_means,
    status: row.trip_status || row.status,
    pricePerKg: toNumber(row.price_per_kg),
    currency: row.trip_currency || row.currency,
    landmark: row.landmark,
    travelDocument: row.travel_document_url,
    createdAt: row.trip_created_at || row.created_at,
    updatedAt: row.trip_updated_at || row.updated_at,
    user: row.user_id ? normalizeProfile({
      id: row.user_id,
      first_name: row.first_name,
      last_name: row.last_name,
      email: row.email,
      image_url: row.image_url,
      kyc_status: row.kyc_status,
      selected_avatar: row.selected_avatar,
    }) : null,
  };
}

function normalizeMovementTracking(entries) {
  if (!Array.isArray(entries)) return [];
  return entries.map((entry) => ({
    status: entry.status,
    location: entry.location || '',
    notes: entry.notes || '',
    timestamp: entry.timestamp || entry.createdAt || new Date().toISOString(),
  }));
}

function normalizeRequest(row) {
  if (!row) return null;
  const sender = row.sender_id ? {
    _id: row.sender_id,
    id: row.sender_id,
    firstName: row.sender_first_name,
    lastName: row.sender_last_name,
    email: row.sender_email,
    avatar: row.sender_image_url,
    image: row.sender_image_url,
  } : null;
  const traveler = row.traveler_id ? {
    _id: row.traveler_id,
    id: row.traveler_id,
    firstName: row.traveler_first_name,
    lastName: row.traveler_last_name,
    email: row.traveler_email,
    avatar: row.traveler_image_url,
    image: row.traveler_image_url,
    balance: toNumber(row.traveler_balance),
    escrowBalance: toNumber(row.traveler_escrow_balance),
  } : null;
  const packageModel = normalizePackage({
    id: row.package_id,
    user_id: row.package_owner_id,
    from_country: row.package_from_country,
    from_city: row.package_from_city,
    to_country: row.package_to_country,
    to_city: row.package_to_city,
    package_weight: row.package_weight,
    declared_value: row.package_declared_value,
    receiver_name: row.package_receiver_name,
    receiver_email: row.package_receiver_email,
    receiver_phone: row.package_receiver_phone,
    receiver_phone_country_code: row.package_receiver_phone_country_code,
    description: row.package_description,
    image_url: row.package_image_url,
    images: row.package_images,
    category: row.package_category,
    is_restricted: row.package_is_restricted,
    restricted_reason: row.package_restricted_reason,
    pickup_address: row.package_pickup_address,
    delivery_address: row.package_delivery_address,
    created_at: row.package_created_at,
    updated_at: row.package_updated_at,
  });
  const movementTracking = normalizeMovementTracking(row.movement_tracking);

  return {
    _id: row.id,
    id: row.id,
    senderId: row.sender_id,
    travelerId: row.traveler_id,
    carrierId: row.traveler_id,
    packageId: row.package_id,
    tripId: row.trip_id,
    sender,
    traveler,
    carrier: traveler,
    package: packageModel,
    trip: row.trip_id ? {
      _id: row.trip_id,
      id: row.trip_id,
      fromLocation: row.trip_from_location,
      toLocation: row.trip_to_location,
      departureDate: row.trip_departure_date,
      arrivalDate: row.trip_arrival_date,
    } : null,
    trackingNumber: row.tracking_number,
    image: row.image_url,
    senderProof: row.sender_proof_url,
    travelerProof: row.traveler_proof_url,
    senderReceived: row.sender_received,
    amount: toNumber(row.amount),
    agreedPrice: toNumber(row.amount),
    currency: row.currency,
    status: row.status,
    insurance: row.insurance,
    insuranceCost: toNumber(row.insurance_cost),
    paymentInfo: row.payment_info || {},
    estimatedDeparture: row.estimated_departure,
    estimatedArrival: row.estimated_arrival,
    movementTracking,
    dispute: row.dispute,
    termsAccepted: row.terms_accepted,
    termsAcceptedAt: row.terms_accepted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    senderName: sender ? `${sender.firstName || ''} ${sender.lastName || ''}`.trim() : null,
    senderEmail: sender?.email || null,
    travelerName: traveler ? `${traveler.firstName || ''} ${traveler.lastName || ''}`.trim() : null,
    travelerEmail: traveler?.email || null,
    carrierName: traveler ? `${traveler.firstName || ''} ${traveler.lastName || ''}`.trim() : null,
    carrierAvatar: traveler?.avatar || null,
    conversationId: row.conversation_id,
    role: row.role || null,
  };
}

const requestSelect = `
  select
    sr.id,
    sr.sender_id,
    sr.traveler_id,
    sr.package_id,
    sr.trip_id,
    sr.tracking_number,
    sr.image_url,
    sr.sender_proof_url,
    sr.traveler_proof_url,
    sr.sender_received,
    sr.amount,
    sr.currency,
    sr.status,
    sr.insurance,
    sr.insurance_cost,
    sr.payment_info,
    sr.estimated_departure,
    sr.estimated_arrival,
    sr.movement_tracking,
    sr.dispute,
    sr.terms_accepted,
    sr.terms_accepted_at,
    sr.created_at,
    sr.updated_at,
    sender.first_name as sender_first_name,
    sender.last_name as sender_last_name,
    sender.email as sender_email,
    sender.image_url as sender_image_url,
    traveler.first_name as traveler_first_name,
    traveler.last_name as traveler_last_name,
    traveler.email as traveler_email,
    traveler.image_url as traveler_image_url,
    traveler_wallet.available_balance as traveler_balance,
    traveler_wallet.escrow_balance as traveler_escrow_balance,
    pkg.user_id as package_owner_id,
    pkg.from_country as package_from_country,
    pkg.from_city as package_from_city,
    pkg.to_country as package_to_country,
    pkg.to_city as package_to_city,
    pkg.package_weight,
    pkg.declared_value as package_declared_value,
    pkg.receiver_name as package_receiver_name,
    pkg.receiver_email as package_receiver_email,
    pkg.receiver_phone as package_receiver_phone,
    pkg.receiver_phone_country_code as package_receiver_phone_country_code,
    pkg.description as package_description,
    pkg.image_url as package_image_url,
    pkg.images as package_images,
    pkg.category as package_category,
    pkg.is_restricted as package_is_restricted,
    pkg.restricted_reason as package_restricted_reason,
    pkg.pickup_address as package_pickup_address,
    pkg.delivery_address as package_delivery_address,
    pkg.created_at as package_created_at,
    pkg.updated_at as package_updated_at,
    t.from_location as trip_from_location,
    t.to_location as trip_to_location,
    t.departure_date as trip_departure_date,
    t.arrival_date as trip_arrival_date,
    c.id as conversation_id
  from public.shipment_requests sr
  left join public.profiles sender on sender.id = sr.sender_id
  left join public.profiles traveler on traveler.id = sr.traveler_id
  left join public.wallet_accounts traveler_wallet on traveler_wallet.user_id = sr.traveler_id
  left join public.packages pkg on pkg.id = sr.package_id
  left join public.trips t on t.id = sr.trip_id
  left join public.conversations c on c.request_id = sr.id
`;

export async function findProfileWithWallet(userId) {
  const row = await queryOne(
    `
      select p.id, p.first_name, p.last_name, p.email, p.image_url, p.kyc_status, p.selected_avatar,
             p.preferred_currency, p.bank_details, p.paystack_recipient_code,
             w.available_balance, w.escrow_balance, w.currency as wallet_currency
      from public.profiles p
      left join public.wallet_accounts w on w.user_id = p.id
      where p.id = $1
    `,
    [userId],
  );
  return normalizeProfile(row);
}

export async function searchTravelerTrips({ currentUserId, fromLocation, toLocation, fromCountry, toCountry, date }) {
  const conditions = ["t.status in ('verified', 'active')"];
  const params = [];
  let index = 1;

  if (currentUserId) {
    conditions.push(`t.user_id <> $${index}`);
    params.push(currentUserId);
    index += 1;
  }
  if (fromLocation) {
    conditions.push(`lower(t.from_location) like lower($${index})`);
    params.push(`%${fromLocation}%`);
    index += 1;
  }
  if (toLocation) {
    conditions.push(`lower(t.to_location) like lower($${index})`);
    params.push(`%${toLocation}%`);
    index += 1;
  }
  if (fromCountry) {
    conditions.push(`lower(coalesce(t.from_country, '')) like lower($${index})`);
    params.push(`%${fromCountry}%`);
    index += 1;
  }
  if (toCountry) {
    conditions.push(`lower(coalesce(t.to_country, '')) like lower($${index})`);
    params.push(`%${toCountry}%`);
    index += 1;
  }
  if (date) {
    conditions.push(`date(t.departure_date) >= date($${index})`);
    params.push(date);
    index += 1;
  } else {
    conditions.push(`date(t.departure_date) >= current_date`);
  }

  const result = await query(
    `
      select
        t.id,
        t.user_id,
        t.from_location,
        t.from_country,
        t.to_location,
        t.to_country,
        t.departure_date,
        t.arrival_date,
        t.available_kg,
        t.travel_means,
        t.status,
        t.price_per_kg,
        t.currency as trip_currency,
        t.landmark,
        t.travel_document_url,
        t.created_at as trip_created_at,
        t.updated_at as trip_updated_at,
        p.first_name,
        p.last_name,
        p.email,
        p.image_url,
        p.kyc_status,
        p.selected_avatar
      from public.trips t
      join public.profiles p on p.id = t.user_id
      where ${conditions.join(' and ')}
      order by t.departure_date asc, t.created_at desc
    `,
    params,
  );

  const trips = result.rows.map(normalizeTrip);
  const findUsers = trips.map((trip) => trip.user).filter(Boolean);
  return { trips, findUsers };
}

export async function createPackageRecord(data) {
  const row = await queryOne(
    `
      insert into public.packages (
        user_id, from_country, from_city, to_country, to_city, package_weight, declared_value,
        receiver_name, receiver_email, receiver_phone, receiver_phone_country_code,
        description, image_url, images, category, pickup_address, delivery_address
      )
      values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
      returning *
    `,
    [
      data.userId,
      data.fromCountry,
      data.fromCity,
      data.toCountry,
      data.toCity,
      data.packageWeight,
      data.value,
      data.receiverName,
      data.receiverEmail,
      data.receiverPhone,
      data.receiverPhoneCountryCode || '+1',
      data.description,
      data.imageUrl,
      data.images ?? [],
      data.category,
      data.pickupAddress,
      data.deliveryAddress,
    ],
  );
  return normalizePackage(row);
}

export async function deletePackageRecord(id, userId) {
  const deleted = await queryOne(
    `delete from public.packages where id = $1 and user_id = $2 returning id`,
    [id, userId],
  );
  return Boolean(deleted);
}

export async function getPackageById(id) {
  const row = await queryOne(`select * from public.packages where id = $1`, [id]);
  return normalizePackage(row);
}

export async function getTripById(id) {
  const row = await queryOne(
    `
      select t.id, t.user_id, t.from_location, t.from_country, t.to_location, t.to_country,
             t.departure_date, t.arrival_date, t.available_kg, t.travel_means, t.status,
             t.price_per_kg, t.currency as trip_currency, t.landmark, t.travel_document_url,
             t.created_at as trip_created_at, t.updated_at as trip_updated_at,
             p.first_name, p.last_name, p.email, p.image_url, p.kyc_status, p.selected_avatar
      from public.trips t
      join public.profiles p on p.id = t.user_id
      where t.id = $1
    `,
    [id],
  );
  return normalizeTrip(row);
}

export async function createNotification({ userId, title, body, type = 'general', payload = {} }) {
  await query(
    `insert into public.notifications (user_id, title, body, type, payload) values ($1,$2,$3,$4,$5)`,
    [userId, title, body, type, payload],
  );
}

export async function createConversationForRequest(requestId, senderId, travelerId, existingClient = null) {
  const run = async (client) => {
    const existing = await client.query(
      `select id from public.conversations where request_id = $1 limit 1`,
      [requestId],
    );
    if (existing.rows[0]?.id) return existing.rows[0].id;

    const requestResult = await client.query(
      `select trip_id from public.shipment_requests where id = $1`,
      [requestId],
    );
    const tripId = requestResult.rows[0]?.trip_id || null;

    const conversation = await client.query(
      `
        insert into public.conversations (request_id, trip_id, sender_id, traveler_id, last_message)
        values ($1, $2, $3, $4, $5)
        returning id
      `,
      [requestId, tripId, senderId, travelerId, 'Conversation started for accepted package request'],
    );
    const conversationId = conversation.rows[0].id;

    await client.query(
      `insert into public.conversation_participants (conversation_id, user_id) values ($1,$2),($1,$3) on conflict do nothing`,
      [conversationId, senderId, travelerId],
    );

    await client.query(
      `insert into public.messages (conversation_id, sender_id, content, metadata) values ($1,$2,$3,$4)`,
      [conversationId, travelerId, 'Conversation started for accepted package request', { system: true, requestId }],
    );

    return conversationId;
  };

  // If called within an existing transaction, reuse that client to avoid deadlock
  if (existingClient) return run(existingClient);
  return withTransaction(run);
}

export async function createShipmentRequestRecord({
  senderId,
  travelerId,
  packageId,
  tripId,
  amount,
  currency,
  imageUrl,
  insurance,
  insuranceCost,
  estimatedDeparture,
  estimatedArrival,
  termsAccepted,
  paymentInfo = {},
}) {
  const row = await queryOne(
    `
      insert into public.shipment_requests (
        sender_id, traveler_id, package_id, trip_id, amount, currency, image_url,
        insurance, insurance_cost, estimated_departure, estimated_arrival,
        terms_accepted, terms_accepted_at, payment_info
      )
      values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
      returning id
    `,
    [
      senderId,
      travelerId,
      packageId,
      tripId,
      amount,
      currency || 'USD',
      imageUrl || null,
      insurance,
      insuranceCost,
      estimatedDeparture,
      estimatedArrival,
      termsAccepted,
      termsAccepted ? new Date() : null,
      paymentInfo,
    ],
  );

  await query(`update public.trips set request_count = request_count + 1 where id = $1`, [tripId]);
  return getShipmentRequestById(row.id);
}

export async function getShipmentRequestById(id) {
  const row = await queryOne(`${requestSelect} where sr.id = $1`, [id]);
  return normalizeRequest(row);
}

export async function listRequestsForTrip(tripId) {
  const result = await query(`${requestSelect} where sr.trip_id = $1 order by sr.created_at desc`, [tripId]);
  return result.rows.map(normalizeRequest);
}

export async function listIncomingRequestsForTraveler(travelerId) {
  const result = await query(`${requestSelect} where sr.traveler_id = $1 order by sr.created_at desc`, [travelerId]);
  return result.rows.map(normalizeRequest);
}

export async function listRequestsForUser(userId) {
  const result = await query(`${requestSelect} where sr.sender_id = $1 order by sr.created_at desc`, [userId]);
  return result.rows.map(normalizeRequest);
}

export async function updateShipmentRequestStatus({ requestId, travelerId, status, location, notes }) {
  return withTransaction(async (client) => {
    const current = await client.query(`${requestSelect} where sr.id = $1`, [requestId]);
    const request = current.rows[0];
    if (!request) return null;
    if (request.traveler_id !== travelerId) {
      const error = new Error('Unauthorized to update this request');
      error.code = 'UNAUTHORIZED';
      throw error;
    }

    const normalizedStatus = status === 'completed' ? 'delivered' : status;

    let movementTracking = Array.isArray(request.movement_tracking) ? request.movement_tracking : [];
    if (['intransit', 'delivering', 'delivered'].includes(normalizedStatus)) {
      movementTracking = [
        ...movementTracking,
        {
          status: normalizedStatus,
          location: location || '',
          notes: notes || '',
          timestamp: new Date().toISOString(),
        },
      ];
    }

    let trackingNumber = request.tracking_number;
    if (status === 'intransit' && !trackingNumber) {
      trackingNumber = `BAGO-${String(Date.now( )).toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    }

    await client.query(
      `
        update public.shipment_requests
        set status = $2,
            tracking_number = coalesce($3, tracking_number),
            movement_tracking = $4,
            updated_at = timezone('utc', now())
        where id = $1
      `,
      [requestId, normalizedStatus, trackingNumber, JSON.stringify(movementTracking)],
    );

    if (normalizedStatus === 'accepted') {
      await createConversationForRequest(requestId, request.sender_id, request.traveler_id, client);
    }

    return getShipmentRequestById(requestId);
  });
}

export async function updateTravelerProof({ requestId, travelerId, travelerProofUrl }) {
  const current = await getShipmentRequestById(requestId);
  if (!current) return null;
  if (current.travelerId !== travelerId) {
    const error = new Error('Unauthorized');
    error.code = 'UNAUTHORIZED';
    throw error;
  }
  await query(
    `update public.shipment_requests set traveler_proof_url = $2, updated_at = timezone('utc', now()) where id = $1`,
    [requestId, travelerProofUrl],
  );
  return getShipmentRequestById(requestId);
}

export async function updatePaymentInfo({ requestId, paymentInfo }) {
  await query(
    `update public.shipment_requests set payment_info = $2, updated_at = timezone('utc', now()) where id = $1`,
    [requestId, paymentInfo],
  );
  return getShipmentRequestById(requestId);
}

export async function confirmShipmentReceived({ requestId, senderId }) {
  return withTransaction(async (client) => {
    const requestResult = await client.query(`${requestSelect} where sr.id = $1`, [requestId]);
    const request = requestResult.rows[0];
    if (!request) return null;
    if (request.sender_id !== senderId) {
      const error = new Error('Only sender can confirm receipt');
      error.code = 'UNAUTHORIZED';
      throw error;
    }
    if (request.sender_received) {
      const error = new Error('Already marked as received');
      error.code = 'ALREADY_DONE';
      throw error;
    }

    await client.query(
      `
        update public.shipment_requests
        set sender_received = true,
            status = 'completed',
            updated_at = timezone('utc', now())
        where id = $1
      `,
      [requestId],
    );

    const amount = toNumber(request.amount);
    if (amount > 0) {
      const walletResult = await client.query(
        `select id, available_balance, escrow_balance, currency from public.wallet_accounts where user_id = $1 for update`,
        [request.traveler_id],
      );
      const wallet = walletResult.rows[0];
      if (wallet) {
        await client.query(
          `
            update public.wallet_accounts
            set available_balance = available_balance + $2,
                escrow_balance = greatest(0, escrow_balance - $2),
                updated_at = timezone('utc', now())
            where user_id = $1
          `,
          [request.traveler_id, amount],
        );

        await client.query(
          `
            insert into public.wallet_transactions (wallet_id, user_id, request_id, trip_id, type, amount, currency, status, description, metadata)
            values ($1,$2,$3,$4,'escrow_release',$5,$6,'completed',$7,$8)
          `,
          [
            wallet.id,
            request.traveler_id,
            request.id,
            request.trip_id,
            amount,
            request.currency || wallet.currency || 'USD',
            `Funds released from escrow for Request ${request.tracking_number || request.id}`,
            { requestId: request.id },
          ],
        );
      }
    }

    return getShipmentRequestById(requestId);
  });
}

export async function getPublicTrackingByNumber(trackingNumber) {
  const row = await queryOne(`${requestSelect} where sr.tracking_number = $1`, [trackingNumber]);
  return normalizeRequest(row);
}

export async function listRecentOrdersForUser(userId) {
  const result = await query(
    `
      ${requestSelect}
      where sr.sender_id = $1 or sr.traveler_id = $1
      order by sr.created_at desc
    `,
    [userId],
  );

  return result.rows.map((row) => {
    const request = normalizeRequest(row);
    return {
      ...request,
      originCity: request.package?.fromCity || null,
      originCountry: request.package?.fromCountry || null,
      destinationCity: request.package?.toCity || null,
      destinationCountry: request.package?.toCountry || null,
      role: request.senderId === userId ? 'sender' : 'traveler',
    };
  });
}

export async function listCompletedRequestsByUser(userId) {
  const result = await query(
    `
      ${requestSelect}
      where (sr.sender_id = $1 or sr.traveler_id = $1)
        and sr.status = 'completed'
      order by sr.updated_at desc, sr.created_at desc
    `,
    [userId],
  );

  return result.rows.map(normalizeRequest);
}

export async function updateShipmentDates({ requestId, travelerId, estimatedDeparture, estimatedArrival }) {
  return withTransaction(async (client) => {
    const current = await client.query(`${requestSelect} where sr.id = $1`, [requestId]);
    const request = current.rows[0];
    if (!request) return null;
    if (request.traveler_id !== travelerId) {
      const error = new Error('Unauthorized to update this request');
      error.code = 'UNAUTHORIZED';
      throw error;
    }
    if (['rejected', 'cancelled', 'completed'].includes(request.status)) {
      const error = new Error('Cannot update dates for requests in this status');
      error.code = 'INVALID_STATUS';
      throw error;
    }

    await client.query(
      `
        update public.shipment_requests
        set estimated_departure = coalesce($2, estimated_departure),
            estimated_arrival = coalesce($3, estimated_arrival),
            updated_at = timezone('utc', now())
        where id = $1
      `,
      [requestId, estimatedDeparture, estimatedArrival],
    );

    return getShipmentRequestById(requestId);
  });
}

export async function updateRequestImage({ requestId, senderId, imageUrl }) {
  return withTransaction(async (client) => {
    const requestResult = await client.query(`${requestSelect} where sr.id = $1`, [requestId]);
    const request = requestResult.rows[0];
    if (!request) return null;
    if (request.sender_id !== senderId) {
      const error = new Error('Unauthorized');
      error.code = 'UNAUTHORIZED';
      throw error;
    }

    await client.query(
      `
        update public.shipment_requests
        set sender_proof_url = $2,
            updated_at = timezone('utc', now())
        where id = $1
      `,
      [requestId, imageUrl],
    );

    return getShipmentRequestById(requestId);
  });
}

export async function raiseShipmentDispute({ requestId, raisedBy, reason }) {
  const dispute = {
    raisedBy,
    reason,
    status: 'open',
    createdAt: new Date().toISOString(),
  };

  await query(
    `
      update public.shipment_requests
      set dispute = $2,
          updated_at = timezone('utc', now())
      where id = $1
    `,
    [requestId, dispute],
  );

  return getShipmentRequestById(requestId);
}

export async function listDisputedRequests() {
  const result = await query(
    `
      ${requestSelect}
      where sr.dispute is not null
      order by sr.updated_at desc, sr.created_at desc
    `,
  );

  return result.rows.map(normalizeRequest);
}

export async function updateDisputeStatus({ requestId, status, resolutionNote }) {
  const current = await getShipmentRequestById(requestId);
  if (!current || !current.dispute) return null;

  const nextDispute = {
    ...(current.dispute || {}),
    status,
    resolutionNote: resolutionNote || null,
    resolvedAt: status !== 'open' ? new Date().toISOString() : null,
  };

  await query(
    `
      update public.shipment_requests
      set dispute = $2,
          updated_at = timezone('utc', now())
      where id = $1
    `,
    [requestId, nextDispute],
  );

  return getShipmentRequestById(requestId);
}

export async function listNotificationsForUser(userId) {
  const result = await query(
    `
      select id, user_id, title, body, type, payload, read_at, created_at
      from public.notifications
      where user_id = $1
      order by created_at desc
    `,
    [userId],
  );

  return result.rows.map((row) => ({
    _id: row.id,
    id: row.id,
    user: userId,
    title: row.title,
    message: row.body,
    body: row.body,
    type: row.type,
    payload: row.payload || {},
    request: row.payload?.requestId || null,
    isRead: Boolean(row.read_at),
    readAt: row.read_at,
    createdAt: row.created_at,
  }));
}

export async function markAllNotificationsRead(userId) {
  await query(
    `
      update public.notifications
      set read_at = timezone('utc', now())
      where user_id = $1 and read_at is null
    `,
    [userId],
  );
}

export async function markNotificationRead(notificationId, userId) {
  return queryOne(
    `
      update public.notifications
      set read_at = timezone('utc', now())
      where id = $1 and user_id = $2
      returning id, user_id, title, body, type, payload, read_at, created_at
    `,
    [notificationId, userId],
  );
}
