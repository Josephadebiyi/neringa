import { query as defaultQuery } from '../lib/postgres/db.js';

const ACTIVE_WITHDRAWAL_STATUSES = ['pending', 'pending_admin_approval', 'processing', 'approved'];

export async function findActiveWithdrawal(clientOrDb, userId) {
  const runner = clientOrDb?.query ? clientOrDb : null;
  const runQuery = runner ? runner.query.bind(runner) : defaultQuery;

  const walletResult = await runQuery(
    `
      SELECT id, status, amount, currency, created_at, 'wallet_transactions' AS source
      FROM public.wallet_transactions
      WHERE user_id = $1
        AND type = 'withdrawal'
        AND lower(coalesce(status::text, 'pending')) = ANY($2::text[])
      ORDER BY created_at DESC
      LIMIT 1
    `,
    [userId, ACTIVE_WITHDRAWAL_STATUSES],
  ).catch((error) => {
    if (error?.code === '42P01' || error?.code === '42703') return { rows: [] };
    throw error;
  });
  if (walletResult.rows[0]) return walletResult.rows[0];

  const paystackResult = await runQuery(
    `
      SELECT id, status, amount, currency, created_at, 'paystack_pending_withdrawals' AS source
      FROM public.paystack_pending_withdrawals
      WHERE user_id = $1
        AND lower(coalesce(status::text, 'pending')) = ANY($2::text[])
      ORDER BY created_at DESC
      LIMIT 1
    `,
    [userId, ACTIVE_WITHDRAWAL_STATUSES],
  ).catch((error) => {
    if (error?.code === '42P01' || error?.code === '42703') return { rows: [] };
    throw error;
  });
  return paystackResult.rows[0] || null;
}

export async function assertNoActiveWithdrawal(clientOrDb, userId) {
  const active = await findActiveWithdrawal(clientOrDb, userId);
  if (!active) return;

  const error = new Error('You already have a withdrawal being processed. Please wait for it to complete before requesting another one.');
  error.statusCode = 409;
  error.code = 'ACTIVE_WITHDRAWAL_EXISTS';
  error.activeWithdrawal = active;
  throw error;
}
