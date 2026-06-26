import { query } from '../lib/postgres/db.js';
import { getWalletByUserId } from '../lib/postgres/profiles.js';

const CREDIT_TRANSACTION_TYPES = new Set([
  'deposit',
  'escrow_release',
  'earning',
  'admin_settlement',
  'credit',
  'release',
  'signup_bonus',
  'referral_bonus',
]);

function getTransactionStatusLabel(status) {
  const normalized = String(status || 'pending').trim().toLowerCase();
  if (normalized === 'pending_admin_approval') return 'Pending review';
  if (normalized === 'processing') return 'Processing';
  if (normalized === 'completed') return 'Completed';
  if (normalized === 'processed') return 'Processed';
  if (normalized === 'paid') return 'Paid';
  if (normalized === 'failed') return 'Failed';
  if (normalized === 'rejected') return 'Rejected';
  if (normalized === 'cancelled' || normalized === 'canceled') return 'Cancelled';
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function toBalanceHistoryRow(transaction) {
  const rawType = String(transaction?.type || '').toLowerCase();
  const statusLabel = getTransactionStatusLabel(transaction?.status);
  const description = transaction?.description || rawType.replace(/_/g, ' ') || 'Wallet transaction';

  return {
    ...transaction,
    _id: transaction?.id,
    id: transaction?.id,
    type: CREDIT_TRANSACTION_TYPES.has(rawType) ? 'deposit' : rawType,
    amount: Number(transaction?.amount || 0),
    date: transaction?.created_at || transaction?.createdAt || transaction?.date,
    description: `${statusLabel} - ${description}`,
    status: transaction?.status || 'pending',
    statusLabel,
  };
}

export const Profile = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const userId = user.id;

    // Fetch user's trips from Postgres
    const tripsResult = await query(
      `SELECT
        t.id, t.id as "_id",
        t.user_id,
        t.from_location as "fromLocation",
        t.from_country as "fromCountry",
        t.to_location as "toLocation",
        t.to_country as "toCountry",
        t.collection_city as "collectionCity",
        t.collection_country as "collectionCountry",
        t.price_per_kg as "pricePerKg",
        t.currency,
        t.landmark,
        t.departure_date as "departureDate",
        t.arrival_date as "arrivalDate",
        t.available_kg as "availableKg",
        t.travel_means as "travelMeans",
        t.status,
        t.request_count as "request",
        t.travel_document_url as "travelDocument",
        t.travel_document_verified as "travelDocumentVerified",
        t.created_at as "createdAt",
        t.updated_at as "updatedAt"
       FROM public.trips t
       WHERE t.user_id = $1
       ORDER BY t.created_at DESC`,
      [userId]
    );

    const findTrips = tripsResult.rows.map(row => ({
      id: row.id,
      _id: row.id,
      userId: row.user_id,
      fromLocation: row.fromLocation,
      fromCountry: row.fromCountry,
      toLocation: row.toLocation,
      toCountry: row.toCountry,
      collectionCity: row.collectionCity,
      collectionCountry: row.collectionCountry,
      pricePerKg: parseFloat(row.pricePerKg) || 0,
      currency: row.currency,
      landmark: row.landmark,
      departureDate: row.departureDate,
      arrivalDate: row.arrivalDate,
      availableKg: parseFloat(row.availableKg) || 0,
      travelMeans: row.travelMeans,
      status: row.status,
      request: row.request || 0,
      travelDocument: row.travelDocument,
      travelDocumentVerified: row.travelDocumentVerified,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));

    const wallet = await getWalletByUserId(userId).catch((error) => {
      console.warn('Profile wallet history unavailable:', error.message);
      return null;
    });
    const walletHistory = wallet?.transactions || wallet?.history || [];
    const balanceHistory = walletHistory.map(toBalanceHistoryRow);
    const findUser = wallet
      ? {
          ...user,
          balance: wallet.balance,
          walletBalance: wallet.walletBalance ?? wallet.balance,
          wallet_balance: wallet.wallet_balance ?? wallet.balance,
          availableBalance: wallet.availableBalance ?? wallet.balance,
          available_balance: wallet.available_balance ?? wallet.balance,
          escrowBalance: wallet.escrowBalance,
          escrow_balance: wallet.escrow_balance ?? wallet.escrowBalance,
          walletCurrency: wallet.currency || user.walletCurrency,
          wallet_currency: wallet.currency || user.wallet_currency,
          currency: wallet.currency || user.currency,
          balanceHistory,
          transactions: balanceHistory,
          history: balanceHistory,
        }
      : user;

    return res.status(200).json({
      message: findTrips.length === 0
        ? 'User found but no trips yet'
        : 'Gotten user profile successfully',
      success: true,
      error: false,
      data: {
        findUser,
        findTrips,
      },
    });
  } catch (error) {
    return next(error);
  }
};
