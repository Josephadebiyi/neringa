import { query, withTransaction } from '../../lib/postgres/db.js';

const FINAL_FAILURE_STATUSES = new Set(['failed', 'rejected']);
const REFUNDABLE_STATUSES = new Set(['pending', 'processing', 'approved']);
const ALLOWED_WITHDRAWAL_STATUSES = new Set([
  'pending',
  'approved',
  'rejected',
  'processing',
  'completed',
  'paid',
  'failed',
]);

export const getAllWithdrawals = async (req, res, next) => {
  try {
    let result;
    try {
      result = await query(
        `SELECT wt.id, wt.user_id, wt.amount, wt.status, wt.description, wt.currency,
                wt.created_at, wt.updated_at, wt.metadata,
                p.first_name as "firstName", p.last_name as "lastName", p.email
         FROM public.wallet_transactions wt
         LEFT JOIN public.profiles p ON p.id = wt.user_id
         WHERE wt.type = 'withdrawal'
         ORDER BY wt.created_at DESC`
      );
    } catch (error) {
      if (error?.code !== '42P01' && error?.code !== '42703') throw error;
      result = await query(
        `SELECT t.id, t.user_id, t.amount, t.status, t.description, t.currency,
                t.created_at, t.updated_at,
                p.first_name as "firstName", p.last_name as "lastName", p.email
         FROM public.transactions t
         LEFT JOIN public.profiles p ON p.id = t.user_id
         WHERE t.type = 'withdrawal'
         ORDER BY t.created_at DESC`
      );
    }

    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};

export const updateWithdrawalStatus = async (req, res, next) => {
  const { transactionId } = req.params;
  const { status, failureReason } = req.body;
  const nextStatus = String(status || '').trim().toLowerCase();

  try {
    if (!ALLOWED_WITHDRAWAL_STATUSES.has(nextStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const updated = await withTransaction(async (client) => {
      const walletResult = await client.query(
        `SELECT wt.*, wa.id AS wallet_account_id
         FROM public.wallet_transactions wt
         LEFT JOIN public.wallet_accounts wa ON wa.id = wt.wallet_id
         WHERE wt.id = $1 AND wt.type = 'withdrawal'
         FOR UPDATE OF wt`,
        [transactionId],
      );
      const transaction = walletResult.rows[0];

      if (transaction) {
        const currentStatus = String(transaction.status || '').toLowerCase();
        const metadata = {
          ...(transaction.metadata || {}),
          adminStatusUpdate: {
            adminId: req.admin?.id || null,
            previousStatus: currentStatus,
            nextStatus,
            failureReason: failureReason || null,
            at: new Date().toISOString(),
          },
        };

        const shouldRefund =
          FINAL_FAILURE_STATUSES.has(nextStatus) &&
          REFUNDABLE_STATUSES.has(currentStatus) &&
          metadata.adminRefunded !== true;

        if (shouldRefund) {
          if (!transaction.wallet_account_id) {
            const error = new Error('Wallet account not found for this withdrawal.');
            error.statusCode = 409;
            throw error;
          }
          await client.query(
            `UPDATE public.wallet_accounts
             SET available_balance = available_balance + $2,
                 updated_at = timezone('utc', now())
             WHERE id = $1`,
            [transaction.wallet_account_id, transaction.amount],
          );
          metadata.adminRefunded = true;
          metadata.adminRefundedAt = new Date().toISOString();
        }

        const result = await client.query(
          `UPDATE public.wallet_transactions
           SET status = $1,
               description = COALESCE($2, description),
               metadata = $3::jsonb,
               updated_at = timezone('utc', now())
           WHERE id = $4
           RETURNING id, user_id, amount, currency, status`,
          [
            nextStatus,
            failureReason ? `${transaction.description || 'Withdrawal'} (Admin note: ${failureReason})` : null,
            JSON.stringify(metadata),
            transactionId,
          ],
        );

        return { row: result.rows[0], source: 'wallet_transactions', refunded: shouldRefund };
      }

      const legacyResult = await client.query(
        `SELECT * FROM public.transactions WHERE id = $1 AND type = 'withdrawal' FOR UPDATE`,
        [transactionId],
      );
      const legacy = legacyResult.rows[0];
      if (!legacy) return null;

      const currentStatus = String(legacy.status || '').toLowerCase();
      const description = failureReason
        ? `${legacy.description || ''} (Admin note: ${failureReason})`.trim()
        : legacy.description;

      await client.query(
        `UPDATE public.transactions SET status = $1, description = $2, updated_at = NOW() WHERE id = $3`,
        [nextStatus, description, transactionId],
      );

      const shouldRefund = FINAL_FAILURE_STATUSES.has(nextStatus) && REFUNDABLE_STATUSES.has(currentStatus);
      if (shouldRefund) {
        await client.query(
          `UPDATE public.wallet_accounts
           SET available_balance = available_balance + $2,
               updated_at = timezone('utc', now())
           WHERE user_id = $1`,
          [legacy.user_id, legacy.amount],
        );
      }

      return { row: legacy, source: 'transactions', refunded: shouldRefund };
    });

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    res.status(200).json({
      success: true,
      message: `Withdrawal status updated to ${nextStatus}`,
      source: updated.source,
      refunded: updated.refunded,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};
