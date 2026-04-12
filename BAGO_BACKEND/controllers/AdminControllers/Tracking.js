import { query, queryOne } from '../../lib/postgres/db.js';
import { getShipmentRequestById } from '../../lib/postgres/shipping.js';

export const tracking = async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const packagesResult = await query(
      `
        select *
        from public.packages
        order by created_at desc
        limit $1 offset $2
      `,
      [limit, offset],
    );
    const totalRow = await queryOne(`select count(*)::int as total from public.packages`);

    const packageIds = packagesResult.rows.map((row) => row.id);
    let requestRows = [];
    if (packageIds.length) {
      const requestsResult = await query(
        `
          select id
          from public.shipment_requests
          where package_id = any($1::uuid[])
          order by created_at desc
        `,
        [packageIds],
      );
      requestRows = requestsResult.rows;
    }

    const requestDetails = await Promise.all(requestRows.map((row) => getShipmentRequestById(row.id)));
    const requestMap = new Map();
    for (const request of requestDetails.filter(Boolean)) {
      const bucket = requestMap.get(request.packageId) || [];
      bucket.push(request);
      requestMap.set(request.packageId, bucket);
    }

    const trackingData = packagesResult.rows.map((pkg) => ({
      package: {
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
      },
      requests: requestMap.get(pkg.id) || [],
    }));

    return res.status(200).json({
      success: true,
      error: false,
      message: 'Successful operation',
      data: trackingData,
      totalCount: totalRow?.total || 0,
      page,
      limit,
    });
  } catch (error) {
    next(error);
  }
};

export const updateRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, travelerId } = req.body;
    const updates = [];
    const values = [];
    let index = 1;

    if (status) {
      updates.push(`status = $${index++}`);
      values.push(status);
    }
    if (travelerId) {
      updates.push(`traveler_id = $${index++}`);
      values.push(travelerId);
    }

    if (!updates.length) {
      const existing = await getShipmentRequestById(id);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Request not found' });
      }
      return res.status(200).json({
        success: true,
        message: 'No changes submitted',
        data: existing,
      });
    }

    values.push(id);
    const updated = await queryOne(
      `
        update public.shipment_requests
        set ${updates.join(', ')}, updated_at = timezone('utc', now())
        where id = $${index}
        returning id
      `,
      values,
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Request updated successfully',
      data: await getShipmentRequestById(id),
    });
  } catch (error) {
    next(error);
  }
};
