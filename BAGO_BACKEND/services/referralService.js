import { query, queryOne, withTransaction } from '../lib/postgres/db.js';
import { convertCurrency } from './currencyConverter.js';
import { getAppSettings } from '../controllers/AdminControllers/setting.js';
import { sendPushNotification } from './pushNotificationService.js';

const WELCOME_TRIGGER = 'welcome';
const SHIPMENT_TRIGGER = 'shipment_over_threshold';

async function ensureReferralInfrastructure(clientOrQuery = null) {
  const exec = clientOrQuery?.query ? (sql, params) => clientOrQuery.query(sql, params) : query;
  await exec(`
    CREATE TABLE IF NOT EXISTS public.referral_rewards (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
      referred_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
      request_id UUID NULL REFERENCES public.shipment_requests(id) ON DELETE SET NULL,
      trigger TEXT NOT NULL,
      amount_base NUMERIC(14,4) NOT NULL DEFAULT 0,
      base_currency TEXT NOT NULL DEFAULT 'NGN',
      referrer_amount NUMERIC(14,4) NOT NULL DEFAULT 0,
      referrer_currency TEXT NOT NULL DEFAULT 'USD',
      referred_amount NUMERIC(14,4) NOT NULL DEFAULT 0,
      referred_currency TEXT NOT NULL DEFAULT 'USD',
      created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
      UNIQUE (referrer_id, referred_id, trigger)
    )
  `);
}

function normalizeReferralCode(value = '') {
  return String(value).trim().toUpperCase();
}

function buildReferralCode(firstName, userId) {
  const prefix = String(firstName || 'BAGO').replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, 5) || 'BAGO';
  return `${prefix}${String(userId || '').replace(/-/g, '').slice(0, 6).toUpperCase()}`;
}

async function ensureUserReferralCode(userId) {
  await ensureReferralInfrastructure();
  const row = await queryOne(
    `SELECT id, first_name, referral_code FROM public.profiles WHERE id = $1`,
    [userId],
  );
  if (!row) return null;
  if (row.referral_code) return row.referral_code;

  const code = buildReferralCode(row.first_name, row.id);
  const updated = await queryOne(
    `
      UPDATE public.profiles
      SET referral_code = $2,
          updated_at = timezone('utc', now())
      WHERE id = $1
      RETURNING referral_code
    `,
    [userId, code],
  );
  return updated?.referral_code || code;
}

async function getWallet(client, userId) {
  const result = await client.query(
    `SELECT id, currency FROM public.wallet_accounts WHERE user_id = $1 FOR UPDATE`,
    [userId],
  );
  return result.rows[0] || null;
}

async function getWalletCurrency(userId) {
  const row = await queryOne(
    `SELECT currency FROM public.wallet_accounts WHERE user_id = $1`,
    [userId],
  );
  return (row?.currency || 'USD').toUpperCase();
}

async function creditWallet(client, { userId, amount, currency, description, metadata }) {
  if (!amount || amount <= 0) return;
  const wallet = await getWallet(client, userId);
  if (!wallet) return;

  await client.query(
    `
      UPDATE public.wallet_accounts
      SET available_balance = available_balance + $2,
          updated_at = timezone('utc', now())
      WHERE user_id = $1
    `,
    [userId, amount],
  );

  await client.query(
    `
      INSERT INTO public.wallet_transactions
        (wallet_id, user_id, type, amount, currency, status, description, metadata)
      VALUES ($1, $2, 'credit', $3, $4, 'completed', $5, $6)
    `,
    [wallet.id, userId, amount, currency || wallet.currency || 'USD', description, metadata || {}],
  );
}

async function notifyReward(userId, amount, currency, title) {
  if (!amount || amount <= 0) return;
  const formatted = `${currency} ${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  sendPushNotification(
    userId,
    title,
    `${formatted} has been added to your Bago wallet and is available to withdraw.`,
    { type: 'wallet_bonus', amount: String(amount), currency },
  ).catch((error) => console.warn(`Referral reward notification failed for user ${userId}: ${error.message}`));
}

async function rewardPair({ referrerId, referredId, trigger, requestId = null, amountBase, baseCurrency, title }) {
  if (!referrerId || !referredId || referrerId === referredId || !amountBase || amountBase <= 0) return null;

  const result = await withTransaction(async (client) => {
    await ensureReferralInfrastructure(client);

    const existing = await client.query(
      `
        SELECT id FROM public.referral_rewards
        WHERE referrer_id = $1 AND referred_id = $2 AND trigger = $3
        LIMIT 1
      `,
      [referrerId, referredId, trigger],
    );
    if (existing.rows[0]) return null;

    const referrerWallet = await getWallet(client, referrerId);
    const referredWallet = await getWallet(client, referredId);
    if (!referrerWallet || !referredWallet) return null;

    const referrerCurrency = (referrerWallet.currency || 'USD').toUpperCase();
    const referredCurrency = (referredWallet.currency || 'USD').toUpperCase();
    const referrerAmount = await convertCurrency(amountBase, baseCurrency, referrerCurrency);
    const referredAmount = await convertCurrency(amountBase, baseCurrency, referredCurrency);

    const reward = await client.query(
      `
        INSERT INTO public.referral_rewards (
          referrer_id, referred_id, request_id, trigger, amount_base, base_currency,
          referrer_amount, referrer_currency, referred_amount, referred_currency
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
        RETURNING *
      `,
      [referrerId, referredId, requestId, trigger, amountBase, baseCurrency, referrerAmount, referrerCurrency, referredAmount, referredCurrency],
    );

    await creditWallet(client, {
      userId: referrerId,
      amount: referrerAmount,
      currency: referrerCurrency,
      description: title,
      metadata: { trigger, referredId, requestId, baseAmount: amountBase, baseCurrency },
    });
    await creditWallet(client, {
      userId: referredId,
      amount: referredAmount,
      currency: referredCurrency,
      description: title,
      metadata: { trigger, referrerId, requestId, baseAmount: amountBase, baseCurrency },
    });

    return reward.rows[0];
  });

  if (result) {
    await notifyReward(referrerId, result.referrer_amount, result.referrer_currency, title);
    await notifyReward(referredId, result.referred_amount, result.referred_currency, title);
  }
  return result;
}

export async function getReferralSummary(userId) {
  const code = await ensureUserReferralCode(userId);
  const settings = await getAppSettings();
  await ensureReferralInfrastructure();

  const walletCurrency = await getWalletCurrency(userId);
  const welcomeBonusBase = Number(settings.referralWelcomeBonusNgn ?? 2000);
  const shipmentBonusBase = Number(settings.referralShipmentBonusUsd ?? 2);
  const welcomeBonusAmount = await convertCurrency(welcomeBonusBase, 'NGN', walletCurrency);
  const shipmentBonusAmount = await convertCurrency(shipmentBonusBase, 'USD', walletCurrency);

  const referred = await query(
    `
      SELECT
        p.id,
        p.first_name,
        p.last_name,
        p.email,
        p.created_at,
        EXISTS (
          SELECT 1 FROM public.referral_rewards rr
          WHERE rr.referrer_id = $1 AND rr.referred_id = p.id AND rr.trigger = 'welcome'
        ) AS signup_completed,
        EXISTS (
          SELECT 1 FROM public.referral_rewards rr
          WHERE rr.referrer_id = $1 AND rr.referred_id = p.id AND rr.trigger = 'shipment_over_threshold'
        ) AS shipment_completed,
        COALESCE((
          SELECT SUM(rr.referrer_amount)
          FROM public.referral_rewards rr
          WHERE rr.referrer_id = $1 AND rr.referred_id = p.id
        ), 0) AS referrer_earned
      FROM public.profiles p
      WHERE p.referred_by = $1
      ORDER BY created_at DESC
      LIMIT 50
    `,
    [userId],
  );

  const rewards = await query(
    `
      SELECT *
      FROM public.referral_rewards
      WHERE referrer_id = $1 OR referred_id = $1
      ORDER BY created_at DESC
      LIMIT 100
    `,
    [userId],
  );

  return {
    code,
    settings: {
      referralEnabled: settings.referralEnabled !== false,
      walletCurrency,
      referralWelcomeBonusNgn: welcomeBonusBase,
      referralWelcomeBonusAmount: welcomeBonusAmount,
      referralWelcomeBonusCurrency: walletCurrency,
      referralShipmentThresholdUsd: Number(settings.referralShipmentThresholdUsd ?? 50),
      referralShipmentBonusUsd: shipmentBonusBase,
      referralShipmentBonusAmount: shipmentBonusAmount,
      referralShipmentBonusCurrency: walletCurrency,
    },
    referredUsers: referred.rows,
    rewards: rewards.rows,
  };
}

export async function applyReferralSignupReward(referredId) {
  const settings = await getAppSettings();
  if (settings.referralEnabled === false) return null;

  const referred = await queryOne(
    `SELECT id, referred_by FROM public.profiles WHERE id = $1`,
    [referredId],
  );
  if (!referred?.referred_by) return null;

  return rewardPair({
    referrerId: referred.referred_by,
    referredId,
    trigger: WELCOME_TRIGGER,
    amountBase: Number(settings.referralWelcomeBonusNgn ?? 2000),
    baseCurrency: 'NGN',
    title: 'Referral welcome bonus',
  });
}

export async function applyReferralShipmentReward({ senderId, requestId, amount, currency }) {
  const settings = await getAppSettings();
  if (settings.referralEnabled === false) return null;

  const referred = await queryOne(
    `SELECT id, referred_by FROM public.profiles WHERE id = $1`,
    [senderId],
  );
  if (!referred?.referred_by) return null;

  const amountUsd = await convertCurrency(Number(amount || 0), currency || 'USD', 'USD');
  const thresholdUsd = Number(settings.referralShipmentThresholdUsd ?? 50);
  if (amountUsd < thresholdUsd) return null;

  return rewardPair({
    referrerId: referred.referred_by,
    referredId: senderId,
    trigger: SHIPMENT_TRIGGER,
    requestId,
    amountBase: Number(settings.referralShipmentBonusUsd ?? 2),
    baseCurrency: 'USD',
    title: 'Referral shipment bonus',
  });
}

export async function resolveReferralCode(referralCode) {
  const code = normalizeReferralCode(referralCode);
  if (!code) return null;
  return queryOne(
    `SELECT id FROM public.profiles WHERE upper(referral_code) = upper($1) LIMIT 1`,
    [code],
  );
}
