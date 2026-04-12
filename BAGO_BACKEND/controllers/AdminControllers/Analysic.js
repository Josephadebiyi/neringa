import { query } from '../../lib/postgres/db.js';

export const analystic = async (req, res) => {
  try {
    const { page = 1, limit = 100 } = req.query;
    const numericPage = Math.max(1, Number(page) || 1);
    const numericLimit = Math.min(500, Math.max(1, Number(limit) || 100));
    const offset = (numericPage - 1) * numericLimit;

    const result = await query(
      `
        select
          p.id,
          p.first_name,
          p.last_name,
          p.email,
          p.phone,
          p.country,
          p.signup_method,
          p.kyc_status,
          p.banned,
          p.status,
          p.created_at,
          w.available_balance,
          w.escrow_balance
        from public.profiles p
        left join public.wallet_accounts w on w.user_id = p.id
        order by p.created_at desc
        limit $1 offset $2
      `,
      [numericLimit, offset],
    );

    return res.status(200).json({
      success: true,
      error: false,
      data: result.rows.map((row) => ({
        _id: row.id,
        id: row.id,
        firstName: row.first_name,
        lastName: row.last_name,
        email: row.email,
        phone: row.phone,
        country: row.country,
        signupMethod: row.signup_method,
        kycStatus: row.kyc_status,
        banned: row.banned,
        status: row.status,
        balance: Number(row.available_balance || 0),
        escrowBalance: Number(row.escrow_balance || 0),
        createdAt: row.created_at,
      })),
    });
  } catch (error) {
    console.error('Admin analytic error:', error);
    return res.status(500).json({
      success: false,
      error: true,
      message: 'Failed to fetch analytics users',
    });
  }
};
