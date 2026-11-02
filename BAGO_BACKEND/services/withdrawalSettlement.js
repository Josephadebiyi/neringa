import { withTransaction } from '../lib/postgres/db.js';

// Statuses where the user's money has left their wallet but the payout has
// not reached a final outcome yet — a failure from here must refund them.
const IN_FLIGHT_STATUSES = new Set(['pending', 'pending_admin_approval', 'processing', 'approved']);

/**
 * Map a Flutterwave transfer status to our withdrawal status.
 * NEW / PENDING stay in flight; REVERSED means the money came back to Bago
 * after a payout looked successful, so the user must get it back too.
 */
export function withdrawalStatusForTransfer(providerStatus) {
  const status = String(providerStatus || '').trim().toUpperCase();
  if (status === 'SUCCESSFUL' || status === 'SUCCESS') return { status: 'completed', reversed: false };
  if (status === 'FAILED') return { status: 'failed', reversed: false };
  if (status === 'REVERSED') return { status: 'failed', reversed: true };
  return null;
}

/**
 * Apply a payout provider's final outcome to a withdrawal exactly once.
 *
 * Runs in one transaction with the withdrawal row locked, so a webhook, an
 * admin "Sync" and a retry arriving together cannot refund twice:
 *   - SUCCESSFUL: mark completed.
 *   - FAILED: mark failed and put the amount back in the user's wallet.
 *   - REVERSED: same as failed, even if it was already marked completed.
 * A withdrawal that was already refunded (by this or by an admin) is never
 * refunded again.
 *
 * Identify the withdrawal by `reference` (ours, sent to the provider) or by
 * `transactionId` (our wallet_transactions id).
 */
export async function settleWithdrawal({ reference, transactionId, providerStatus, transferId, source = 'provider' }) {
  const outcome = withdrawalStatusForTransfer(providerStatus);
  if (!outcome) return { found: false, changed: false, refunded: false, reason: 'not_final' };
  if (!reference && !transactionId) return { found: false, changed: false, refunded: false, reason: 'no_identifier' };

  return withTransaction(async (client) => {
    const { rows } = await client.query(
      `SELECT id, user_id, wallet_id, amount, currency, status::text AS status, metadata
       FROM public.wallet_transactions
       WHERE type::text = 'withdrawal'
         AND ${transactionId ? 'id = $1' : "metadata->>'reference' = $1"}
       ORDER BY created_at DESC
       LIMIT 1
       FOR UPDATE`,
      [transactionId || reference],
    );
    const tx = rows[0];
    if (!tx) return { found: false, changed: false, refunded: false, reason: 'not_found' };

    const currentStatus = String(tx.status || '').toLowerCase();
    const metadata = { ...(tx.metadata || {}) };
    const alreadyRefunded = metadata.refunded === true || metadata.adminRefunded === true;

    const canRefund = !alreadyRefunded && outcome.status === 'failed' && (
      IN_FLIGHT_STATUSES.has(currentStatus) || (outcome.reversed && currentStatus === 'completed')
    );
    const statusChanges = currentStatus !== outcome.status
      && (IN_FLIGHT_STATUSES.has(currentStatus) || (outcome.reversed && currentStatus === 'completed'));

    if (!canRefund && !statusChanges) {
      return { found: true, changed: false, refunded: false, status: currentStatus, reason: 'already_final' };
    }

    const amount = Number(tx.amount) || 0;
    if (canRefund && amount > 0) {
      const walletUpdate = await client.query(
        `UPDATE public.wallet_accounts
         SET available_balance = available_balance + $2, updated_at = timezone('utc', now())
         WHERE ${tx.wallet_id ? 'id = $1' : 'user_id = $1'}
         RETURNING id`,
        [tx.wallet_id || tx.user_id, amount],
      );
      if (!walletUpdate.rows[0]) {
        throw new Error(`Wallet not found while refunding withdrawal ${tx.id}`);
      }
      metadata.refunded = true;
      metadata.refundedAt = new Date().toISOString();
      metadata.refundSource = source;
    }

    metadata.transferStatus = String(providerStatus).toUpperCase();
    metadata.transferSettledAt = new Date().toISOString();
    metadata.settledBy = source;
    if (outcome.reversed) metadata.reversed = true;
    if (transferId && !metadata.transferId) metadata.transferId = transferId;

    await client.query(
      `UPDATE public.wallet_transactions
       SET status = $2, metadata = $3::jsonb, updated_at = timezone('utc', now())
       WHERE id = $1`,
      [tx.id, outcome.status, JSON.stringify(metadata)],
    );

    return {
      found: true,
      changed: true,
      refunded: canRefund && amount > 0,
      status: outcome.status,
      previousStatus: currentStatus,
      transactionId: tx.id,
      userId: tx.user_id,
      amount,
      currency: tx.currency,
    };
  });
}
