import { query as pgQuery, queryOne } from '../lib/postgres/db.js';

// ── Pure utility functions (no DB) ──────────────────────────────────────────
const AFRICAN_COUNTRY_CODES = [
  'NG', 'GH', 'KE', 'ZA', 'EG', 'MA', 'TZ', 'UG', 'RW', 'ET',
  'SN', 'CI', 'CM', 'ZM', 'ZW', 'AO', 'BW', 'MW', 'MZ', 'NA',
  'BJ', 'BF', 'GA', 'GM', 'GN', 'LR', 'ML', 'MR', 'NE', 'SL', 'TG'
];
const COUNTRY_CURRENCY_MAP = {
  'NG': { currency: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
  'GH': { currency: 'GHS', symbol: 'GH₵', name: 'Ghanaian Cedi' },
  'KE': { currency: 'KES', symbol: 'KSh', name: 'Kenyan Shilling' },
  'ZA': { currency: 'ZAR', symbol: 'R', name: 'South African Rand' },
  'US': { currency: 'USD', symbol: '$', name: 'US Dollar' },
  'GB': { currency: 'GBP', symbol: '£', name: 'British Pound' },
  'EU': { currency: 'EUR', symbol: '€', name: 'Euro' },
  'FR': { currency: 'EUR', symbol: '€', name: 'Euro' },
  'DE': { currency: 'EUR', symbol: '€', name: 'Euro' },
  'CA': { currency: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
};
export function isAfricanCountry(countryCode) {
  return AFRICAN_COUNTRY_CODES.includes(countryCode?.toUpperCase());
}
export function getPaymentGatewayForCountry(countryCode) {
  return isAfricanCountry(countryCode) ? 'paystack' : 'stripe';
}
export function getCurrencyForCountry(countryCode) {
  const code = countryCode?.toUpperCase();
  return COUNTRY_CURRENCY_MAP[code] || { currency: 'USD', symbol: '$', name: 'US Dollar' };
}

// ── Table bootstrap ──────────────────────────────────────────────────────────
const ensureRoutesTable = () => pgQuery(`
  CREATE TABLE IF NOT EXISTS public.routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    origin_city TEXT NOT NULL,
    origin_country TEXT,
    origin_country_code TEXT NOT NULL,
    destination_city TEXT NOT NULL,
    destination_country TEXT,
    destination_country_code TEXT NOT NULL,
    base_price_per_kg NUMERIC NOT NULL DEFAULT 10,
    currency TEXT DEFAULT 'NGN',
    traveler_commission_percent NUMERIC DEFAULT 70,
    platform_fee_percent NUMERIC DEFAULT 10,
    min_weight_kg NUMERIC DEFAULT 0.5,
    max_weight_kg NUMERIC DEFAULT 30,
    estimated_delivery_min_days INT DEFAULT 3,
    estimated_delivery_max_days INT DEFAULT 7,
    supported_transport_modes TEXT[] DEFAULT ARRAY['air','bus'],
    is_african_route BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )
`).catch(() => {});

function rowToRoute(r) {
  return {
    id: r.id,
    displayName: `${r.origin_city}, ${r.origin_country_code} → ${r.destination_city}, ${r.destination_country_code}`,
    originCity: r.origin_city,
    originCountry: r.origin_country,
    originCountryCode: r.origin_country_code,
    destinationCity: r.destination_city,
    destinationCountry: r.destination_country,
    destinationCountryCode: r.destination_country_code,
    basePricePerKg: parseFloat(r.base_price_per_kg),
    currency: r.currency,
    travelerCommissionPercent: parseFloat(r.traveler_commission_percent),
    platformFeePercent: parseFloat(r.platform_fee_percent),
    minWeightKg: parseFloat(r.min_weight_kg),
    maxWeightKg: parseFloat(r.max_weight_kg),
    estimatedDeliveryMinDays: r.estimated_delivery_min_days,
    estimatedDeliveryMaxDays: r.estimated_delivery_max_days,
    supportedTransportModes: r.supported_transport_modes,
    isAfricanRoute: r.is_african_route,
    isActive: r.is_active,
    notes: r.notes,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

// ── Handlers ─────────────────────────────────────────────────────────────────
export const createRoute = async (req, res) => {
  try {
    await ensureRoutesTable();
    const {
      originCity, originCountry, originCountryCode,
      destinationCity, destinationCountry, destinationCountryCode,
      basePricePerKg, currency, travelerCommissionPercent,
      minWeightKg, maxWeightKg, estimatedDeliveryMinDays, estimatedDeliveryMaxDays,
      supportedTransportModes, notes,
    } = req.body;

    if (!originCity || !originCountryCode || !destinationCity || !destinationCountryCode || !basePricePerKg) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const existing = await queryOne(
      `SELECT id FROM public.routes WHERE origin_city ILIKE $1 AND origin_country_code = $2 AND destination_city ILIKE $3 AND destination_country_code = $4`,
      [originCity, originCountryCode.toUpperCase(), destinationCity, destinationCountryCode.toUpperCase()]
    );
    if (existing) return res.status(409).json({ success: false, message: 'This route already exists' });

    const route = await queryOne(
      `INSERT INTO public.routes (origin_city, origin_country, origin_country_code, destination_city, destination_country, destination_country_code, base_price_per_kg, currency, traveler_commission_percent, min_weight_kg, max_weight_kg, estimated_delivery_min_days, estimated_delivery_max_days, supported_transport_modes, is_african_route, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
       RETURNING *`,
      [
        originCity, originCountry || null, originCountryCode.toUpperCase(),
        destinationCity, destinationCountry || null, destinationCountryCode.toUpperCase(),
        basePricePerKg, currency || 'NGN', travelerCommissionPercent ?? 70,
        minWeightKg ?? 0.5, maxWeightKg ?? 30,
        estimatedDeliveryMinDays ?? 3, estimatedDeliveryMaxDays ?? 7,
        supportedTransportModes || ['air', 'bus'],
        isAfricanCountry(originCountryCode) || isAfricanCountry(destinationCountryCode),
        notes || null,
      ]
    );
    res.status(201).json({ success: true, message: 'Route created successfully', route: rowToRoute(route) });
  } catch (err) {
    console.error('❌ Create route error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to create route', error: err.message });
  }
};

export const getAllRoutes = async (req, res) => {
  try {
    await ensureRoutesTable();
    const { originCountry, destinationCountry, isActive, isAfricanRoute, page = 1, limit = 50 } = req.query;
    const conditions = [];
    const params = [];
    if (originCountry) { params.push(originCountry.toUpperCase()); conditions.push(`origin_country_code = $${params.length}`); }
    if (destinationCountry) { params.push(destinationCountry.toUpperCase()); conditions.push(`destination_country_code = $${params.length}`); }
    if (isActive !== undefined) { params.push(isActive === 'true'); conditions.push(`is_active = $${params.length}`); }
    if (isAfricanRoute !== undefined) { params.push(isAfricanRoute === 'true'); conditions.push(`is_african_route = $${params.length}`); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (parseInt(page) - 1) * parseInt(limit);
    params.push(parseInt(limit)); params.push(offset);

    const result = await pgQuery(
      `SELECT * FROM public.routes ${where} ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    const countResult = await pgQuery(`SELECT COUNT(*) FROM public.routes ${where}`, params.slice(0, -2));
    const total = parseInt(countResult.rows?.[0]?.count || 0);
    const routes = (result.rows || result).map(rowToRoute);

    res.json({ success: true, routes, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) } });
  } catch (err) {
    console.error('❌ Get routes error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch routes', error: err.message });
  }
};

export const getRouteById = async (req, res) => {
  try {
    await ensureRoutesTable();
    const route = await queryOne(`SELECT * FROM public.routes WHERE id = $1`, [req.params.id]);
    if (!route) return res.status(404).json({ success: false, message: 'Route not found' });
    res.json({ success: true, route: rowToRoute(route) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch route', error: err.message });
  }
};

export const updateRoute = async (req, res) => {
  try {
    await ensureRoutesTable();
    const { id } = req.params;
    const b = req.body;
    const route = await queryOne(
      `UPDATE public.routes SET
        origin_city = COALESCE($2, origin_city),
        origin_country = COALESCE($3, origin_country),
        origin_country_code = COALESCE($4, origin_country_code),
        destination_city = COALESCE($5, destination_city),
        destination_country = COALESCE($6, destination_country),
        destination_country_code = COALESCE($7, destination_country_code),
        base_price_per_kg = COALESCE($8, base_price_per_kg),
        currency = COALESCE($9, currency),
        traveler_commission_percent = COALESCE($10, traveler_commission_percent),
        min_weight_kg = COALESCE($11, min_weight_kg),
        max_weight_kg = COALESCE($12, max_weight_kg),
        estimated_delivery_min_days = COALESCE($13, estimated_delivery_min_days),
        estimated_delivery_max_days = COALESCE($14, estimated_delivery_max_days),
        supported_transport_modes = COALESCE($15, supported_transport_modes),
        is_active = COALESCE($16, is_active),
        notes = COALESCE($17, notes),
        updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [id, b.originCity, b.originCountry, b.originCountryCode?.toUpperCase(),
       b.destinationCity, b.destinationCountry, b.destinationCountryCode?.toUpperCase(),
       b.basePricePerKg, b.currency, b.travelerCommissionPercent,
       b.minWeightKg, b.maxWeightKg, b.estimatedDeliveryMinDays, b.estimatedDeliveryMaxDays,
       b.supportedTransportModes, b.isActive, b.notes]
    );
    if (!route) return res.status(404).json({ success: false, message: 'Route not found' });
    res.json({ success: true, message: 'Route updated successfully', route: rowToRoute(route) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update route', error: err.message });
  }
};

export const deleteRoute = async (req, res) => {
  try {
    await ensureRoutesTable();
    const existing = await queryOne(`SELECT id FROM public.routes WHERE id = $1`, [req.params.id]);
    if (!existing) return res.status(404).json({ success: false, message: 'Route not found' });
    await pgQuery(`DELETE FROM public.routes WHERE id = $1`, [req.params.id]);
    res.json({ success: true, message: 'Route deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete route', error: err.message });
  }
};

export const searchRoutes = async (req, res) => {
  try {
    await ensureRoutesTable();
    const { from, to, fromCountry, toCountry } = req.query;
    if (!from && !to && !fromCountry && !toCountry) {
      return res.status(400).json({ success: false, message: 'Provide at least one search parameter' });
    }
    const conditions = ['is_active = true'];
    const params = [];
    if (from) { params.push(`%${from}%`); conditions.push(`origin_city ILIKE $${params.length}`); }
    if (to) { params.push(`%${to}%`); conditions.push(`destination_city ILIKE $${params.length}`); }
    if (fromCountry) { params.push(fromCountry.toUpperCase()); conditions.push(`origin_country_code = $${params.length}`); }
    if (toCountry) { params.push(toCountry.toUpperCase()); conditions.push(`destination_country_code = $${params.length}`); }

    const result = await pgQuery(
      `SELECT * FROM public.routes WHERE ${conditions.join(' AND ')} ORDER BY base_price_per_kg ASC LIMIT 20`,
      params
    );
    res.json({ success: true, routes: (result.rows || result).map(rowToRoute) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to search routes', error: err.message });
  }
};

export const calculatePrice = async (req, res) => {
  try {
    await ensureRoutesTable();
    const { routeId, weightKg, userCountryCode } = req.body;
    if (!routeId || !weightKg) return res.status(400).json({ success: false, message: 'routeId and weightKg are required' });

    const route = await queryOne(`SELECT * FROM public.routes WHERE id = $1`, [routeId]);
    if (!route) return res.status(404).json({ success: false, message: 'Route not found' });
    if (!route.is_active) return res.status(400).json({ success: false, message: 'This route is currently inactive' });

    const w = parseFloat(weightKg);
    if (w < route.min_weight_kg) return res.status(400).json({ success: false, message: `Minimum weight is ${route.min_weight_kg} kg` });
    if (w > route.max_weight_kg) return res.status(400).json({ success: false, message: `Maximum weight is ${route.max_weight_kg} kg` });

    const base = parseFloat(route.base_price_per_kg) * w;
    const commission = parseFloat(route.traveler_commission_percent) / 100;
    const platformFee = parseFloat(route.platform_fee_percent || 10) / 100;
    const pricing = {
      basePrice: base,
      travelerEarnings: base * commission,
      platformFee: base * platformFee,
      totalCost: base,
      currency: route.currency,
      pricePerKg: parseFloat(route.base_price_per_kg),
      weightKg: w,
    };
    const paymentGateway = userCountryCode ? getPaymentGatewayForCountry(userCountryCode) : (route.is_african_route ? 'paystack' : 'stripe');

    res.json({ success: true, route: rowToRoute(route), pricing, paymentGateway, estimatedDelivery: { minDays: route.estimated_delivery_min_days, maxDays: route.estimated_delivery_max_days } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to calculate price', error: err.message });
  }
};

export const getPricingForTrip = async (req, res) => {
  try {
    await ensureRoutesTable();
    const { fromCity, fromCountryCode, toCity, toCountryCode, weightKg } = req.body;
    if (!fromCity || !fromCountryCode || !toCity || !toCountryCode) {
      return res.status(400).json({ success: false, message: 'fromCity, fromCountryCode, toCity, toCountryCode required' });
    }

    let route = await queryOne(
      `SELECT * FROM public.routes WHERE origin_city ILIKE $1 AND origin_country_code = $2 AND destination_city ILIKE $3 AND destination_country_code = $4 AND is_active = true LIMIT 1`,
      [fromCity, fromCountryCode.toUpperCase(), toCity, toCountryCode.toUpperCase()]
    );

    if (!route) {
      route = await queryOne(
        `SELECT * FROM public.routes WHERE origin_country_code = $1 AND destination_country_code = $2 AND is_active = true ORDER BY base_price_per_kg ASC LIMIT 1`,
        [fromCountryCode.toUpperCase(), toCountryCode.toUpperCase()]
      );
      if (!route) return res.status(404).json({ success: false, message: 'No pricing available for this route', routeNotFound: true });
    }

    const w = weightKg ? parseFloat(weightKg) : null;
    const pricing = w ? { basePrice: parseFloat(route.base_price_per_kg) * w, pricePerKg: parseFloat(route.base_price_per_kg), weightKg: w, currency: route.currency } : null;

    res.json({ success: true, exactMatch: true, route: rowToRoute(route), pricing, paymentGateway: route.is_african_route ? 'paystack' : 'stripe' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to get pricing', error: err.message });
  }
};
