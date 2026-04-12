import { query, queryOne } from '../../lib/postgres/db.js';

export const getAllWithdrawals = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT t.id, t.user_id, t.amount, t.status, t.description, t.currency,
              t.created_at, t.updated_at,
              p.first_name as "firstName", p.last_name as "lastName", p.email
       FROM public.transactions t
       LEFT JOIN public.profiles p ON p.id = t.user_id
       WHERE t.type = 'withdrawal'
       ORDER BY t.created_at DESC`
    );

    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};

export const updateWithdrawalStatus = async (req, res, next) => {
  const { transactionId } = req.params;
  const { status, failureReason } = req.body;

  try {
    if (!['completed', 'failed', 'pending'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const transaction = await queryOne(
      `SELECT * FROM public.transactions WHERE id = $1 AND type = 'withdrawal'`,
      [transactionId]
    );
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    const description = failureReason
      ? `${transaction.description || ''} (Failed: ${failureReason})`.trim()
      : transaction.description;

    await queryOne(
      `UPDATE public.transactions SET status = $1, description = $2, updated_at = NOW() WHERE id = $3`,
      [status, description, transactionId]
    );

    // Refund balance if withdrawal failed
    if (transaction.status === 'pending' && status === 'failed') {
      await queryOne(
        `UPDATE public.profiles SET balance = COALESCE(balance, 0) + $1 WHERE id = $2`,
        [transaction.amount, transaction.user_id]
      );
    }

    res.status(200).json({ success: true, message: `Withdrawal status updated to ${status}` });
  } catch (error) {
    next(error);
  }
};
