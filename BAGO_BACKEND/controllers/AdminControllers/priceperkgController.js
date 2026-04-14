import { query as pgQuery, queryOne } from "../../lib/postgres/db.js";

// Ensure table exists
const ensureTable = () => pgQuery(`
  CREATE TABLE IF NOT EXISTS public.pricing_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_city TEXT NOT NULL,
    to_city TEXT NOT NULL,
    category TEXT,
    base_price NUMERIC NOT NULL DEFAULT 10,
    weight_multiplier NUMERIC NOT NULL DEFAULT 5,
    dimension_multiplier NUMERIC NOT NULL DEFAULT 0.1,
    currency TEXT DEFAULT 'USD',
    min_weight_kg NUMERIC DEFAULT 0,
    discount_rate NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )
`).catch(() => {});

// CREATE
export const createPrice = async (req, res) => {
  try {
    await ensureTable();
    const { from, to, category, basePrice, weightMultiplier, dimensionMultiplier, currency, minWeightKg, discountRate } = req.body;
    const row = await queryOne(
      `INSERT INTO public.pricing_rules (from_city, to_city, category, base_price, weight_multiplier, dimension_multiplier, currency, min_weight_kg, discount_rate)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [from, to, category || null, basePrice ?? 10, weightMultiplier ?? 5, dimensionMultiplier ?? 0.1, currency || 'USD', minWeightKg ?? 0, discountRate ?? 0]
    );
    res.status(201).json({ message: "Price created successfully", price: row });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// READ ALL
export const getAllPrices = async (req, res) => {
  try {
    await ensureTable();
    const result = await pgQuery(`SELECT * FROM public.pricing_rules ORDER BY created_at DESC`, []);
    res.status(200).json(result.rows || result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// READ ONE
export const getPriceById = async (req, res) => {
  try {
    await ensureTable();
    const row = await queryOne(`SELECT * FROM public.pricing_rules WHERE id = $1`, [req.params.id]);
    if (!row) return res.status(404).json({ message: "Price not found" });
    res.status(200).json(row);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE
export const updatePrice = async (req, res) => {
  try {
    await ensureTable();
    const { from, to, category, basePrice, weightMultiplier, dimensionMultiplier, currency, minWeightKg, discountRate } = req.body;
    const row = await queryOne(
      `UPDATE public.pricing_rules
       SET from_city = COALESCE($2, from_city),
           to_city = COALESCE($3, to_city),
           category = COALESCE($4, category),
           base_price = COALESCE($5, base_price),
           weight_multiplier = COALESCE($6, weight_multiplier),
           dimension_multiplier = COALESCE($7, dimension_multiplier),
           currency = COALESCE($8, currency),
           min_weight_kg = COALESCE($9, min_weight_kg),
           discount_rate = COALESCE($10, discount_rate),
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [req.params.id, from, to, category, basePrice, weightMultiplier, dimensionMultiplier, currency, minWeightKg, discountRate]
    );
    if (!row) return res.status(404).json({ message: "Price not found" });
    res.status(200).json({ message: "Price updated successfully", price: row });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// DELETE
export const deletePrice = async (req, res) => {
  try {
    await ensureTable();
    const row = await queryOne(`DELETE FROM public.pricing_rules WHERE id = $1 RETURNING id`, [req.params.id]);
    if (!row) return res.status(404).json({ message: "Price not found" });
    res.status(200).json({ message: "Price deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
