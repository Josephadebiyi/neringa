import Stripe from 'stripe';
import { queryOne } from '../lib/postgres/db.js';

let stripe = null;

export function getStripeClient() {
  if (stripe) return stripe;
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (stripeKey && stripeKey !== 'your_stripe_secret_key' && stripeKey.startsWith('sk_')) {
    stripe = new Stripe(stripeKey);
    return stripe;
  }
  return null;
}

/**
 * create or return an existing Stripe account id for a user
 */
export async function createStripeAccountForUser(user, { restartIncomplete = true } = {}) {
  const stripe = getStripeClient();
  if (!stripe) {
    console.warn('❌ createStripeAccountForUser failed: Stripe not configured');
    throw new Error('Stripe not configured');
  }
  if (!user) throw new Error('User required');

  const existingAccountId = user.stripeConnectAccountId || user.stripe_connect_account_id;
  if (existingAccountId) {
    try {
      const existingAccount = await stripe.accounts.retrieve(existingAccountId);
      const isComplete = existingAccount.charges_enabled === true && existingAccount.payouts_enabled === true;
      if (isComplete) {
        return existingAccountId;
      }
      if (!restartIncomplete && existingAccount.type === 'express') {
        return existingAccountId;
      }
      console.warn('⚠️ Replacing incomplete Stripe ' + existingAccount.type + ' account for user ' + user.id);
    } catch (err) {
      console.warn('⚠️ Saved Stripe account ' + existingAccountId + ' could not be retrieved: ' + err.message);
    }
  }

  try {
    const payoutCountry = (user.payout_country || user.country || '').toString().trim().toUpperCase();
    const accountParams = {
      type: 'express',
      email: user.email,
      capabilities: { transfers: { requested: true } },
    };
    if (/^[A-Z]{2}$/.test(payoutCountry)) {
      accountParams.country = payoutCountry;
    }

    const account = await stripe.accounts.create({
      ...accountParams,
    });

    await queryOne(
      'UPDATE public.profiles SET stripe_connect_account_id = $2, stripe_account_id = $2, payout_provider = \'stripe\', payout_method_status = \'onboarding\', stripe_onboarding_status = \'created\', updated_at = NOW() WHERE id = $1',
      [user.id, account.id]
    );

    console.log('✅ Created Stripe account ' + account.id + ' for user ' + user.id);
    return account.id;
  } catch (err) {
    console.error('❌ Stripe Account Creation Error:', err.message);
    throw err;
  }
}
