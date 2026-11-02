import cron from "node-cron";
import { query as pgQuery, withTransaction } from "../lib/postgres/db.js";

export const startEscrowAutoRelease = () => {
  // Run every hour
  cron.schedule("0 * * * *", async () => {
    console.log("⏰ Running escrow auto-release job...");

    try {
      // Find completed requests with proof, sender hasn't confirmed, not yet auto-released
      // Note: DB enum uses 'completed' (not 'delivered') for delivered shipments
      const eligible = await pgQuery(
        `SELECT id, traveler_id, sender_id, amount, currency, updated_at
         FROM public.shipment_requests
         WHERE sender_proof_url IS NOT NULL
           AND (sender_received IS NULL OR sender_received = false)
           AND (auto_released IS NULL OR auto_released = false)
           AND fast_payout_released_at IS NULL
           AND status = 'completed'
           AND (
             dispute IS NULL
             OR (dispute->>'status') = 'resolved'
           )`,
        []
      );

      const rows = eligible.rows || eligible;

      for (const req of rows) {
        const lastUpdated = new Date(req.updated_at);
        const hoursPassed = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60);

        // Wait at least 48 hours since last update
        if (hoursPassed < 48) continue;

        // Pay exactly what is held in escrow for this booking, under the same
        // rules as the sender-confirmation and fast-payout paths: lock the
        // traveler's wallet, skip if any path already paid (an 'earning' row
        // exists), and write that 'earning' row so no other path pays again.
        const released = await withTransaction(async (client) => {
          const walletResult = await client.query(
            `SELECT id, currency FROM public.wallet_accounts WHERE user_id = $1 FOR UPDATE`,
            [req.traveler_id],
          );
          const wallet = walletResult.rows[0];
          if (!wallet) return null;

          // Re-check inside the lock: the sender may have confirmed meanwhile.
          const stillEligible = await client.query(
            `SELECT id, tracking_number, trip_id FROM public.shipment_requests
             WHERE id = $1
               AND (sender_received IS NULL OR sender_received = false)
               AND (auto_released IS NULL OR auto_released = false)
               AND fast_payout_released_at IS NULL
             FOR UPDATE`,
            [req.id],
          );
          const request = stillEligible.rows[0];
          if (!request) return null;

          const alreadyPaid = await client.query(
            `SELECT id FROM public.wallet_transactions
             WHERE request_id = $1 AND user_id = $2 AND type = 'earning' LIMIT 1`,
            [req.id, req.traveler_id],
          );
          if (alreadyPaid.rows[0]) {
            await client.query(
              `UPDATE public.shipment_requests SET auto_released = true, updated_at = NOW() WHERE id = $1`,
              [req.id],
            );
            return null;
          }

          // Sum every hold — extra-kg payments add their own escrow_hold rows.
          const heldResult = await client.query(
            `SELECT COALESCE(SUM(amount), 0) AS amount, MAX(currency) AS currency
             FROM public.wallet_transactions
             WHERE request_id = $1 AND user_id = $2 AND type = 'escrow_hold' AND status = 'completed'`,
            [req.id, req.traveler_id],
          );
          const amount = Number(heldResult.rows[0]?.amount) || 0;
          if (amount <= 0) {
            // Never guess: the sender's payment includes Bago's fees and
            // insurance, so paying it out would overpay the traveler.
            console.warn(`Escrow auto-release skipped for request ${req.id}: no escrow hold on record — needs admin review.`);
            return null;
          }
          const currency = String(heldResult.rows[0]?.currency || wallet.currency || 'USD').toUpperCase();

          await client.query(
            `UPDATE public.wallet_accounts
             SET escrow_balance = GREATEST(0, escrow_balance - $2),
                 available_balance = available_balance + $2,
                 updated_at = NOW()
             WHERE user_id = $1`,
            [req.traveler_id, amount],
          );
          await client.query(
            `INSERT INTO public.wallet_transactions
               (wallet_id, user_id, request_id, trip_id, type, amount, currency, status, description, metadata)
             VALUES ($1, $2, $3, $4, 'earning', $5, $6, 'completed', $7, $8)`,
            [wallet.id, req.traveler_id, req.id, request.trip_id, amount, currency,
             `Earned for delivering ${request.tracking_number || req.id} (auto-released)`,
             JSON.stringify({ requestId: req.id, autoReleased: true, heldAmount: amount })],
          );
          await client.query(
            `UPDATE public.shipment_requests SET auto_released = true, updated_at = NOW() WHERE id = $1`,
            [req.id],
          );
          return { amount, currency };
        });
        if (!released) continue;
        // Bookkeeping only, outside the payout transaction: a failure here
        // (e.g. no ledger row) must not roll back the traveler's payment.
        await pgQuery(
          `UPDATE public.shipment_ledgers
           SET escrow_status = 'released', payout_status = 'available', wallet_credit_created = true,
               updated_at = timezone('utc', now())
           WHERE shipment_id = $1`,
          [req.id],
        ).catch(() => {});
        const amount = `${released.currency} ${released.amount}`;

        console.log(`💸 Auto-released ${amount} for request ${req.id}`);
      }

      console.log("✅ Escrow auto-release cron finished successfully.");
    } catch (error) {
      console.error("❌ Escrow auto-release cron failed:", error);
    }
  });
};
