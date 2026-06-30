import { query as pgQuery, queryOne, query } from '../lib/postgres/db.js';
import fetch from 'node-fetch';

const DEFAULT_SETTINGS = {
  enabled: true,
  global: { fixedPrice: 6, maxCoverageAmount: 5000, commissionPercentage: 15, currency: 'USD', enabled: true },
  africa: { fixedPrice: 3000, maxCoverageAmount: 2000000, commissionPercentage: 15, currency: 'NGN', enabled: true },
  europe: { fixedPrice: 6, maxCoverageAmount: 10000, commissionPercentage: 15, currency: 'USD', enabled: true },
};

async function getSettings() {
  const row = await queryOne(`SELECT global_config, africa_config, europe_config, enabled FROM public.insurance_settings LIMIT 1`);
  if (row) {
    return {
      enabled: row.enabled !== false,
      global: row.global_config || DEFAULT_SETTINGS.global,
      africa: row.africa_config || DEFAULT_SETTINGS.africa,
      europe: row.europe_config || DEFAULT_SETTINGS.europe,
    };
  }
  return DEFAULT_SETTINGS;
}

export const calculateInsurance = async (req, res) => {
  try {
    const { itemValue, currency = 'USD', region = 'global' } = req.query;
    if (!itemValue || isNaN(itemValue) || itemValue < 0) {
      return res.status(400).json({ success: false, message: 'Valid item value is required' });
    }

    const settings = await getSettings();
    if (!settings.enabled) {
      return res.status(200).json({ success: true, available: false, message: 'Insurance is currently unavailable' });
    }

    const config = settings[region.toLowerCase()] || settings.global;
    if (!config?.enabled) {
      return res.status(200).json({ success: true, available: false, message: `Insurance unavailable for ${region}` });
    }

    const value = parseFloat(itemValue);
    if (value > config.maxCoverageAmount) {
      return res.status(400).json({ success: false, message: `Item value exceeds maximum coverage of ${config.maxCoverageAmount}`, maxCoverage: config.maxCoverageAmount });
    }

    let insuranceCost = config.fixedPrice || 6;
    let convertedCost = insuranceCost;
    let exchangeRate = 1;

    if (currency !== config.currency) {
      try {
        const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${config.currency || 'USD'}`);
        const data = await response.json();
        if (data?.rates?.[currency]) {
          exchangeRate = data.rates[currency];
          convertedCost = Math.round(insuranceCost * exchangeRate * 100) / 100;
        }
      } catch (_) {}
    }

    return res.status(200).json({
      success: true,
      available: true,
      insurance: {
        cost: convertedCost,
        currency,
        exchangeRate,
        coverageAmount: value,
        region,
        fixedPrice: config.fixedPrice,
        baseCurrency: config.currency || 'USD',
        commissionPercentage: config.commissionPercentage || 15,
      },
    });
  } catch (error) {
    console.error('Error calculating insurance:', error);
    return res.status(500).json({ success: false, message: 'Failed to calculate insurance', error: error.message });
  }
};

export const getInsuranceSettings = async (req, res) => {
  try {
    const settings = await getSettings();
    return res.status(200).json({ success: true, data: settings });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch insurance settings', error: error.message });
  }
};

export const updateInsuranceSettings = async (req, res) => {
  try {
    await ensureTable();
    const current = await getSettings();
    const { global, africa, europe, enabled, description, terms } = req.body;

    const updated = { ...current };
    if (global) updated.global = { ...current.global, ...global };
    if (africa) updated.africa = { ...current.africa, ...africa };
    if (europe) updated.europe = { ...current.europe, ...europe };
    if (enabled !== undefined) updated.enabled = Boolean(enabled);
    if (description !== undefined) updated.description = String(description);
    if (terms !== undefined) updated.terms = String(terms);

    const row = await queryOne(`SELECT id FROM public.insurance_settings LIMIT 1`);
    if (row) {
      await pgQuery(
        `UPDATE public.insurance_settings SET global_config=$1, africa_config=$2, europe_config=$3, enabled=$4, updated_at=NOW() WHERE id=$5`,
        [JSON.stringify(updated.global), JSON.stringify(updated.africa), JSON.stringify(updated.europe), updated.enabled !== false, row.id]
      );
    } else {
      await pgQuery(
        `INSERT INTO public.insurance_settings (global_config, africa_config, europe_config, enabled) VALUES ($1,$2,$3,$4)`,
        [JSON.stringify(updated.global), JSON.stringify(updated.africa), JSON.stringify(updated.europe), updated.enabled !== false]
      );
    }

    return res.status(200).json({ success: true, message: 'Insurance settings updated successfully', data: updated });
  } catch (error) {
    console.error('Error updating insurance settings:', error);
    return res.status(500).json({ success: false, message: 'Failed to update insurance settings', error: error.message });
  }
};

// List all shipments where user opted into insurance
export const getInsuredShipments = async (req, res) => {
  try {
    const { status, page = 1, limit = 100 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const conditions = [`sr.insurance = true`];
    const params = [];
    if (status && status !== 'all') {
      params.push(status);
      conditions.push(`sr.insurance_status = $${params.length}`);
    }

    const where = conditions.join(' AND ');

    const rows = await query(
      `SELECT
         sr.id,
         sr.tracking_number,
         sr.created_at,
         sr.status AS shipment_status,
         sr.insurance_status,
         sr.insurance_cost,
         sr.currency,
         sr.amount,
         sr.insurance_policy_id,
         sr.insurance_policy_data,
         sr.insurance_error,
         sr.insurance_purchased_at,
         -- package details
         pkg.description        AS item_description,
         pkg.category           AS item_category,
         pkg.package_weight     AS item_weight,
         pkg.value              AS declared_value,
         pkg.from_city          AS from_city,
         pkg.to_city            AS to_city,
         pkg.from_country       AS from_country,
         pkg.to_country         AS to_country,
         pkg.pickup_address     AS pickup_address,
         pkg.delivery_address   AS delivery_address,
         pkg.receiver_name,
         pkg.receiver_phone,
         pkg.receiver_email,
         -- sender
         sender.id              AS sender_id,
         sender.first_name      AS sender_first_name,
         sender.last_name       AS sender_last_name,
         sender.email           AS sender_email,
         sender.phone           AS sender_phone,
         -- traveler
         traveler.id            AS traveler_id,
         traveler.first_name    AS traveler_first_name,
         traveler.last_name     AS traveler_last_name,
         traveler.email         AS traveler_email,
         traveler.phone         AS traveler_phone
       FROM public.shipment_requests sr
       LEFT JOIN public.packages pkg       ON pkg.id = sr.package_id
       LEFT JOIN public.profiles  sender   ON sender.id  = sr.sender_id
       LEFT JOIN public.profiles  traveler ON traveler.id = sr.traveler_id
       WHERE ${where}
       ORDER BY sr.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, Number(limit), offset],
    );

    const countRow = await queryOne(
      `SELECT COUNT(*)::int AS total FROM public.shipment_requests sr WHERE ${where}`,
      params,
    );

    const data = rows.rows.map((r) => ({
      id: r.id,
      trackingNumber: r.tracking_number,
      createdAt: r.created_at,
      shipmentStatus: r.shipment_status,
      insuranceStatus: r.insurance_status,
      insuranceCost: r.insurance_cost,
      currency: r.currency,
      amount: r.amount,
      policyId: r.insurance_policy_id,
      policyData: r.insurance_policy_data,
      insuranceError: r.insurance_error,
      purchasedAt: r.insurance_purchased_at,
      item: {
        description: r.item_description,
        category: r.item_category,
        weight: r.item_weight,
        declaredValue: r.declared_value,
      },
      route: {
        fromCity: r.from_city,
        toCity: r.to_city,
        fromCountry: r.from_country,
        toCountry: r.to_country,
        pickupAddress: r.pickup_address,
        deliveryAddress: r.delivery_address,
      },
      receiver: {
        name: r.receiver_name,
        phone: r.receiver_phone,
        email: r.receiver_email,
      },
      sender: {
        id: r.sender_id,
        name: [r.sender_first_name, r.sender_last_name].filter(Boolean).join(' '),
        email: r.sender_email,
        phone: r.sender_phone,
      },
      traveler: {
        id: r.traveler_id,
        name: [r.traveler_first_name, r.traveler_last_name].filter(Boolean).join(' '),
        email: r.traveler_email,
        phone: r.traveler_phone,
      },
    }));

    return res.json({ success: true, data, total: countRow?.total || 0, page: Number(page), limit: Number(limit) });
  } catch (error) {
    console.error('Error fetching insured shipments:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch insured shipments', error: error.message });
  }
};
