import crypto from 'crypto';

function timingSafeEqualText(a = '', b = '') {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

export const requireVerifiedContact = (req, res, next) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({
      success: false,
      code: 'NOT_AUTHENTICATED',
      message: 'User not authenticated.',
    });
  }

  const emailVerified = user.emailVerified === true || user.email_verified === true;
  const phoneVerified = user.phoneVerified === true || user.phone_verified === true;
  if (!emailVerified || !phoneVerified) {
    return res.status(403).json({
      success: false,
      code: 'CONTACT_VERIFICATION_REQUIRED',
      message: 'Please verify your email and phone number before using wallet or payout features.',
      emailVerified,
      phoneVerified,
    });
  }

  return next();
};

export const requireInternalWalletMutation = (req, res, next) => {
  const expected = process.env.INTERNAL_WALLET_MUTATION_SECRET;
  const provided = req.headers['x-internal-wallet-secret'];

  if (expected && provided && timingSafeEqualText(provided, expected)) {
    return next();
  }

  return res.status(403).json({
    success: false,
    code: 'DIRECT_WALLET_MUTATION_BLOCKED',
    message: 'Wallet and escrow balances can only be changed by verified payment, shipment, or ledger workflows.',
  });
};
