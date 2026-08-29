// Derives which business-account features are active for display/enforcement.
//
// Core permission rule: KYC verification unlocks every standard business
// feature automatically. Fast Payout is the one exception — it is a
// separate, admin-only toggle that KYC approval must never flip on.
const KYC_APPROVED_STATUSES = new Set(['approved', 'verified', 'completed']);

export function getBusinessFeatureSummary(profile) {
  const kycStatus = profile?.kycStatus ?? profile?.kyc_status ?? null;
  const kycVerified = KYC_APPROVED_STATUSES.has(kycStatus);
  const fastPayoutEnabled = Boolean(profile?.fastPayoutEnabled ?? profile?.fast_payout_enabled ?? false);

  return {
    kycStatus,
    kycVerified,
    // Standard business features: all tied 1:1 to KYC, nothing else gates them.
    trips: kycVerified,
    pricing: kycVerified,
    routes: kycVerified,
    recurringTrips: kycVerified,
    bookings: kycVerified,
    startDelivery: kycVerified,
    shipmentUpdates: kycVerified,
    externalTracking: kycVerified,
    withdrawals: kycVerified,
    analytics: kycVerified,
    // Manual-only, independent of KYC.
    fastPayoutEnabled,
  };
}
