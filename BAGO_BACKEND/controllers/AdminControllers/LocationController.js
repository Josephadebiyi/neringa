import { query, queryOne } from '../../lib/postgres/db.js';

// locations table: id, name, code, type, is_african, is_active, supported_currencies, created_at

export const getAllLocations = async (req, res, next) => {
  try {
    const result = await query(`SELECT * FROM public.locations ORDER BY name ASC`);
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};

export const createLocation = async (req, res, next) => {
  try {
    const { name, code, type, isAfrican, supportedCurrencies } = req.body;

    const existing = await queryOne(
      `SELECT id FROM public.locations WHERE lower(name) = lower($1) OR upper(code) = upper($2)`,
      [name, code || '']
    );
    if (existing) {
      return res.status(400).json({ success: false, message: 'Location name or code already exists' });
    }

    const loc = await queryOne(
      `INSERT INTO public.locations (name, code, type, is_african, is_active, supported_currencies)
       VALUES ($1, $2, $3, $4, true, $5) RETURNING *`,
      [name, (code || '').toUpperCase(), type || 'country', !!isAfrican, supportedCurrencies || ['NGN']]
    );

    res.status(201).json({ success: true, data: loc });
  } catch (error) {
    next(error);
  }
};

export const updateLocation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, code, type, isActive, isAfrican, supportedCurrencies } = req.body;

    const fields = [];
    const values = [];
    let idx = 1;

    if (name !== undefined) { fields.push(`name = $${idx++}`); values.push(name); }
    if (code !== undefined) { fields.push(`code = $${idx++}`); values.push(code.toUpperCase()); }
    if (type !== undefined) { fields.push(`type = $${idx++}`); values.push(type); }
    if (isActive !== undefined) { fields.push(`is_active = $${idx++}`); values.push(isActive); }
    if (isAfrican !== undefined) { fields.push(`is_african = $${idx++}`); values.push(isAfrican); }
    if (supportedCurrencies !== undefined) { fields.push(`supported_currencies = $${idx++}`); values.push(supportedCurrencies); }

    if (!fields.length) return res.status(400).json({ success: false, message: 'No fields to update' });

    values.push(id);
    const loc = await queryOne(
      `UPDATE public.locations SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );

    if (!loc) return res.status(404).json({ success: false, message: 'Location not found' });
    res.status(200).json({ success: true, data: loc });
  } catch (error) {
    next(error);
  }
};

export const deleteLocation = async (req, res, next) => {
  try {
    const result = await queryOne(
      `DELETE FROM public.locations WHERE id = $1 RETURNING id`, [req.params.id]
    );
    if (!result) return res.status(404).json({ success: false, message: 'Location not found' });
    res.status(200).json({ success: true, message: 'Location deleted successfully' });
  } catch (error) {
    next(error);
  }
};
