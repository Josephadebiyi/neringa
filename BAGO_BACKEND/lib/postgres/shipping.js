import { randomInt } from 'crypto';
import { query, queryOne, withTransaction } from './db.js';
import { convertCurrency } from '../../services/currencyConverter.js';
import { recordOperationalEvent } from './operationalRecords.js';
import {
  buildTripCapacitySnapshot,
  ensureTripCapacityColumns,
  isTripPubliclyVisible,
  syncTripCapacity,
} from './tripCapacity.js';

function toNumber(value, fallback = 0) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

async function ensureShipmentBreakdownColumns(client) {
  const exec = client?.query ? (sql) => client.query(sql) : (sql) => query(sql);
  await exec(`
    ALTER TABLE public.shipment_requests
      ADD COLUMN IF NOT EXISTS traveler_payout NUMERIC,
      ADD COLUMN IF NOT EXISTS platform_commission NUMERIC,
      ADD COLUMN IF NOT EXISTS processing_fee NUMERIC,
      ADD COLUMN IF NOT EXISTS fx_buffer NUMERIC,
      ADD COLUMN IF NOT EXISTS sender_shipping_fee NUMERIC,
      ADD COLUMN IF NOT EXISTS bago_net_revenue NUMERIC,
      ADD COLUMN IF NOT EXISTS insurance_policy_id TEXT,
      ADD COLUMN IF NOT EXISTS insurance_policy_data JSONB,
      ADD COLUMN IF NOT EXISTS insurance_status TEXT NOT NULL DEFAULT 'not_selected',
      ADD COLUMN IF NOT EXISTS insurance_error TEXT,
      ADD COLUMN IF NOT EXISTS insurance_purchased_at TIMESTAMPTZ
  `);
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

function normalizeTripStatus(row) {
  const rawStatus = (row?.trip_status || row?.status || 'pending_admin_review').toString().toLowerCase();
  if (['active', 'verified', 'approved', 'live'].includes(rawStatus)) {
    return row?.travel_document_verified === true ? 'active' : 'pending';
  }
  if (['pending_admin_review', 'pending_review', 'admin_review'].includes(rawStatus)) {
    return 'pending';
  }
  return rawStatus;
}

function normalizeTrip(row) {
  if (!row) return null;
  const status = normalizeTripStatus(row);

  return {
    _id: row.trip_id || row.id,
    id: row.trip_id || row.id,
    tripNumber: row.trip_number,
    trip_number: row.trip_number,
    userId: row.user_id,
    fromLocation: row.from_location,
    fromCountry: row.from_country,
    toLocation: row.to_location,
    toCountry: row.to_country,
    departureDate: row.departure_date,
    arrivalDate: row.arrival_date,
    totalKg: toNumber(row.total_kg, toNumber(row.available_kg)),
    availableKg: toNumber(row.available_kg),
    soldKg: toNumber(row.sold_kg),
    reservedKg: toNumber(row.reserved_kg),
    remainingKg: toNumber(row.available_kg),
    travelMeans: row.travel_means,
    status,
    pricePerKg: toNumber(row.price_per_kg),
    currency: row.trip_currency || row.currency,
    landmark: row.landmark,
    travelDocument: row.travel_document_url,
    travelDocumentVerified: row.travel_document_verified,
    createdAt: row.trip_created_at || row.created_at,
    updatedAt: row.trip_updated_at || row.updated_at,
    activeShipmentCount: toNumber(row.active_shipment_count),
    bookingStatusSummary: row.booking_status_summary || 'No active bookings',
    grossSales: toNumber(row.gross_sales),
    commissionAmount: toNumber(row.commission_amount),
    travelerEarnings: toNumber(row.traveler_earnings),
    payoutAmount: toNumber(row.traveler_earnings),
    payoutStatus: row.payout_status || 'pending',
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
    image: row.image_url || row.package_image_url || null,
    senderProof: row.sender_proof_url,
    travelerProof: row.traveler_proof_url,
    senderReceived: row.sender_received,
    handoverPin: row.handover_pin || null,
    handoverPinUsed: row.handover_pin_used || false,
    amount: toNumber(row.amount),
    agreedPrice: toNumber(row.amount),
    senderTotalAmount: toNumber(row.amount),
    travelerPayout: toNumber(row.traveler_payout, toNumber(row.amount)),
    platformCommission: toNumber(row.platform_commission),
    processingFee: toNumber(row.processing_fee),
    fxBuffer: toNumber(row.fx_buffer),
    senderShippingFee: toNumber(row.sender_shipping_fee, toNumber(row.amount)),
    bagoNetRevenue: toNumber(row.bago_net_revenue),
    currency: row.currency,
    status: row.status,
    insurance: row.insurance,
    insuranceCost: toNumber(row.insurance_cost),
    insurancePolicyId: row.insurance_policy_id || null,
    insurancePolicyData: row.insurance_policy_data || null,
    insuranceStatus: row.insurance_status || (row.insurance_policy_id ? 'active' : row.insurance ? 'pending_purchase' : 'not_selected'),
    insuranceError: row.insurance_error || null,
    insurancePurchasedAt: row.insurance_purchased_at || null,
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
    sr.handover_pin,
    sr.handover_pin_used,
    sr.amount,
    sr.traveler_payout,
    sr.platform_commission,
    sr.processing_fee,
    sr.fx_buffer,
    sr.sender_shipping_fee,
    sr.bago_net_revenue,
    sr.currency,
    sr.status,
    sr.insurance,
    sr.insurance_cost,
    sr.insurance_policy_id,
    sr.insurance_policy_data,
    sr.insurance_status,
    sr.insurance_error,
    sr.insurance_purchased_at,
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
  left join lateral (
    select id from public.conversations
    where request_id = sr.id
       or (
        least(sender_id::text, traveler_id::text) = least(sr.sender_id::text, sr.traveler_id::text)
        and greatest(sender_id::text, traveler_id::text) = greatest(sr.sender_id::text, sr.traveler_id::text)
      )
    order by case when request_id = sr.id then 0 else 1 end, updated_at desc
    limit 1
  ) c on true
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

async function getTableColumns(tableName) {
  const result = await query(
    `
      select column_name
      from information_schema.columns
      where table_schema = 'public'
        and table_name = $1
    `,
    [tableName],
  );
  return new Set(result.rows.map((row) => row.column_name));
}

function columnOrNull(columns, alias, columnName, cast = '') {
  return columns.has(columnName) ? `t.${columnName}${cast} as ${alias}` : `null as ${alias}`;
}

function profileColumnOrNull(columns, alias, columnName) {
  return columns.has(columnName) ? `p.${columnName} as ${alias}` : `null as ${alias}`;
}

async function searchTravelerTripsCompat({ currentUserId, fromLocation, toLocation, fromCountry, toCountry, date }) {
  const tripColumns = await getTableColumns('trips');
  const profileColumns = await getTableColumns('profiles');
  const userIdColumn = tripColumns.has('user_id') ? 'user_id' : tripColumns.has('traveler_id') ? 'traveler_id' : null;
  const availableKgExpr = tripColumns.has('available_kg')
    ? 'coalesce(t.available_kg, 0)'
    : tripColumns.has('remaining_kg')
      ? 'coalesce(t.remaining_kg, 0)'
      : '0';
  const totalKgExpr = tripColumns.has('total_kg') ? 'coalesce(nullif(t.total_kg, 0), ' + availableKgExpr + ')' : availableKgExpr;
  const conditions = [];
  const params = [];
  let index = 1;

  if (tripColumns.has('status')) {
    conditions.push("coalesce(t.status::text, 'active') in ('verified', 'active', 'approved', 'live')");
  }
  if (tripColumns.has('travel_document_verified')) {
    conditions.push('coalesce(t.travel_document_verified, false) = true');
  }
  if (tripColumns.has('departure_date')) {
    conditions.push('date(t.departure_date) >= current_date');
  }
  conditions.push(`${availableKgExpr} > 0`);

  if (currentUserId && userIdColumn) {
    conditions.push(`t.${userIdColumn} <> $${index}`);
    params.push(currentUserId);
    index += 1;
  }

  const addLocationFilter = ({ location, country, locationColumn, countryColumn }) => {
    const terms = [
      location,
      country,
      ...(String(location || '').split(',').map((part) => part.trim())),
      ...(String(country || '').split(',').map((part) => part.trim())),
    ]
      .map((term) => String(term || '').trim())
      .filter(Boolean);
    const uniqueTerms = [...new Set(terms.map((term) => term.toLowerCase()))];
    const searchableColumns = [
      tripColumns.has(locationColumn) ? `lower(coalesce(t.${locationColumn}, ''))` : null,
      tripColumns.has(countryColumn) ? `lower(coalesce(t.${countryColumn}, ''))` : null,
    ].filter(Boolean);
    if (!uniqueTerms.length || !searchableColumns.length) return;

    const termClauses = [];
    for (const term of uniqueTerms) {
      termClauses.push(`(${searchableColumns.map((column) => `${column} like $${index}`).join(' or ')})`);
      params.push(`%${term}%`);
      index += 1;
    }
    conditions.push(`(${termClauses.join(' or ')})`);
  };

  addLocationFilter({
    location: fromLocation,
    country: fromCountry,
    locationColumn: 'from_location',
    countryColumn: 'from_country',
  });
  addLocationFilter({
    location: toLocation,
    country: toCountry,
    locationColumn: 'to_location',
    countryColumn: 'to_country',
  });

  if (date && tripColumns.has('departure_date')) {
    conditions.push(`date(t.departure_date) >= date($${index})`);
    params.push(date);
    index += 1;
  }

  const statusSelect = tripColumns.has('status') ? 't.status::text as status' : "'active' as status";
  const result = await query(
    `
      select
        t.id,
        ${columnOrNull(tripColumns, 'trip_number', 'trip_number')},
        ${userIdColumn ? `t.${userIdColumn}` : 'null'} as user_id,
        ${columnOrNull(tripColumns, 'from_location', 'from_location')},
        ${columnOrNull(tripColumns, 'from_country', 'from_country')},
        ${columnOrNull(tripColumns, 'to_location', 'to_location')},
        ${columnOrNull(tripColumns, 'to_country', 'to_country')},
        ${columnOrNull(tripColumns, 'departure_date', 'departure_date')},
        ${columnOrNull(tripColumns, 'arrival_date', 'arrival_date')},
        ${totalKgExpr} as total_kg,
        ${availableKgExpr} as available_kg,
        0 as sold_kg,
        0 as reserved_kg,
        ${tripColumns.has('travel_means') ? 't.travel_means' : tripColumns.has('mode_of_travel') ? 't.mode_of_travel' : 'null'} as travel_means,
        ${statusSelect},
        ${tripColumns.has('price_per_kg') ? 't.price_per_kg' : '0'} as price_per_kg,
        ${tripColumns.has('currency') ? 't.currency' : "'USD'"} as trip_currency,
        ${columnOrNull(tripColumns, 'landmark', 'landmark')},
        ${columnOrNull(tripColumns, 'travel_document_url', 'travel_document_url')},
        ${tripColumns.has('travel_document_verified') ? 't.travel_document_verified' : 'true'} as travel_document_verified,
        ${tripColumns.has('created_at') ? 't.created_at' : 'null'} as trip_created_at,
        ${tripColumns.has('updated_at') ? 't.updated_at' : 'null'} as trip_updated_at,
        ${profileColumnOrNull(profileColumns, 'first_name', 'first_name')},
        ${profileColumnOrNull(profileColumns, 'last_name', 'last_name')},
        ${profileColumnOrNull(profileColumns, 'email', 'email')},
        ${profileColumnOrNull(profileColumns, 'image_url', 'image_url')},
        ${profileColumnOrNull(profileColumns, 'kyc_status', 'kyc_status')},
        ${profileColumnOrNull(profileColumns, 'selected_avatar', 'selected_avatar')},
        0 as active_shipment_count,
        'No active bookings' as booking_status_summary,
        0 as gross_sales,
        0 as commission_amount,
        0 as traveler_earnings,
        'pending' as payout_status
      from public.trips t
      ${userIdColumn ? `left join public.profiles p on p.id = t.${userIdColumn}` : 'left join public.profiles p on false'}
      where ${conditions.length ? conditions.join(' and ') : 'true'}
      order by ${tripColumns.has('departure_date') ? 't.departure_date asc,' : ''} ${tripColumns.has('created_at') ? 't.created_at desc' : 't.id'}
      limit 200
    `,
    params,
  );

  const trips = result.rows.map(normalizeTrip);
  const findUsers = trips.map((trip) => trip.user).filter(Boolean);
  return { trips, findUsers };
}

export async function searchTravelerTrips({ currentUserId, fromLocation, toLocation, fromCountry, toCountry, date }) {
  await ensureTripCapacityColumns({ query }).catch((error) => {
    console.warn('Trip capacity schema check skipped during traveler search:', error.message);
  });
  const conditions = [
    "t.status::text in ('verified', 'active', 'approved', 'live')",
    'coalesce(t.travel_document_verified, false) = true',
    "date(t.departure_date) >= current_date",
    "greatest(0, coalesce(nullif(t.total_kg, 0), greatest(coalesce(t.available_kg, 0) + coalesce(trip_stats.sold_kg, 0) + coalesce(trip_stats.reserved_kg, 0), coalesce(t.available_kg, 0))) - coalesce(trip_stats.sold_kg, 0) - coalesce(trip_stats.reserved_kg, 0)) > 0",
  ];
  const params = [];
  let index = 1;

  const addLocationFilter = ({ location, country, locationColumn, countryColumn }) => {
    const terms = [
      location,
      country,
      ...(String(location || '').split(',').map((part) => part.trim())),
      ...(String(country || '').split(',').map((part) => part.trim())),
    ]
      .map((term) => String(term || '').trim())
      .filter(Boolean);
    const uniqueTerms = [...new Set(terms.map((term) => term.toLowerCase()))];
    if (!uniqueTerms.length) return;

    const termClauses = [];
    for (const term of uniqueTerms) {
      termClauses.push(`(
        lower(coalesce(${locationColumn}, '')) like $${index}
        or lower(coalesce(${countryColumn}, '')) like $${index}
      )`);
      params.push(`%${term}%`);
      index += 1;
    }
    conditions.push(`(${termClauses.join(' or ')})`);
  };

  if (currentUserId) {
    conditions.push(`t.user_id <> $${index}`);
    params.push(currentUserId);
    index += 1;
  }

  addLocationFilter({
    location: fromLocation,
    country: fromCountry,
    locationColumn: 't.from_location',
    countryColumn: 't.from_country',
  });
  addLocationFilter({
    location: toLocation,
    country: toCountry,
    locationColumn: 't.to_location',
    countryColumn: 't.to_country',
  });

  if (date) {
    conditions.push(`date(t.departure_date) >= date($${index})`);
    params.push(date);
    index += 1;
  }

  let result;
  try {
    result = await query(
      `
      select
        t.id,
        t.trip_number,
        t.user_id,
        t.from_location,
        t.from_country,
        t.to_location,
        t.to_country,
        t.departure_date,
        t.arrival_date,
        coalesce(nullif(t.total_kg, 0), greatest(coalesce(t.available_kg, 0) + coalesce(trip_stats.sold_kg, 0) + coalesce(trip_stats.reserved_kg, 0), coalesce(t.available_kg, 0))) as total_kg,
        greatest(0, coalesce(nullif(t.total_kg, 0), greatest(coalesce(t.available_kg, 0) + coalesce(trip_stats.sold_kg, 0) + coalesce(trip_stats.reserved_kg, 0), coalesce(t.available_kg, 0))) - coalesce(trip_stats.sold_kg, 0) - coalesce(trip_stats.reserved_kg, 0)) as available_kg,
        coalesce(trip_stats.sold_kg, 0) as sold_kg,
        coalesce(trip_stats.reserved_kg, 0) as reserved_kg,
        t.travel_means,
        t.status,
        t.price_per_kg,
        t.currency as trip_currency,
        t.landmark,
        t.travel_document_url,
        t.travel_document_verified,
        t.created_at as trip_created_at,
        t.updated_at as trip_updated_at,
        p.first_name,
        p.last_name,
        p.email,
        p.image_url,
        p.kyc_status,
        p.selected_avatar,
        trip_stats.active_shipment_count,
        trip_stats.booking_status_summary,
        coalesce(trip_stats.traveler_earnings, 0) as gross_sales,
        0::numeric as commission_amount,
        coalesce(trip_stats.traveler_earnings, 0) as traveler_earnings,
        case
          when coalesce(trip_stats.completed_booking_count, 0) > 0 then 'partially_paid'
          when coalesce(trip_stats.active_shipment_count, 0) > 0 then 'pending'
          else 'pending'
        end as payout_status
      from public.trips t
      join public.profiles p on p.id = t.user_id
      left join lateral (
        select
          coalesce(sum(case when sr.status = 'pending' then coalesce(pkg.package_weight, 0) else 0 end), 0) as reserved_kg,
          coalesce(sum(case when sr.status in ('accepted', 'intransit', 'delivering', 'completed') then coalesce(pkg.package_weight, 0) else 0 end), 0) as sold_kg,
          coalesce(sum(case when sr.status in ('accepted', 'intransit', 'delivering') then coalesce(pkg.package_weight, 0) else 0 end), 0) as pending_kg,
          coalesce(sum(
            case
              when sr.status in ('accepted', 'intransit', 'delivering', 'completed')
                then coalesce(sr.traveler_payout, sr.amount, 0)
              else 0
            end
          ), 0) as traveler_earnings,
          count(*) filter (where sr.status not in ('rejected', 'cancelled'))::int as active_shipment_count,
          count(*) filter (where sr.status = 'completed')::int as completed_booking_count,
          trim(
            both ' ' from concat_ws(
              ' · ',
              case when count(*) filter (where sr.status = 'pending') > 0 then (count(*) filter (where sr.status = 'pending'))::text || ' pending' end,
              case when count(*) filter (where sr.status = 'accepted') > 0 then (count(*) filter (where sr.status = 'accepted'))::text || ' approved' end,
              case when count(*) filter (where sr.status in ('intransit', 'delivering')) > 0 then (count(*) filter (where sr.status in ('intransit', 'delivering')))::text || ' in transit' end,
              case when count(*) filter (where sr.status = 'completed') > 0 then (count(*) filter (where sr.status = 'completed'))::text || ' delivered' end
            )
          ) as booking_status_summary
        from public.shipment_requests sr
        left join public.packages pkg on pkg.id = sr.package_id
        where sr.trip_id = t.id
      ) trip_stats on true
      where ${conditions.join(' and ')}
      order by t.departure_date asc, t.created_at desc
    `,
      params,
    );
  } catch (error) {
    console.warn('Primary traveler search failed; using compatibility query:', error.message);
    return searchTravelerTripsCompat({ currentUserId, fromLocation, toLocation, fromCountry, toCountry, date });
  }

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
      JSON.stringify(data.images ?? []),
      data.category,
      data.pickupAddress,
      data.deliveryAddress,
    ],
  );
  await recordOperationalEvent(null, {
    entityType: 'package',
    entityId: row.id,
    eventType: 'created',
    status: 'draft',
    actorUserId: data.userId,
    senderId: data.userId,
    packageId: row.id,
    amount: data.value,
    currency: data.currency || null,
    itemCategory: data.category,
    itemDescription: data.description,
    packageWeight: data.packageWeight,
    metadata: {
      fromCountry: data.fromCountry,
      fromCity: data.fromCity,
      toCountry: data.toCountry,
      toCity: data.toCity,
      hasImages: Array.isArray(data.images) && data.images.length > 0,
    },
  });
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
  await ensureTripCapacityColumns({ query });
  const row = await queryOne(
    `
      select t.id, t.trip_number, t.user_id, t.from_location, t.from_country, t.to_location, t.to_country,
             t.departure_date, t.arrival_date,
             coalesce(nullif(t.total_kg, 0), greatest(coalesce(t.available_kg, 0) + coalesce(trip_stats.sold_kg, 0) + coalesce(trip_stats.reserved_kg, 0), coalesce(t.available_kg, 0))) as total_kg,
             greatest(0, coalesce(nullif(t.total_kg, 0), greatest(coalesce(t.available_kg, 0) + coalesce(trip_stats.sold_kg, 0) + coalesce(trip_stats.reserved_kg, 0), coalesce(t.available_kg, 0))) - coalesce(trip_stats.sold_kg, 0) - coalesce(trip_stats.reserved_kg, 0)) as available_kg,
             coalesce(trip_stats.sold_kg, 0) as sold_kg,
             coalesce(trip_stats.reserved_kg, 0) as reserved_kg,
             t.travel_means, t.status,
             t.price_per_kg, t.currency as trip_currency, t.landmark, t.travel_document_url,
             t.travel_document_verified,
             t.created_at as trip_created_at, t.updated_at as trip_updated_at,
             p.first_name, p.last_name, p.email, p.image_url, p.kyc_status, p.selected_avatar,
             trip_stats.active_shipment_count,
             trip_stats.booking_status_summary,
             coalesce(trip_stats.traveler_earnings, 0) as gross_sales,
             0::numeric as commission_amount,
             coalesce(trip_stats.traveler_earnings, 0) as traveler_earnings,
             case
               when coalesce(trip_stats.completed_booking_count, 0) > 0 then 'partially_paid'
               when coalesce(trip_stats.active_shipment_count, 0) > 0 then 'pending'
               else 'pending'
             end as payout_status
      from public.trips t
      join public.profiles p on p.id = t.user_id
      left join lateral (
        select
          coalesce(sum(case when sr.status = 'pending' then coalesce(pkg.package_weight, 0) else 0 end), 0) as reserved_kg,
          coalesce(sum(case when sr.status in ('accepted', 'intransit', 'delivering', 'completed') then coalesce(pkg.package_weight, 0) else 0 end), 0) as sold_kg,
          coalesce(sum(case when sr.status in ('accepted', 'intransit', 'delivering') then coalesce(pkg.package_weight, 0) else 0 end), 0) as pending_kg,
          coalesce(sum(
            case
              when sr.status in ('accepted', 'intransit', 'delivering', 'completed')
                then coalesce(sr.traveler_payout, sr.amount, 0)
              else 0
            end
          ), 0) as traveler_earnings,
          count(*) filter (where sr.status not in ('rejected', 'cancelled'))::int as active_shipment_count,
          count(*) filter (where sr.status = 'completed')::int as completed_booking_count,
          trim(
            both ' ' from concat_ws(
              ' · ',
              case when count(*) filter (where sr.status = 'pending') > 0 then (count(*) filter (where sr.status = 'pending'))::text || ' pending' end,
              case when count(*) filter (where sr.status = 'accepted') > 0 then (count(*) filter (where sr.status = 'accepted'))::text || ' approved' end,
              case when count(*) filter (where sr.status in ('intransit', 'delivering')) > 0 then (count(*) filter (where sr.status in ('intransit', 'delivering')))::text || ' in transit' end,
              case when count(*) filter (where sr.status = 'completed') > 0 then (count(*) filter (where sr.status = 'completed'))::text || ' delivered' end
            )
          ) as booking_status_summary
        from public.shipment_requests sr
        left join public.packages pkg on pkg.id = sr.package_id
        where sr.trip_id = t.id
      ) trip_stats on true
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
    const requestResult = await client.query(
      `
        select
          sr.trip_id,
          sr.package_id,
          pkg.category,
          pkg.description,
          pkg.package_weight
        from public.shipment_requests sr
        left join public.packages pkg on pkg.id = sr.package_id
        where sr.id = $1
      `,
      [requestId],
    );
    const tripId = requestResult.rows[0]?.trip_id || null;
    const packageId = requestResult.rows[0]?.package_id || null;
    const packageCategory = requestResult.rows[0]?.category || null;
    const packageDescription = requestResult.rows[0]?.description || null;
    const packageWeight = requestResult.rows[0]?.package_weight || null;

    await client.query(
      `select pg_advisory_xact_lock(hashtext($1))`,
      [[senderId, travelerId].sort().join(':')],
    );

    const existing = await client.query(
      `
        select id
        from public.conversations
        where least(sender_id::text, traveler_id::text) = least($1::text, $2::text)
          and greatest(sender_id::text, traveler_id::text) = greatest($1::text, $2::text)
        order by updated_at desc
        limit 1
      `,
      [senderId, travelerId],
    );
    if (existing.rows[0]?.id) {
      const conversationId = existing.rows[0].id;
      const packageLabel = [packageCategory, packageDescription].filter(Boolean).join(' · ');
      const systemText = packageLabel
        ? `New shipment: ${packageLabel}`
        : 'New shipment added to this chat';
      await client.query(
        `insert into public.messages (conversation_id, sender_id, content, metadata) values ($1,$2,$3,$4)`,
        [
          conversationId,
          senderId,
          systemText,
          {
            system: true,
            requestId,
            packageId,
            packageCategory,
            packageDescription,
            packageWeight,
            type: 'shipment_request',
          },
        ],
      );
      await client.query(
        `
          update public.conversations
          set last_message = $2,
              updated_at = timezone('utc', now()),
              unread_count_traveler = unread_count_traveler + 1,
              deleted_by_sender = false,
              deleted_by_traveler = false
          where id = $1
        `,
        [conversationId, systemText],
      );
      return conversationId;
    }

    const initialPackageLabel = [packageCategory, packageDescription].filter(Boolean).join(' · ');
    const initialSystemText = initialPackageLabel
      ? `New shipment: ${initialPackageLabel}`
      : 'New shipment added to this chat';

    const conversation = await client.query(
      `
        insert into public.conversations (request_id, trip_id, sender_id, traveler_id, last_message)
        values ($1, $2, $3, $4, $5)
        returning id
      `,
      [requestId, tripId, senderId, travelerId, initialSystemText],
    );
    const conversationId = conversation.rows[0].id;

    await client.query(
      `insert into public.conversation_participants (conversation_id, user_id) values ($1,$2),($1,$3) on conflict do nothing`,
      [conversationId, senderId, travelerId],
    );

    await client.query(
      `insert into public.messages (conversation_id, sender_id, content, metadata) values ($1,$2,$3,$4)`,
      [
        conversationId,
        travelerId,
        initialSystemText,
        {
          system: true,
          requestId,
          packageId,
          packageCategory,
          packageDescription,
          packageWeight,
          type: 'shipment_request',
        },
      ],
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
  travelerPayout = null,
  platformCommission = null,
  processingFee = null,
  fxBuffer = null,
  senderShippingFee = null,
  bagoNetRevenue = null,
}) {
  const requestId = await withTransaction(async (client) => {
    await ensureTripCapacityColumns(client);
    await ensureShipmentBreakdownColumns(client);

    const packageResult = await client.query(
      `select id, package_weight, category, description from public.packages where id = $1 and user_id = $2`,
      [packageId, senderId],
    );
    const packageRow = packageResult.rows[0];
    if (!packageRow) {
      throw new Error('Package not found or not owned by sender');
    }

    const packageWeight = toNumber(packageRow.package_weight);
    if (packageWeight <= 0) {
      throw new Error('Package weight must be greater than 0kg');
    }

    const tripSnapshot = await buildTripCapacitySnapshot(client, tripId, { lockTrip: true });
    if (!tripSnapshot || tripSnapshot.userId !== travelerId) {
      throw new Error('Trip not found or not owned by traveler');
    }
    if (!isTripPubliclyVisible(tripSnapshot)) {
      throw new Error('This trip is no longer available for booking');
    }
    if (packageWeight > tripSnapshot.availableKg) {
      throw new Error('This trip does not have enough space left');
    }

    const row = await client.query(
      `
        insert into public.shipment_requests (
          sender_id, traveler_id, package_id, trip_id, amount, currency, image_url,
          insurance, insurance_cost, estimated_departure, estimated_arrival,
          terms_accepted, terms_accepted_at, payment_info, insurance_status,
          traveler_payout, platform_commission, processing_fee, fx_buffer,
          sender_shipping_fee, bago_net_revenue
        )
        values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
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
        insurance ? 'pending_purchase' : 'not_selected',
        travelerPayout,
        platformCommission,
        processingFee,
        fxBuffer,
        senderShippingFee,
        bagoNetRevenue,
      ],
    );

    await recordOperationalEvent(client, {
      entityType: 'shipment_request',
      entityId: row.rows[0].id,
      eventType: 'created',
      status: 'pending',
      actorUserId: senderId,
      senderId,
      travelerId,
      packageId,
      tripId,
      amount,
      currency: currency || 'USD',
      itemCategory: packageRow.category,
      itemDescription: packageRow.description,
      packageWeight,
      metadata: {
        paymentProvider: paymentInfo?.gateway || paymentInfo?.method || null,
        paymentReference: paymentInfo?.requestId || null,
        insurance: Boolean(insurance),
        insuranceCost,
        travelerPayout,
        senderShippingFee,
      },
    });

    await syncTripCapacity(client, tripId);
    return row.rows[0].id;
  });
  return getShipmentRequestById(requestId);
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
  const result = await query(
    `${requestSelect} where sr.traveler_id = $1
     order by sr.created_at desc`,
    [travelerId],
  );
  return result.rows.map(normalizeRequest);
}

export async function listRequestsForUser(userId) {
  const result = await query(
    `${requestSelect} where (sr.sender_id = $1 or sr.traveler_id = $1)
     order by sr.created_at desc`,
    [userId],
  );
  return result.rows.map(normalizeRequest);
}

export async function updateShipmentRequestStatus({ requestId, travelerId, status, location, notes }) {
  const updatedRequestId = await withTransaction(async (client) => {
    await ensureTripCapacityColumns(client);
    const current = await client.query(`${requestSelect} where sr.id = $1`, [requestId]);
    const request = current.rows[0];
    if (!request) return null;
    if (request.traveler_id !== travelerId) {
      const error = new Error('Unauthorized to update this request');
      error.code = 'UNAUTHORIZED';
      throw error;
    }

    // Traveler delivery is not final completion. Funds release only when the
    // sender confirms receipt through confirmShipmentReceived().
    const normalizedStatus = (status === 'completed' || status === 'delivered') ? 'delivering' : status;

    let movementTracking = Array.isArray(request.movement_tracking) ? request.movement_tracking : [];
    if (['intransit', 'delivering', 'completed'].includes(normalizedStatus) || status === 'delivered') {
      movementTracking = [
        ...movementTracking,
        {
          status: status === 'delivered' ? 'delivered' : normalizedStatus,
          location: location || '',
          notes: notes || '',
          timestamp: new Date().toISOString(),
        },
      ];
    }

    let trackingNumber = request.tracking_number;
    if ((status === 'accepted' || status === 'intransit') && !trackingNumber) {
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

    await recordOperationalEvent(client, {
      entityType: 'shipment_request',
      entityId: requestId,
      eventType: normalizedStatus === 'accepted'
        ? 'accepted'
        : normalizedStatus === 'rejected'
          ? 'rejected'
          : 'status_changed',
      status: normalizedStatus,
      previousStatus: request.status,
      actorUserId: travelerId,
      senderId: request.sender_id,
      travelerId: request.traveler_id,
      packageId: request.package_id,
      tripId: request.trip_id,
      amount: request.amount,
      currency: request.currency,
      itemCategory: request.package_category,
      itemDescription: request.package_description,
      packageWeight: request.package_weight,
      metadata: {
        location: location || null,
        notes: notes || null,
        trackingNumber,
      },
    });

    if (normalizedStatus === 'accepted') {
      await createConversationForRequest(requestId, request.sender_id, request.traveler_id, client);
      const handoverPin = String(randomInt(1000, 10000));
      await client.query(
        `UPDATE public.shipment_requests SET handover_pin = $1 WHERE id = $2 AND handover_pin IS NULL`,
        [handoverPin, requestId],
      );
    }

    if (request.trip_id) {
      await syncTripCapacity(client, request.trip_id);
    }

    return requestId;
  });
  return getShipmentRequestById(updatedRequestId);
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
    const lockResult = await client.query(`select id from public.shipment_requests where id = $1 for update`, [requestId]);
    if (!lockResult.rows[0]) return null;
    const requestResult = await client.query(`${requestSelect} where sr.id = $1`, [requestId]);
    const request = requestResult.rows[0];
    if (!request) return null;
    if (request.sender_id !== senderId) {
      const error = new Error('Only sender can confirm receipt');
      error.code = 'UNAUTHORIZED';
      throw error;
    }
    if (request.sender_received) {
      return getShipmentRequestById(requestId);
    }
    const allowedStatuses = ['delivering', 'delivered', 'awaiting_sender_confirmation', 'completed'];
    if (!allowedStatuses.includes(request.status)) {
      const error = new Error('Cannot confirm receipt until the traveler has marked the shipment as delivering or delivered');
      error.code = 'NOT_DELIVERED';
      throw error;
    }

    const stripePayment = await client.query(
      `select payment_status, stripe_payment_intent_id from public.shipment_requests where id = $1`,
      [requestId],
    ).then((result) => result.rows[0] || {}).catch(() => ({}));
    const stripePaymentIntentId = stripePayment.stripe_payment_intent_id || null;

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

    const rawAmount = toNumber(request.amount);
    const requestCurrency = (request.currency || 'USD').toUpperCase();
    if (rawAmount > 0) {
      // Deduct from sender's escrow — use the wallet_transaction escrow_hold amount (already in wallet currency)
      const senderWalletResult = await client.query(
        `select id, escrow_balance, currency from public.wallet_accounts where user_id = $1 for update`,
        [request.sender_id],
      );
      const senderWallet = senderWalletResult.rows[0];
      if (senderWallet) {
        const swCurrency = (senderWallet.currency || 'USD').toUpperCase();
        // Sum ALL escrow_hold txns for this request (additional-kg holds create multiple rows)
        const escrowTxResult = await client.query(
          `SELECT COALESCE(SUM(amount), 0) AS amount FROM public.wallet_transactions WHERE request_id=$1 AND user_id=$2 AND type='escrow_hold' AND status='completed'`,
          [request.id, request.sender_id],
        );
        const senderEscrowAmount = toNumber(escrowTxResult.rows[0]?.amount) ||
          (swCurrency !== requestCurrency ? await convertCurrency(rawAmount, requestCurrency, swCurrency) : rawAmount);

        await client.query(
          `update public.wallet_accounts set escrow_balance = greatest(0, escrow_balance - $2), updated_at = timezone('utc', now()) where user_id = $1`,
          [request.sender_id, senderEscrowAmount],
        );
        await client.query(
          `insert into public.wallet_transactions (wallet_id, user_id, request_id, trip_id, type, amount, currency, status, description, metadata)
           values ($1,$2,$3,$4,'escrow_release',$5,$6,'completed',$7,$8)`,
          [senderWallet.id, request.sender_id, request.id, request.trip_id,
           senderEscrowAmount, swCurrency,
           `Escrow released — payment for ${request.tracking_number || request.id}`,
           JSON.stringify({ requestId: request.id })],
        );
      }

      // Credit traveler's available balance — look up what was escrowed for traveler
      const travelerWalletResult = await client.query(
        `select id, currency from public.wallet_accounts where user_id = $1 for update`,
        [request.traveler_id],
      );
      const travelerWallet = travelerWalletResult.rows[0];
      if (travelerWallet) {
        const existingCredit = await client.query(
          `select id from public.wallet_transactions where request_id = $1 and user_id = $2 and type = 'earning' limit 1`,
          [request.id, request.traveler_id],
        );
        if (existingCredit.rows[0]?.id) {
          const escrowTxResult = await client.query(
            `SELECT COALESCE(SUM(amount), 0) AS amount FROM public.wallet_transactions WHERE request_id=$1 AND user_id=$2 AND type='escrow_hold' AND status='completed'`,
            [request.id, request.traveler_id],
          );
          const heldAmount = toNumber(escrowTxResult.rows[0]?.amount);
          if (heldAmount > 0) {
            await client.query(
              `update public.wallet_accounts set escrow_balance = greatest(0, escrow_balance - $2), updated_at = timezone('utc', now()) where user_id = $1`,
              [request.traveler_id, heldAmount],
            );
          }
        await client.query(
          `
            update public.shipment_ledgers
            set escrow_status = 'released',
                payout_status = 'available',
                wallet_credit_created = true,
                updated_at = timezone('utc', now())
            where shipment_id = $1
          `,
          [request.id],
        ).catch(() => {});
        await client.query(
          `
            update public.shipment_requests
            set payment_status = case
                  when stripe_payment_intent_id is not null then 'released'
                  else payment_status
                end,
                payment_info = case
                  when stripe_payment_intent_id is not null then coalesce(payment_info, '{}'::jsonb) || $2::jsonb
                  else payment_info
                end,
                captured_at = case
                  when stripe_payment_intent_id is not null then timezone('utc', now())
                  else captured_at
                end,
                updated_at = timezone('utc', now())
            where id = $1
          `,
          [
            request.id,
            {
              method: 'stripe',
              gateway: 'stripe',
              status: 'released',
              paymentIntentId: stripePaymentIntentId,
              releasedBy: 'sender_confirmation',
            },
          ],
        ).catch(() => {});
        if (stripePaymentIntentId) {
          await client.query(
            `
              update public.payments
              set status = 'released',
                  raw_response = coalesce(raw_response, '{}'::jsonb) || $2::jsonb,
                  updated_at = timezone('utc', now())
              where stripe_payment_intent_id = $1
            `,
            [
              stripePaymentIntentId,
              { releasedBy: 'sender_confirmation', requestId: request.id },
            ],
          ).catch(() => {});
        }
          return getShipmentRequestById(requestId);
        }

        const twCurrency = (travelerWallet.currency || 'USD').toUpperCase();
        const escrowTxResult = await client.query(
          `SELECT COALESCE(SUM(amount), 0) AS amount FROM public.wallet_transactions WHERE request_id=$1 AND user_id=$2 AND type='escrow_hold' AND status='completed'`,
          [request.id, request.traveler_id],
        );
        const travelerCreditAmount = toNumber(escrowTxResult.rows[0]?.amount) ||
          (twCurrency !== requestCurrency ? await convertCurrency(rawAmount, requestCurrency, twCurrency) : rawAmount);

        await client.query(
          `update public.wallet_accounts set available_balance = available_balance + $2, escrow_balance = greatest(0, escrow_balance - $2), updated_at = timezone('utc', now()) where user_id = $1`,
          [request.traveler_id, travelerCreditAmount],
        );
        await client.query(
          `insert into public.wallet_transactions (wallet_id, user_id, request_id, trip_id, type, amount, currency, status, description, metadata)
           values ($1,$2,$3,$4,'earning',$5,$6,'completed',$7,$8)`,
          [travelerWallet.id, request.traveler_id, request.id, request.trip_id,
           travelerCreditAmount, twCurrency,
           `Earned for delivering ${request.tracking_number || request.id}`,
           JSON.stringify({ requestId: request.id })],
        );
        await client.query(
          `
            update public.shipment_ledgers
            set escrow_status = 'released',
                payout_status = 'available',
                wallet_credit_created = true,
                updated_at = timezone('utc', now())
            where shipment_id = $1
          `,
          [request.id],
        ).catch(() => {});
        await client.query(
          `
            update public.shipment_requests
            set payment_status = case
                  when stripe_payment_intent_id is not null then 'released'
                  else payment_status
                end,
                payment_info = case
                  when stripe_payment_intent_id is not null then coalesce(payment_info, '{}'::jsonb) || $2::jsonb
                  else payment_info
                end,
                captured_at = case
                  when stripe_payment_intent_id is not null then timezone('utc', now())
                  else captured_at
                end,
                updated_at = timezone('utc', now())
            where id = $1
          `,
          [
            request.id,
            {
              method: 'stripe',
              gateway: 'stripe',
              status: 'released',
              paymentIntentId: stripePaymentIntentId,
              releasedBy: 'sender_confirmation',
            },
          ],
        ).catch(() => {});
        if (stripePaymentIntentId) {
          await client.query(
            `
              update public.payments
              set status = 'released',
                  raw_response = coalesce(raw_response, '{}'::jsonb) || $2::jsonb,
                  updated_at = timezone('utc', now())
              where stripe_payment_intent_id = $1
            `,
            [
              stripePaymentIntentId,
              { releasedBy: 'sender_confirmation', requestId: request.id },
            ],
          ).catch(() => {});
        }
      }
    }

    return getShipmentRequestById(requestId);
  });
}

export async function getPublicTrackingByNumber(trackingNumber) {
  const row = await queryOne(`${requestSelect} where sr.tracking_number = $1`, [trackingNumber]);
  const request = normalizeRequest(row);
  if (!request) return null;
  const { movementTracking, ...publicRequest } = request;
  return publicRequest;
}

export async function listRecentOrdersForUser(userId) {
  const [requestsResult, draftsResult] = await Promise.all([
    query(
      `${requestSelect} where (sr.sender_id = $1 or sr.traveler_id = $1) order by sr.created_at desc`,
      [userId],
    ),
    // Packages the user created that have no associated shipment request yet (pre-payment drafts)
    query(
      `select p.*,
              pr.first_name as sender_first_name, pr.last_name as sender_last_name,
              pr.email as sender_email, pr.image_url as sender_image_url
       from public.packages p
       left join public.profiles pr on pr.id = p.user_id
       where p.user_id = $1
         and not exists (
           select 1 from public.shipment_requests sr where sr.package_id = p.id
         )
       order by p.created_at desc`,
      [userId],
    ),
  ]);

  const requests = requestsResult.rows.map((row) => {
    const request = normalizeRequest(row);
    const { movementTracking, ...safeRequest } = request;
    return {
      ...safeRequest,
      originCity: request.package?.fromCity || null,
      originCountry: request.package?.fromCountry || null,
      destinationCity: request.package?.toCity || null,
      destinationCountry: request.package?.toCountry || null,
      role: request.senderId === userId ? 'sender' : 'traveler',
    };
  });

  const drafts = draftsResult.rows.map((row) => {
    const pkg = normalizePackage(row);
    return {
      _id: row.id,
      id: row.id,
      senderId: userId,
      travelerId: null,
      carrierId: null,
      packageId: row.id,
      tripId: null,
      sender: {
        _id: userId, id: userId,
        firstName: row.sender_first_name, lastName: row.sender_last_name,
        email: row.sender_email, avatar: row.sender_image_url, image: row.sender_image_url,
      },
      traveler: null, carrier: null,
      package: pkg,
      trip: null,
      trackingNumber: null,
      image: row.image_url || null,
      senderProof: null, travelerProof: null,
      senderReceived: false,
      handoverPin: null, handoverPinUsed: false,
      amount: 0, agreedPrice: 0,
      currency: row.currency || '',
      status: 'draft',
      insurance: false, insuranceCost: 0, insurancePolicyId: null,
      paymentInfo: {},
      estimatedDeparture: null, estimatedArrival: null,
      dispute: null,
      termsAccepted: false, termsAcceptedAt: null,
      createdAt: row.created_at, updatedAt: row.updated_at,
      senderName: `${row.sender_first_name || ''} ${row.sender_last_name || ''}`.trim(),
      senderEmail: row.sender_email || null,
      travelerName: null, travelerEmail: null,
      carrierName: null, carrierAvatar: null,
      conversationId: null,
      role: 'sender',
      originCity: row.from_city || null,
      originCountry: row.from_country || null,
      destinationCity: row.to_city || null,
      destinationCountry: row.to_country || null,
    };
  });

  return [...requests, ...drafts].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  );
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

/**
 * Traveler enters the 4-digit handover PIN (shown to sender in their app and
 * emailed to the receiver). On success, triggers escrow release without waiting
 * for the sender to manually confirm. Max 5 wrong attempts before lockout.
 */
export async function redeemHandoverToken({ requestId, pin, travelerId }) {
  return withTransaction(async (client) => {
    const row = await client.query(
      `SELECT id, handover_pin, handover_pin_used, handover_pin_attempts, traveler_id, status
       FROM public.shipment_requests WHERE id = $1 FOR UPDATE`,
      [requestId],
    );
    if (!row.rows[0]) {
      const err = new Error('Shipment request not found');
      err.code = 'NOT_FOUND';
      throw err;
    }
    const sr = row.rows[0];

    if (String(sr.traveler_id) !== String(travelerId)) {
      const err = new Error('Only the assigned traveler can confirm this handover');
      err.code = 'UNAUTHORIZED';
      throw err;
    }
    if (sr.handover_pin_used) {
      const err = new Error('This handover PIN has already been used');
      err.code = 'ALREADY_USED';
      throw err;
    }
    if ((sr.handover_pin_attempts || 0) >= 5) {
      const err = new Error('Too many incorrect PIN attempts. Contact support to proceed.');
      err.code = 'TOO_MANY_ATTEMPTS';
      throw err;
    }
    if (!sr.handover_pin) {
      const err = new Error('No handover PIN set for this shipment. It may not be in the accepted state yet.');
      err.code = 'NO_PIN';
      throw err;
    }

    const allowed = ['accepted', 'intransit', 'delivering', 'awaiting_sender_confirmation'];
    if (!allowed.includes(sr.status)) {
      const err = new Error(`Cannot confirm handover for a shipment with status: ${sr.status}`);
      err.code = 'INVALID_STATUS';
      throw err;
    }

    if (String(sr.handover_pin).trim() !== String(pin).trim()) {
      await client.query(
        `UPDATE public.shipment_requests SET handover_pin_attempts = handover_pin_attempts + 1 WHERE id = $1`,
        [requestId],
      );
      const remaining = 5 - ((sr.handover_pin_attempts || 0) + 1);
      const err = new Error(`Incorrect PIN. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`);
      err.code = 'WRONG_PIN';
      throw err;
    }

    // PIN correct — mark used and complete the shipment atomically
    await client.query(
      `UPDATE public.shipment_requests
       SET handover_pin_used = TRUE,
           handover_pin_used_at = timezone('utc', now()),
           sender_received = TRUE,
           status = 'completed',
           updated_at = timezone('utc', now())
       WHERE id = $1`,
      [requestId],
    );

    const requestResult = await client.query(`${requestSelect} WHERE sr.id = $1`, [requestId]);
    const request = requestResult.rows[0];

    // Release sender escrow
    if (true) {
      const senderWalletResult = await client.query(
        `SELECT id, escrow_balance, currency FROM public.wallet_accounts WHERE user_id = $1 FOR UPDATE`,
        [request.sender_id],
      );
      const senderWallet = senderWalletResult.rows[0];
      if (senderWallet) {
        const swCurrency = (senderWallet.currency || 'USD').toUpperCase();
        // Sum ALL escrow_hold txns for this request (additional-kg holds create multiple rows)
        const escrowTxResult = await client.query(
          `SELECT COALESCE(SUM(amount), 0) AS amount FROM public.wallet_transactions
           WHERE request_id=$1 AND user_id=$2 AND type='escrow_hold' AND status='completed'`,
          [request.id, request.sender_id],
        );
        const senderEscrowAmount = toNumber(escrowTxResult.rows[0]?.amount);

        if (senderEscrowAmount > 0) {
          await client.query(
            `UPDATE public.wallet_accounts
             SET escrow_balance = GREATEST(0, escrow_balance - $2), updated_at = timezone('utc', now())
             WHERE user_id = $1`,
            [request.sender_id, senderEscrowAmount],
          );
          await client.query(
            `INSERT INTO public.wallet_transactions
               (wallet_id, user_id, request_id, trip_id, type, amount, currency, status, description, metadata)
             VALUES ($1,$2,$3,$4,'escrow_release',$5,$6,'completed',$7,$8)`,
            [senderWallet.id, request.sender_id, request.id, request.trip_id,
             senderEscrowAmount, swCurrency,
             `Escrow released via handover PIN — ${request.tracking_number || request.id}`,
             JSON.stringify({ requestId: request.id, method: 'handover_pin' })],
          );
        }
      }

      // Credit traveler
      const travelerWalletResult = await client.query(
        `SELECT id, currency FROM public.wallet_accounts WHERE user_id = $1 FOR UPDATE`,
        [request.traveler_id],
      );
      const travelerWallet = travelerWalletResult.rows[0];
      if (travelerWallet) {
        const alreadyCredited = await client.query(
          `SELECT id FROM public.wallet_transactions
           WHERE request_id=$1 AND user_id=$2 AND type='earning' LIMIT 1`,
          [request.id, request.traveler_id],
        );
        if (!alreadyCredited.rows[0]) {
          const twCurrency = (travelerWallet.currency || 'USD').toUpperCase();
          const escrowTxResult = await client.query(
            `SELECT amount FROM public.wallet_transactions
             WHERE request_id=$1 AND user_id=$2 AND type='escrow_hold'
             ORDER BY created_at DESC LIMIT 1`,
            [request.id, request.traveler_id],
          );
          const heldAmount = escrowTxResult.rows[0] ? toNumber(escrowTxResult.rows[0].amount) : 0;
          if (heldAmount > 0) {
            await client.query(
              `UPDATE public.wallet_accounts
               SET escrow_balance = GREATEST(0, escrow_balance - $2),
                   available_balance = available_balance + $2,
                   updated_at = timezone('utc', now())
               WHERE user_id = $1`,
              [request.traveler_id, heldAmount],
            );
            await client.query(
              `INSERT INTO public.wallet_transactions
                 (wallet_id, user_id, request_id, trip_id, type, amount, currency, status, description, metadata)
               VALUES ($1,$2,$3,$4,'earning',$5,$6,'completed',$7,$8)`,
              [travelerWallet.id, request.traveler_id, request.id, request.trip_id,
               heldAmount, twCurrency,
               `Earnings from handover PIN — ${request.tracking_number || request.id}`,
               JSON.stringify({ requestId: request.id, method: 'handover_pin' })],
            );
          }
        }
      }
    }

    return getShipmentRequestById(requestId);
  });
}
