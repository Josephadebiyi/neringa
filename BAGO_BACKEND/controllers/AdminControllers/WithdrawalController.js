import { query, queryOne, withTransaction } from '../../lib/postgres/db.js';
import { sendWithdrawalProcessedEmail } from '../../services/emailNotifications.js';
import { convertCurrency } from '../../services/currencyConverter.js';
import { initiateTransfer, getTransferStatus } from '../../services/flutterwaveService.js';
import { getActiveBeneficiary } from '../../lib/postgres/flutterwavePayments.js';

const FINAL_FAILURE_STATUSES = new Set(['failed', 'rejected', 'cancelled']);
const REFUNDABLE_STATUSES = new Set(['pending', 'pending_admin_approval', 'processing', 'approved']);
const ALLOWED_WITHDRAWAL_STATUSES = new Set([
  'pending',
  'pending_admin_approval',
  'approved',
  'rejected',
  'processing',
  'completed',
  'paid',
  'failed',
  'cancelled',
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
  const transferError = metadata.transferError || metadata.payoutError || null;
  const provider = metadata.provider || row.payout_provider || row.payout_method || row.provider || null;
  const failureReason =
    row.failure_reason ||
    metadata.failure_reason ||
    metadata.error ||
    transferError?.message ||
    transferError?.name ||
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
      bankName: bankDetails.bankName || bankDetails.bank_name || null,
      bankCode: bankDetails.bankCode || bankDetails.bank_code || null,
      accountNumber: bankDetails.accountNumber || bankDetails.account_number || null,
      accountName: bankDetails.accountName || bankDetails.account_name || bankDetails.accountHolderName || null,
      iban: bankDetails.iban || null,
    },
    manualReviewRequired: metadata.manualReviewRequired === true,
    manualReviewReason: metadata.manualReviewReason || null,
    transferStatus: metadata.transferStatus || null,
    transferError,
    transferErrorMessage: transferError?.message || transferError?.name || null,
    failure_reason: failureReason,
    processed_at: row.processed_at || (['completed', 'paid'].includes(String(row.status || '').toLowerCase()) ? row.updated_at : null),
  };
}

function getWithdrawalDedupeKey(row) {
  const metadata = row.metadata || {};
  const reference = metadata.reference;
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
          SELECT wt.id, wt.user_id, wt.amount, wt.status::text, wt.description, wt.currency::text,
                 wt.created_at,
                 COALESCE(wt.updated_at, wt.created_at) AS updated_at,
                 wt.metadata,
                 p.first_name, p.last_name, p.email,
                 COALESCE(p.bank_details, '{}'::jsonb) AS bank_details,
                 NULL::text AS payout_provider,
                 NULL::text AS payout_method,
                 NULL::text AS payout_method_status,
                 NULL::text AS payout_status,
                 NULL::text AS payout_currency,
                 NULL::text AS provider,
                 NULL::text AS failure_reason,
                 NULL::timestamptz AS processed_at,
                 'wallet_transactions' AS source
          FROM public.wallet_transactions wt
          LEFT JOIN public.profiles p ON p.id = wt.user_id
          WHERE wt.type::text = 'withdrawal'
            AND coalesce(wt.metadata ->> 'duplicateCleared', 'false') <> 'true'
          ORDER BY created_at DESC
        `
      );
    } catch (error) {
      if (error?.code !== '42P01' && error?.code !== '42703') throw error;
      // Some column doesn't exist yet — fall back to bare minimum columns that are
      // guaranteed to exist (same ones used by assertNoActiveWithdrawal)
      try {
        result = await query(
          `SELECT id, user_id, amount, status::text,
                  NULL::text AS description, currency::text,
                  created_at, created_at AS updated_at, NULL::jsonb AS metadata,
                  NULL::text AS first_name, NULL::text AS last_name,
                  NULL::text AS email, NULL::jsonb AS bank_details,
                  NULL::text AS payout_provider, NULL::text AS payout_method,
                  NULL::text AS payout_method_status, NULL::text AS payout_status,
                  NULL::text AS payout_currency,
                  NULL::text AS provider, NULL::text AS failure_reason,
                  NULL::timestamptz AS processed_at,
                  'wallet_transactions' AS source
           FROM public.wallet_transactions
           WHERE type::text = 'withdrawal'
           ORDER BY created_at DESC`
        );
      } catch {
        result = { rows: [] };
      }
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

// ── Admin: recalculate a user's wallet balance from transaction history ──
export const recalculateWalletBalance = async (req, res, next) => {
  const { userId } = req.params;
  try {
    const result = await withTransaction(async (client) => {
      const walletResult = await client.query(
        `SELECT id, available_balance, escrow_balance, currency FROM public.wallet_accounts WHERE user_id = $1 FOR UPDATE`,
        [userId],
      );
      if (!walletResult.rows[0]) {
        const err = new Error('Wallet not found for this user.');
        err.statusCode = 404;
        throw err;
      }
      const wallet = walletResult.rows[0];
      const oldBalance = Number(wallet.available_balance || 0);
      const oldEscrowBalance = Number(wallet.escrow_balance || 0);
      const walletCurrency = String(wallet.currency || 'USD').toUpperCase();

      // Available balance comes only from completed shipment earnings.
      const earningsResult = await client.query(
        `SELECT wt.id, wt.request_id, wt.amount, wt.currency
         FROM public.wallet_transactions wt
         JOIN public.shipment_requests sr ON sr.id = wt.request_id
         WHERE wt.user_id = $1
           AND wt.type::text = 'earning'
           AND wt.status::text = 'completed'
           AND sr.status::text = 'completed'
           AND wt.request_id IS NOT NULL`,
        [userId],
      );

      // Escrow balance comes from paid/sold kg still pending delivery.
      const escrowResult = await client.query(
        `SELECT wt.id, wt.request_id, wt.amount, wt.currency, sr.status AS shipment_status
         FROM public.wallet_transactions wt
         JOIN public.shipment_requests sr ON sr.id = wt.request_id
         WHERE wt.user_id = $1
           AND wt.type::text = 'escrow_hold'
           AND wt.status::text = 'completed'
           AND wt.request_id IS NOT NULL
           AND lower(sr.status::text) NOT IN ('completed','cancelled','canceled','rejected')`,
        [userId],
      );

      const withdrawalsResult = await client.query(
        `SELECT id, amount, currency
         FROM public.wallet_transactions
         WHERE user_id = $1
           AND type::text IN ('withdrawal','withdraw','payout')
           AND lower(status::text) NOT IN ('failed','rejected','cancelled','canceled')`,
        [userId],
      );

      const toWalletCurrency = async (row) => {
        const amount = Number(row.amount || 0);
        const currency = String(row.currency || walletCurrency).toUpperCase();
        if (!amount || currency === walletCurrency) return amount;
        return convertCurrency(amount, currency, walletCurrency);
      };

      let completedShipmentEarnings = 0;
      for (const row of earningsResult.rows) {
        completedShipmentEarnings += await toWalletCurrency(row);
      }

      let pendingEscrow = 0;
      for (const row of escrowResult.rows) {
        pendingEscrow += await toWalletCurrency(row);
      }

      let activeWithdrawals = 0;
      for (const row of withdrawalsResult.rows) {
        activeWithdrawals += await toWalletCurrency(row);
      }

      const newBalance = Number(Math.max(completedShipmentEarnings - activeWithdrawals, 0).toFixed(2));

      await client.query(
        `UPDATE public.wallet_accounts
         SET available_balance = $2,
             escrow_balance = $3,
             updated_at = timezone('utc', now())
         WHERE id = $1`,
        [wallet.id, newBalance, Number(pendingEscrow.toFixed(2))],
      );
      return {
        oldBalance,
        oldEscrowBalance,
        newBalance,
        newEscrowBalance: Number(pendingEscrow.toFixed(2)),
        walletCurrency,
        completedShipmentEarnings: Number(completedShipmentEarnings.toFixed(2)),
        pendingEscrow: Number(pendingEscrow.toFixed(2)),
        activeWithdrawals: Number(activeWithdrawals.toFixed(2)),
        earningRows: earningsResult.rowCount,
        escrowRows: escrowResult.rowCount,
        withdrawalRows: withdrawalsResult.rowCount,
      };
    });

    return res.json({
      success: true,
      message: 'Wallet recalculated from completed shipment earnings, active withdrawals, and pending kg escrow.',
      oldBalance: result.oldBalance,
      oldEscrowBalance: result.oldEscrowBalance,
      newBalance: result.newBalance,
      newEscrowBalance: result.newEscrowBalance,
      walletCurrency: result.walletCurrency,
      completedShipmentEarnings: result.completedShipmentEarnings,
      pendingEscrow: result.pendingEscrow,
      activeWithdrawals: result.activeWithdrawals,
      earningRows: result.earningRows,
      escrowRows: result.escrowRows,
      withdrawalRows: result.withdrawalRows,
    });
  } catch (error) {
    next(error);
  }
};

// ── Admin: approve a pending_admin_approval withdrawal and call the payout API ──
export const approveWithdrawal = async (req, res, next) => {
  const { transactionId } = req.params;
  const adminId = req.admin?.id || null;

  try {
    const txResult = await query(
      `SELECT wt.*,
              wa.id AS wallet_account_id,
              p.email, p.first_name, p.last_name
       FROM public.wallet_transactions wt
       JOIN public.wallet_accounts wa ON wa.id = wt.wallet_id
       JOIN public.profiles p ON p.id = wt.user_id
       WHERE wt.id = $1 AND wt.type = 'withdrawal' AND wt.status = 'pending_admin_approval'`,
      [transactionId],
    );
    const tx = txResult.rows[0];
    if (!tx) {
      return res.status(404).json({ success: false, message: 'Withdrawal not found or not pending approval.' });
    }

    const metadata = typeof tx.metadata === 'object' ? tx.metadata : JSON.parse(tx.metadata || '{}');
    const amount = Number(tx.amount);
    const currency = tx.currency;

    // Lock it to processing so duplicate admin clicks can't double-send
    await query(
      `UPDATE public.wallet_transactions
       SET status = 'processing',
           metadata = coalesce(metadata, '{}'::jsonb) || $2::jsonb,
           updated_at = timezone('utc', now())
       WHERE id = $1`,
      [transactionId, { adminApproved: true, adminId, approvedAt: new Date().toISOString() }],
    );

    try {
      const beneficiary = await getActiveBeneficiary(tx.user_id);
      if (!beneficiary) throw new Error('No payout account on file for this user.');
      if (beneficiary.currency !== String(currency || '').toUpperCase()) {
        throw new Error(`Payout account currency (${beneficiary.currency}) does not match withdrawal currency (${currency}).`);
      }

      const reference = metadata.reference || `BAGO-WD-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      const transfer = await initiateTransfer({
        accountBank: beneficiary.bank_code,
        accountNumber: beneficiary.type === 'iban' ? beneficiary.iban : beneficiary.account_number,
        swiftCode: beneficiary.swift_code,
        amount: metadata.payoutAmount || amount,
        currency,
        narration: 'Bago wallet withdrawal',
        reference,
        beneficiaryName: beneficiary.account_holder_name,
      });
      if (!transfer.success) throw new Error(transfer.message || 'Transfer failed');

      await query(
        `UPDATE public.wallet_transactions
         SET metadata = coalesce(metadata, '{}'::jsonb) || $2::jsonb, updated_at = timezone('utc', now())
         WHERE id = $1`,
        [transactionId, {
          provider: 'flutterwave',
          reference,
          transferId: transfer.transferId,
          transferStatus: transfer.status,
          payoutInitiatedAt: new Date().toISOString(),
        }],
      );

      await sendWithdrawalProcessedEmail(
        tx.email,
        [tx.first_name, tx.last_name].filter(Boolean).join(' ').trim(),
        { amount, currency, reference, method: 'bank account' },
      ).catch(() => {});

      return res.json({ success: true, message: 'Withdrawal approved and payout initiated.' });

    } catch (payoutError) {
      // Payout API failed — revert to pending_admin_approval so admin can retry or reject.
      // Balance is NOT touched here: it was already deducted when the user initiated the withdrawal.
      await query(
        `UPDATE public.wallet_transactions
         SET status = 'pending_admin_approval',
             metadata = coalesce(metadata, '{}'::jsonb) || $2::jsonb,
             updated_at = timezone('utc', now())
         WHERE id = $1`,
        [transactionId, {
          transferError: { message: payoutError.message, name: payoutError.name || 'PayoutError' },
          lastFailedAt: new Date().toISOString(),
          adminId,
        }],
      ).catch(() => {});
      return res.status(502).json({
        success: false,
        message: `Payout failed: ${payoutError.message}. Withdrawal is back to pending — you can retry or reject it.`,
      });
    }

  } catch (error) {
    next(error);
  }
};

// ── Admin: fetch real Flutterwave transfer status and update wallet transaction ──
export const syncFlutterwaveTransferStatus = async (req, res, next) => {
  const { transactionId } = req.params;
  try {
    const tx = await queryOne(
      `SELECT id, status, metadata FROM public.wallet_transactions WHERE id = $1 AND type = 'withdrawal'`,
      [transactionId],
    );
    if (!tx) return res.status(404).json({ success: false, message: 'Transaction not found.' });

    const meta = parseJsonObject(tx.metadata);
    const transferId = meta.transferId || null;

    if (!transferId) {
      return res.status(400).json({ success: false, message: 'No Flutterwave transfer ID found for this withdrawal.' });
    }

    const result = await getTransferStatus(transferId);
    if (!result.success) {
      return res.status(502).json({ success: false, message: result.message || 'Could not fetch transfer status.' });
    }
    const transferStatus = String(result.status || '').toUpperCase();

    let newStatus = tx.status;
    if (transferStatus === 'SUCCESSFUL') newStatus = 'completed';
    else if (transferStatus === 'FAILED') newStatus = 'failed';

    if (newStatus !== tx.status) {
      await query(
        `UPDATE public.wallet_transactions
         SET status = $1,
             metadata = coalesce(metadata, '{}'::jsonb) || $2::jsonb,
             updated_at = timezone('utc', now())
         WHERE id = $3`,
        [newStatus, { transferStatus, transferSyncedAt: new Date().toISOString() }, transactionId],
      );
    }

    return res.json({ success: true, transferStatus, previousStatus: tx.status, newStatus });
  } catch (error) {
    next(error);
  }
};
