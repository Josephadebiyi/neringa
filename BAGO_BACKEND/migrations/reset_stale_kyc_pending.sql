-- Reset users whose kyc_status was set to 'pending' prematurely by the
-- old startDojahSession endpoint (before the fix that removed that write).
-- Safe to run because:
--   • Live keys are not yet active — no real approvals have gone through.
--   • Users who genuinely completed verification will have kyc_status = 'approved'
--     (set by markKycApproved via webhook) — those are untouched by this query.
--   • Going forward, kyc_status = 'pending' is only written by the webhook when
--     Dojah actually fires a pending/submitted/review event.
UPDATE public.profiles
SET kyc_status = NULL, updated_at = NOW()
WHERE kyc_status = 'pending'
  AND kyc_verified_at IS NULL;
