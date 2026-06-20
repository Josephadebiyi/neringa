import { query, withTransaction } from '../../lib/postgres/db.js';
import { sendWithdrawalProcessedEmail } from '../../services/emailNotifications.js';

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

function parseJsonObject(value) {
  if (!value) return {};
  if (typeof value === 'object') return value;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function normalizeWithdrawalRow(row) {
  const metadata = parseJsonObject(row.metadata);
  const bankDetails = parseJsonObject(row.bank_details);
  const paypalError = metadata.paypalError || null;
  const paypalPayout = metadata.paypalPayout || null;
  const provider =
    metadata.provider ||
    metadata.method ||
    row.payout_provider ||
    row.payout_method ||
    (bankDetails.paypalEmail || bankDetails.paypal_email ? 'paypal' : null) ||
    (bankDetails.recipientCode || bankDetails.accountNumber || row.paystack_recipient_code ? 'paystack' : null) ||
    (paypalError || paypalPayout ? 'paypal' : row.provider || null);
  const failureReason =
    row.failure_reason ||
    metadata.failure_reason ||
    metadata.error ||
    paypalError?.message ||
    paypalError?.name ||
    null;

  return {
    ...row,
    metadata,
    provider,
    payoutDetails: {
      provider,
      method: row.payout_method || metadata.method || provider || null,
      status: row.payout_method_status || row.payout_status || null,
      currency: row.payout_currency || row.currency || bankDetails.currency || null,
      reference: metadata.reference || row.reference || null,
      paypalEmail: metadata.paypalEmail || bankDetails.paypalEmail || bankDetails.paypal_email || null,
      bankName: bankDetails.bankName || bankDetails.bank_name || null,
      bankCode: bankDetails.bankCode || bankDetails.bank_code || null,
      accountNumber: bankDetails.accountNumber || bankDetails.account_number || null,
      accountName: bankDetails.accountName || bankDetails.account_name || bankDetails.accountHolderName || null,
      recipientCode: bankDetails.recipientCode || bankDetails.recipient_code || row.paystack_recipient_code || null,
    },
    manualReviewRequired: metadata.manualReviewRequired === true,
    manualReviewReason: metadata.manualReviewReason || null,
    paypalStatus:
      paypalPayout?.batch_header?.batch_status ||
      paypalPayout?.batchHeader?.batchStatus ||
      paypalPayout?.status ||
      null,
    paypalBatchId:
      paypalPayout?.batch_header?.payout_batch_id ||
      paypalPayout?.batchHeader?.payoutBatchId ||
      null,
    paypalError,
    paypalErrorMessage: paypalError?.message || paypalError?.name || null,
    paypalDebugId: paypalError?.debugId || paypalError?.debug_id || null,
    failure_reason: failureReason,
    processed_at: row.processed_at || (['completed', 'paid'].includes(String(row.status || '').toLowerCase()) ? row.updated_at : null),
  };
}

function getWithdrawalDedupeKey(row) {
  const metadata = row.metadata || {};
  const reference = metadata.reference || metadata.paypalBatchId || metadata.paypal_batch_id;
  if (reference) return `ref:${reference}`;

  const createdAt = row.created_at ? new Date(row.created_at).getTime() : 0;
  const minuteBucket = Number.isFinite(createdAt) ? Math.floor(createdAt / 60000) : 0;
  return [
    'soft',
    row.source || '',
    row.user_id || '',
    row.amount || '',
    row.currency || '',
    String(row.status || '').toLowerCase(),
    metadata.provider || metadata.method || row.provider || '',
    minuteBucket,
  ].join(':');
}

function dedupeWithdrawalRows(rows) {
  const seen = new Set();
  const deduped = [];

  for (const row of rows.map(normalizeWithdrawalRow)) {
    const key = getWithdrawalDedupeKey(row);
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(row);
  }

  return deduped;
}

export const getAllWithdrawals = async (req, res, next) => {
  try {
    let result;
    try {
      result = await query(
        `
          SELECT wt.id, wt.user_id, wt.amount, wt.status, wt.description, wt.currency,
                 wt.created_at, wt.updated_at, wt.metadata,
                 p.first_name, p.last_name, p.email, p.bank_details,
                 p.payout_provider, p.payout_method, p.payout_method_status, p.payout_status, p.payout_currency,
                 p.paystack_recipient_code,
                 NULL::text AS provider,
                 NULL::text AS failure_reason,
                 CASE WHEN lower(coalesce(wt.status, '')) IN ('completed', 'paid') THEN wt.updated_at ELSE NULL END AS processed_at,
                 'wallet_transactions' AS source
          FROM public.wallet_transactions wt
          LEFT JOIN public.profiles p ON p.id = wt.user_id
          WHERE wt.type = 'withdrawal'
            AND coalesce(wt.metadata ->> 'duplicateCleared', 'false') <> 'true'
          UNION ALL
          SELECT ppw.id, ppw.user_id, ppw.amount, ppw.status,
                 'Paystack bank withdrawal' AS description, ppw.currency,
                 ppw.created_at, ppw.updated_at,
                 jsonb_build_object('provider', 'paystack', 'reference', ppw.reference) AS metadata,
                 p.first_name, p.last_name, p.email, p.bank_details,
                 p.payout_provider, p.payout_method, p.payout_method_status, p.payout_status, p.payout_currency,
                 p.paystack_recipient_code,
                 'paystack' AS provider,
                 NULL::text AS failure_reason,
                 CASE WHEN lower(coalesce(ppw.status, '')) IN ('completed', 'paid') THEN ppw.updated_at ELSE NULL END AS processed_at,
                 'paystack_pending_withdrawals' AS source
          FROM public.paystack_pending_withdrawals ppw
          LEFT JOIN public.profiles p ON p.id = ppw.user_id
          WHERE lower(coalesce(ppw.status, 'pending')) <> 'cancelled'
          ORDER BY created_at DESC
        `
      );
    } catch (error) {
      if (error?.code !== '42P01' && error?.code !== '42703') throw error;
      result = await query(
        `SELECT t.id, t.user_id, t.amount, t.status, t.description, t.currency,
                t.created_at, t.updated_at, '{}'::jsonb AS metadata,
                p.first_name, p.last_name, p.email, p.bank_details,
                p.payout_provider, p.payout_method, p.payout_method_status, p.payout_status, p.payout_currency,
                p.paystack_recipient_code,
                NULL::text AS provider,
                NULL::text AS failure_reason,
                CASE WHEN lower(coalesce(t.status, '')) IN ('completed', 'paid') THEN t.updated_at ELSE NULL END AS processed_at,
                'transactions' AS source
         FROM public.transactions t
         LEFT JOIN public.profiles p ON p.id = t.user_id
         WHERE t.type = 'withdrawal'
         ORDER BY t.created_at DESC`
      );
    }

    res.status(200).json({ success: true, data: dedupeWithdrawalRows(result.rows) });
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
        `SELECT wt.*, wa.id AS wallet_account_id,
                p.email, p.first_name, p.last_name
         FROM public.wallet_transactions wt
         LEFT JOIN public.wallet_accounts wa ON wa.id = wt.wallet_id
         LEFT JOIN public.profiles p ON p.id = wt.user_id
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

        return {
          row: {
            ...result.rows[0],
            email: transaction.email,
            first_name: transaction.first_name,
            last_name: transaction.last_name,
            metadata,
          },
          source: 'wallet_transactions',
          refunded: shouldRefund,
          previousStatus: currentStatus,
        };
      }

      const paystackPendingResult = await client.query(
        `SELECT ppw.*, p.email, p.first_name, p.last_name
         FROM public.paystack_pending_withdrawals ppw
         LEFT JOIN public.profiles p ON p.id = ppw.user_id
         WHERE ppw.id = $1
         FOR UPDATE OF ppw`,
        [transactionId],
      );
      const paystackPending = paystackPendingResult.rows[0];
      if (paystackPending) {
        const currentStatus = String(paystackPending.status || '').toLowerCase();
        const shouldRefund = FINAL_FAILURE_STATUSES.has(nextStatus) && REFUNDABLE_STATUSES.has(currentStatus);
        if (shouldRefund) {
          await client.query(
            `UPDATE public.profiles
             SET available_balance = available_balance + $2,
                 updated_at = timezone('utc', now())
             WHERE id = $1`,
            [paystackPending.user_id, paystackPending.amount],
          );
        }

        const result = await client.query(
          `UPDATE public.paystack_pending_withdrawals
           SET status = $1,
               updated_at = timezone('utc', now())
           WHERE id = $2
           RETURNING id, user_id, amount, currency, status, reference, created_at, updated_at`,
          [nextStatus, transactionId],
        );

        return {
          row: {
            ...result.rows[0],
            email: paystackPending.email,
            first_name: paystackPending.first_name,
            last_name: paystackPending.last_name,
            metadata: { provider: 'paystack', reference: paystackPending.reference },
          },
          source: 'paystack_pending_withdrawals',
          refunded: shouldRefund,
          previousStatus: currentStatus,
        };
      }

      const legacyResult = await client.query(
        `SELECT t.*, p.email, p.first_name, p.last_name
         FROM public.transactions t
         LEFT JOIN public.profiles p ON p.id = t.user_id
         WHERE t.id = $1 AND t.type = 'withdrawal'
         FOR UPDATE OF t`,
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

      return { row: legacy, source: 'transactions', refunded: shouldRefund, previousStatus: currentStatus };
    });

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    if (
      ['completed', 'paid'].includes(nextStatus) &&
      !['completed', 'paid'].includes(String(updated.previousStatus || '').toLowerCase())
    ) {
      await sendWithdrawalProcessedEmail(
        updated.row.email,
        [updated.row.first_name, updated.row.last_name].filter(Boolean).join(' ').trim(),
        {
          amount: updated.row.amount,
          currency: updated.row.currency,
          reference: updated.row.metadata?.reference || updated.row.id,
          method: updated.row.metadata?.provider || updated.row.metadata?.method || 'payout account',
        },
      ).catch(() => {});
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
