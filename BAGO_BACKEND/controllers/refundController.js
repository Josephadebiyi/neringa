import { query, queryOne } from '../lib/postgres/db.js';

async function ensureRefundsTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS public.refunds (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      request_id UUID,
      reason TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'refunded')),
      payment_method TEXT,
      admin_note TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

export const requestRefund = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { reason, requestId, paymentMethod } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, message: 'Reason is required' });
    }

    await ensureRefundsTable();

    // Verify the request belongs to this user if requestId provided
    if (requestId) {
      const shipRequest = await queryOne(
        `SELECT id FROM public.shipment_requests WHERE id = $1 AND (sender_id = $2 OR traveler_id = $2)`,
        [requestId, userId],
      );
      if (!shipRequest) {
        return res.status(403).json({ success: false, message: 'Request not found or access denied' });
      }
    }

    const refund = await queryOne(
      `INSERT INTO public.refunds (user_id, request_id, reason, payment_method)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [userId, requestId || null, reason.trim(), paymentMethod || null],
    );

    res.status(201).json({ success: true, message: 'Refund request submitted', data: refund });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const approveRefund = async (req, res) => {
  try {
    await ensureRefundsTable();
    const refund = await queryOne(
      `UPDATE public.refunds SET status = 'refunded', updated_at = NOW() WHERE id = $1 RETURNING *`,
      [req.params.id],
    );
    if (!refund) return res.status(404).json({ message: 'Refund request not found' });
    res.json({ success: true, message: 'Refund approved', data: refund });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const rejectRefund = async (req, res) => {
  try {
    await ensureRefundsTable();
    const { adminNote } = req.body;
    const refund = await queryOne(
      `UPDATE public.refunds SET status = 'rejected', admin_note = $2, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [req.params.id, adminNote || null],
    );
    if (!refund) return res.status(404).json({ message: 'Refund request not found' });
    res.json({ success: true, message: 'Refund rejected', data: refund });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllRefunds = async (req, res) => {
  try {
    await ensureRefundsTable();
    const { status } = req.query;
    // SECURITY: this handler is shared between the admin route
    // (AdminRouter "/refunds", gated by adminAuthenticated + can('refunds.manage'))
    // and the end-user route ("/get-refund", isAuthenticated only). It used
    // to run the same unfiltered "every user's refunds" query for both,
    // letting any logged-in user dump every other user's refund reason,
    // status, name, and email. Non-admin callers are now scoped to their own
    // refunds only.
    const isAdminCaller = Boolean(req.admin);
    const userId = req.user?.id || req.user?._id;

    let rows;
    if (isAdminCaller) {
      rows = status
        ? await query(`SELECT r.*, p.first_name, p.last_name, p.email FROM public.refunds r LEFT JOIN public.profiles p ON p.id = r.user_id WHERE r.status = $1 ORDER BY r.created_at DESC`, [status])
        : await query(`SELECT r.*, p.first_name, p.last_name, p.email FROM public.refunds r LEFT JOIN public.profiles p ON p.id = r.user_id ORDER BY r.created_at DESC`);
    } else {
      if (!userId) return res.status(401).json({ success: false, message: 'Not authenticated' });
      rows = status
        ? await query(`SELECT r.*, p.first_name, p.last_name, p.email FROM public.refunds r LEFT JOIN public.profiles p ON p.id = r.user_id WHERE r.user_id = $1 AND r.status = $2 ORDER BY r.created_at DESC`, [userId, status])
        : await query(`SELECT r.*, p.first_name, p.last_name, p.email FROM public.refunds r LEFT JOIN public.profiles p ON p.id = r.user_id WHERE r.user_id = $1 ORDER BY r.created_at DESC`, [userId]);
    }
    res.status(200).json({ success: true, message: 'Refunds fetched', data: rows.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getRefundByRequestId = async (req, res) => {
  try {
    await ensureRefundsTable();
    const userId = req.user.id || req.user._id;
    const { requestId } = req.params;
    const refund = await queryOne(
      `SELECT r.*, p.first_name, p.last_name, p.email FROM public.refunds r LEFT JOIN public.profiles p ON p.id = r.user_id WHERE r.request_id = $1 AND r.user_id = $2`,
      [requestId, userId],
    );
    if (!refund) return res.status(404).json({ success: false, message: 'Refund not found' });
    res.status(200).json({ success: true, data: refund });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
