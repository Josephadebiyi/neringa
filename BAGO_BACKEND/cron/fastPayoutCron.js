import cron from "node-cron";
import { query as pgQuery, withTransaction } from "../lib/postgres/db.js";
import { getAppSettings } from "../controllers/AdminControllers/setting.js";

// Fast Payout: for businesses an admin has manually enabled it for, release
// escrowed earnings ~N hours after the booking/payment was confirmed instead
// of waiting for the normal delivery-completion release (confirmShipmentReceived
// / redeemHandoverToken / escrowCron.js). Never applies just because a
// business passed KYC — only `profiles.fast_payout_enabled = true` matters.
const BLOCKED_STATUSES = new Set(['pending', 'rejected', 'cancelled', 'refund_approved', 'partial_refund_approved', 'refund_declined']);

export const startFastPayoutRelease = () => {
  // Run every 15 minutes — the wait window is measured in hours, so this is frequent enough.
  cron.schedule("*/15 * * * *", async () => {
    console.log("⚡ Running Fast Payout release job...");

    try {
      const { fastPayoutWaitHours = 2 } = await getAppSettings();

      // A request can accumulate MULTIPLE escrow_hold rows (e.g. a sender pays
      // for additional kg on an already-accepted request) — sum ALL of them
      // and release the full outstanding amount in one shot, using the LATEST
      // hold's timestamp for the wait check, so every dollar has genuinely
      // waited the full window and `fast_payout_released_at` really does mean
      // "100% of this request's held funds moved to available_balance".
      // postgresRequestController.js blocks new escrow holds on a request once
      // fast_payout_released_at is set, so this invariant holds going forward.
      const eligible = await pgQuery(
        `SELECT sr.id, sr.traveler_id, sr.status, sr.dispute,
                wt.currency, wt.total_amount AS amount, wt.latest_held_at AS held_at
         FROM public.shipment_requests sr
         JOIN public.profiles p ON p.id = sr.traveler_id AND p.fast_payout_enabled = true
         JOIN LATERAL (
           SELECT currency, SUM(amount) AS total_amount, MAX(created_at) AS latest_held_at
           FROM public.wallet_transactions
           WHERE request_id = sr.id AND user_id = sr.traveler_id AND type = 'escrow_hold' AND status = 'completed'
           GROUP BY currency
         ) wt ON true
         WHERE sr.fast_payout_released_at IS NULL
           AND NOT EXISTS (
             SELECT 1 FROM public.wallet_transactions
             WHERE request_id = sr.id AND user_id = sr.traveler_id AND type = 'earning'
           )`,
        [],
      );

      const rows = eligible.rows || [];

      for (const row of rows) {
        if (BLOCKED_STATUSES.has(row.status)) continue;
        if (row.dispute && row.dispute.status && row.dispute.status !== 'resolved') continue;

        const hoursPassed = (Date.now() - new Date(row.held_at).getTime()) / (1000 * 60 * 60);
        if (hoursPassed < fastPayoutWaitHours) continue;

        const amount = parseFloat(row.amount) || 0;
        if (amount <= 0) continue;

        await withTransaction(async (client) => {
          const walletResult = await client.query(
            `SELECT id, currency FROM public.wallet_accounts WHERE user_id = $1 FOR UPDATE`,
            [row.traveler_id],
          );
          const wallet = walletResult.rows[0];
          if (!wallet) return;

          // Re-check inside the lock — another release path may have credited between the select above and now.
          const alreadyCredited = await client.query(
            `SELECT id FROM public.wallet_transactions WHERE request_id = $1 AND user_id = $2 AND type = 'earning' LIMIT 1`,
            [row.id, row.traveler_id],
          );
          if (alreadyCredited.rows[0]) {
            await client.query(
              `UPDATE public.shipment_requests SET fast_payout_released_at = timezone('utc', now()) WHERE id = $1 AND fast_payout_released_at IS NULL`,
              [row.id],
            );
            return;
          }

          // Re-sum inside the lock in case a new hold slipped in between the select above and now.
          const currentSum = await client.query(
            `SELECT COALESCE(SUM(amount), 0) AS total FROM public.wallet_transactions
             WHERE request_id = $1 AND user_id = $2 AND type = 'escrow_hold' AND status = 'completed'`,
            [row.id, row.traveler_id],
          );
          const releaseAmount = parseFloat(currentSum.rows[0]?.total) || 0;
          if (releaseAmount <= 0) return;

          await client.query(
            `UPDATE public.wallet_accounts
             SET available_balance = available_balance + $2,
                 escrow_balance = GREATEST(0, escrow_balance - $2),
                 updated_at = timezone('utc', now())
             WHERE user_id = $1`,
            [row.traveler_id, releaseAmount],
          );
          await client.query(
            `INSERT INTO public.wallet_transactions
               (wallet_id, user_id, request_id, type, amount, currency, status, description, metadata)
             VALUES ($1,$2,$3,'earning',$4,$5,'completed',$6,$7)`,
            [wallet.id, row.traveler_id, row.id, releaseAmount, row.currency,
             `Fast Payout — released ${fastPayoutWaitHours}h after booking confirmation`,
             JSON.stringify({ requestId: row.id, fastPayout: true, waitHours: fastPayoutWaitHours })],
          );
          await client.query(
            `UPDATE public.shipment_requests SET fast_payout_released_at = timezone('utc', now()) WHERE id = $1`,
            [row.id],
          );

          console.log(`⚡ Fast Payout released ${releaseAmount} ${row.currency} for request ${row.id}`);
        });
      }

      console.log("✅ Fast Payout release cron finished successfully.");
    } catch (error) {
      console.error("❌ Fast Payout release cron failed:", error);
    }
  });
};
