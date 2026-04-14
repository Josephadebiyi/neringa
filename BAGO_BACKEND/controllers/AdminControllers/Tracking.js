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
