// Grace-period restriction logic for business (company) accounts, however
// they signed up.
//
// Every company account is auto-approved and fully usable for
// GRACE_PERIOD_DAYS: admin-created accounts start the clock the moment the
// representative sets their real password (see
// controllers/userController.js#changePassword); self-signup accounts
// (created via the public /business wizard) start it immediately at signup,
// since they're usable right away (see
// lib/postgres/profiles.js#createProfileWithWallet). Either way, if the
// business isn't admin-approved by the deadline — regardless of how much of
// KYC/CAC it has already submitted — the account is restricted until an
// admin approves it via BusinessOnboardingController#approveBusinessAccount.
//
// Restriction state is always computed live from timestamps rather than
// trusted from a cached `business_status` value, so nothing depends on the
// reminder/restriction cron running exactly on schedule.

const GRACE_PERIOD_DAYS = 14;
const GRACE_PERIOD_MS = GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000;
export const BUSINESS_MIN_PAYOUT_NGN = 1_000_000;

export function getBusinessRestrictionState(profile) {
  const accountType = profile?.accountType || profile?.account_type;
  const businessStatus = profile?.businessStatus || profile?.business_status;
  const gracePeriodStartedAt = profile?.businessGracePeriodStartedAt || profile?.business_grace_period_started_at;

  const governed = accountType === 'company';
  if (!governed || businessStatus === 'verified' || !gracePeriodStartedAt) {
    return { governed, graceActive: false, restricted: false, deadline: null };
  }

  const deadline = new Date(new Date(gracePeriodStartedAt).getTime() + GRACE_PERIOD_MS);
  const restricted = Date.now() >= deadline.getTime();
  return { governed: true, graceActive: !restricted, restricted, deadline };
}

export { GRACE_PERIOD_DAYS };
