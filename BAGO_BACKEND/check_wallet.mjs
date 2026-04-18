import { query, queryOne } from './lib/postgres/db.js';

try {
  const user = await queryOne("SELECT id, email FROM public.profiles WHERE email = $1", ['alalialabo@gmail.com']);
  console.log('User:', JSON.stringify(user));
  if (user) {
    const wallet = await queryOne('SELECT id, user_id, escrow_balance, available_balance, currency FROM public.wallet_accounts WHERE user_id = $1', [user.id]);
    console.log('Wallet:', JSON.stringify(wallet));

    const reqs = await query(
      "SELECT id, traveler_id, amount, currency, payment_info, status FROM public.shipment_requests WHERE traveler_id = $1 ORDER BY created_at DESC LIMIT 5",
      [user.id]
    );
    console.log('Requests:', JSON.stringify(reqs.rows));

    if (wallet && Number(wallet.escrow_balance) === 0) {
      // Backfill: find paid requests with amount
      const paidReqs = reqs.rows.filter(r => (r.payment_info?.status === 'paid') || r.status === 'intransit' || r.status === 'delivering');
      console.log('Paid/active requests to backfill:', paidReqs.length);
      const totalAmount = paidReqs.reduce((sum, r) => sum + Number(r.amount || 0), 0);
      if (totalAmount > 0) {
        await query(
          "UPDATE public.wallet_accounts SET escrow_balance = $2, updated_at = NOW() WHERE user_id = $1",
          [user.id, totalAmount]
        );
        console.log(`Backfilled escrow_balance = ${totalAmount}`);
      }
    }
  }
} catch(e) { console.error('Error:', e.message); }
process.exit(0);
