import cron from "node-cron";
import { query as pgQuery } from "../lib/postgres/db.js";
import { convertCurrency } from "../services/currencyConverter.js";

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

        // Use the actual escrowed amount from wallet_transactions (already in wallet currency)
        const escrowTx = await pgQuery(
          `SELECT wt.amount, wt.currency FROM public.wallet_transactions wt
           WHERE wt.request_id = $1 AND wt.user_id = $2 AND wt.type = 'escrow_hold'
           ORDER BY wt.created_at DESC LIMIT 1`,
          [req.id, req.traveler_id]
        );
        let amount = escrowTx.rows[0] ? parseFloat(escrowTx.rows[0].amount) : 0;
        if (!amount) {
          // Fallback: convert request amount to wallet currency
          const walletRow = await pgQuery(`SELECT currency FROM public.wallet_accounts WHERE user_id=$1`, [req.traveler_id]);
          const walletCurrency = walletRow.rows[0]?.currency || 'USD';
          const reqCurrency = (req.currency || 'USD').toUpperCase();
          const raw = parseFloat(req.amount) || 0;
          amount = reqCurrency !== walletCurrency ? await convertCurrency(raw, reqCurrency, walletCurrency) : raw;
        }
        if (amount <= 0) continue;

        // Transfer escrow → traveler available balance (wallet_accounts is source of truth)
        await pgQuery(
          `UPDATE public.wallet_accounts
           SET escrow_balance = GREATEST(0, escrow_balance - $2),
               available_balance = available_balance + $2,
               updated_at = NOW()
           WHERE user_id = $1`,
          [req.traveler_id, amount]
        );

        // Mark request as auto-released
        await pgQuery(
          `UPDATE public.shipment_requests
           SET auto_released = true, updated_at = NOW()
           WHERE id = $1`,
          [req.id]
        );

        console.log(`💸 Auto-released $${amount} for request ${req.id}`);
      }

      console.log("✅ Escrow auto-release cron finished successfully.");
    } catch (error) {
      console.error("❌ Escrow auto-release cron failed:", error);
    }
  });
};
