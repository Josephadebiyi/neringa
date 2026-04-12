import { query, queryOne } from '../../lib/postgres/db.js';

// promo_codes table: id, code, discount_type, discount_amount, is_signup_bonus,
// signup_bonus_amount, max_uses, current_uses, expiry_date, is_active, created_at

export const createPromoCode = async (req, res) => {
  try {
    const { code, discountType, discountAmount, isSignupBonus, signupBonusAmount, maxUses, expiryDate } = req.body;

    const existing = await queryOne(
      `SELECT id FROM public.promo_codes WHERE upper(code) = upper($1)`, [code]
    );
    if (existing) return res.status(400).json({ success: false, message: 'Promo code already exists' });

    const newPromo = await queryOne(
      `INSERT INTO public.promo_codes
         (code, discount_type, discount_amount, is_signup_bonus, signup_bonus_amount, max_uses, expiry_date, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true)
       RETURNING *`,
      [
        code?.toUpperCase(),
        discountType || 'percentage',
        discountAmount || 0,
        isSignupBonus || false,
        signupBonusAmount || 0,
        maxUses || null,
        expiryDate || null,
      ]
    );

    res.status(201).json({ success: true, data: newPromo, message: 'Promo code created successfully' });
  } catch (error) {
    console.error('Create Promo Code Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllPromoCodes = async (req, res) => {
  try {
    const result = await query(`SELECT * FROM public.promo_codes ORDER BY created_at DESC`);
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deletePromoCode = async (req, res) => {
  try {
    const { id } = req.params;
    await queryOne(`DELETE FROM public.promo_codes WHERE id = $1`, [id]);
    res.status(200).json({ success: true, message: 'Promo code deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const togglePromoCodeStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const promo = await queryOne(
      `UPDATE public.promo_codes SET is_active = NOT is_active WHERE id = $1 RETURNING *`, [id]
    );
    if (!promo) return res.status(404).json({ success: false, message: 'Not found' });
    res.status(200).json({ success: true, data: promo, message: `Promo code ${promo.is_active ? 'activated' : 'deactivated'}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
