import { query, queryOne } from '../../lib/postgres/db.js';

export const tracking = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const packages = await query(
      `SELECT * FROM public.packages ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [Number(limit), offset]
    );

    const countResult = await queryOne(`SELECT COUNT(*) FROM public.packages`);

    const trackingData = await Promise.all(
      packages.rows.map(async (pkg) => {
        const requests = await query(
          `SELECT id, sender_id, traveler_id, status, created_at
           FROM public.shipment_requests WHERE package_id = $1`,
          [pkg.id]
        );
        return { package: pkg, requests: requests.rows };
      })
    );

    res.status(200).json({
      success: true,
      error: false,
      message: 'Successful operation',
      data: trackingData,
      totalCount: parseInt(countResult.count),
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
