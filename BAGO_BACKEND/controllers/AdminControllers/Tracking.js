import { query, queryOne } from '../../lib/postgres/db.js';

function normalizePackage(pkg) {
  return {
    _id: pkg.id,
    id: pkg.id,
    userId: pkg.user_id,
    fromCountry: pkg.from_country,
    fromCity: pkg.from_city,
    toCountry: pkg.to_country,
    toCity: pkg.to_city,
    packageWeight: Number(pkg.package_weight || 0),
    value: Number(pkg.declared_value || 0),
    receiverName: pkg.receiver_name,
    receiverEmail: pkg.receiver_email,
    receiverPhone: pkg.receiver_phone,
    description: pkg.description,
    image: pkg.image_url,
    category: pkg.category,
    pickupAddress: pkg.pickup_address,
    deliveryAddress: pkg.delivery_address,
    createdAt: pkg.created_at,
    updatedAt: pkg.updated_at,
  };
}

function normalizeRequest(req) {
  return {
    _id: req.id,
    id: req.id,
    sender: req.sender_id,
    senderId: req.sender_id,
    traveler: req.traveler_id,
    travelerId: req.traveler_id,
    package: req.package_id,
    packageId: req.package_id,
    trip: req.trip_id,
    tripId: req.trip_id,
    status: req.status,
    insurance: req.insurance,
    insuranceCost: Number(req.insurance_cost || 0),
    amount: Number(req.amount || 0),
    currency: req.currency,
    trackingNumber: req.tracking_number,
    createdAt: req.created_at,
    updatedAt: req.updated_at,
  };
}

export const tracking = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const packages = await query(
      `SELECT * FROM public.packages ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [Number(limit), offset]
    );

    const countResult = await queryOne(`SELECT COUNT(*)::int as total FROM public.packages`);

    const trackingData = await Promise.all(
      packages.rows.map(async (pkg) => {
        const requests = await query(
          `SELECT id, sender_id, traveler_id, package_id, trip_id, status,
                  insurance, insurance_cost, amount, currency, tracking_number,
                  created_at, updated_at
           FROM public.shipment_requests WHERE package_id = $1`,
          [pkg.id]
        );
        return {
          package: normalizePackage(pkg),
          requests: requests.rows.map(normalizeRequest),
        };
      })
    );

    res.status(200).json({
      success: true,
      error: false,
      message: 'Successful operation',
      data: trackingData,
      totalCount: countResult?.total || 0,
      page: Number(page),
      limit: Number(limit),
    });
  } catch (error) {
    next(error);
  }
};

export const activeShipmentLocations = async (req, res, next) => {
  try {
    const { limit = 100 } = req.query;
    const result = await query(
      `SELECT
          sr.id,
          sr.sender_id,
          sr.traveler_id,
          sr.package_id,
          sr.trip_id,
          sr.status,
          sr.amount,
          sr.currency,
          sr.tracking_number,
          sr.movement_tracking,
          sr.estimated_departure,
          sr.estimated_arrival,
          sr.created_at,
          sr.updated_at,
          sender.first_name as sender_first_name,
          sender.last_name as sender_last_name,
          sender.email as sender_email,
          traveler.first_name as traveler_first_name,
          traveler.last_name as traveler_last_name,
          traveler.email as traveler_email,
          traveler.image_url as traveler_image_url,
          traveler.kyc_status as traveler_kyc_status,
          pkg.from_city as origin_city,
          pkg.from_country as origin_country,
          pkg.to_city as destination_city,
          pkg.to_country as destination_country,
          pkg.description as package_description,
          pkg.package_weight,
          pkg.image_url as package_image_url
       FROM public.shipment_requests sr
       LEFT JOIN public.profiles sender ON sender.id = sr.sender_id
       LEFT JOIN public.profiles traveler ON traveler.id = sr.traveler_id
       LEFT JOIN public.packages pkg ON pkg.id = sr.package_id
       WHERE sr.status IN ('accepted', 'intransit', 'delivering')
       ORDER BY sr.updated_at DESC, sr.created_at DESC
       LIMIT $1`,
      [Number(limit)]
    );

    const data = result.rows.map((row) => {
      const movementTracking = Array.isArray(row.movement_tracking) ? row.movement_tracking : [];
      return {
        _id: row.id,
        id: row.id,
        senderId: row.sender_id,
        travelerId: row.traveler_id,
        packageId: row.package_id,
        tripId: row.trip_id,
        status: row.status,
        amount: Number(row.amount || 0),
        currency: row.currency,
        trackingNumber: row.tracking_number,
        movementTracking,
        estimatedDeparture: row.estimated_departure,
        estimatedArrival: row.estimated_arrival,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        originCity: row.origin_city,
        originCountry: row.origin_country,
        destinationCity: row.destination_city,
        destinationCountry: row.destination_country,
        senderName: `${row.sender_first_name || ''} ${row.sender_last_name || ''}`.trim(),
        senderEmail: row.sender_email,
        travelerName: `${row.traveler_first_name || ''} ${row.traveler_last_name || ''}`.trim(),
        travelerEmail: row.traveler_email,
        travelerKycStatus: row.traveler_kyc_status,
        travelerVerified: row.traveler_kyc_status === 'approved',
        traveler: {
          _id: row.traveler_id,
          id: row.traveler_id,
          firstName: row.traveler_first_name,
          lastName: row.traveler_last_name,
          email: row.traveler_email,
          image: row.traveler_image_url,
          avatar: row.traveler_image_url,
          kycStatus: row.traveler_kyc_status,
          isVerified: row.traveler_kyc_status === 'approved',
        },
        package: {
          _id: row.package_id,
          id: row.package_id,
          fromCity: row.origin_city,
          fromCountry: row.origin_country,
          toCity: row.destination_city,
          toCountry: row.destination_country,
          description: row.package_description,
          packageWeight: Number(row.package_weight || 0),
          image: row.package_image_url,
        },
      };
    });

    return res.status(200).json({
      success: true,
      error: false,
      message: data.length ? 'Active shipments retrieved successfully' : 'No active shipments found',
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const updateRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, travelerId } = req.body;

    const fields = [];
    const values = [];
    let idx = 1;

    if (status) { fields.push(`status = $${idx++}`); values.push(status); }
    if (travelerId) { fields.push(`traveler_id = $${idx++}`); values.push(travelerId); }

    if (!fields.length) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    values.push(id);
    const updated = await queryOne(
      `UPDATE public.shipment_requests SET ${fields.join(', ')}, updated_at = NOW()
       WHERE id = $${idx} RETURNING *`,
      values
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Request updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};
