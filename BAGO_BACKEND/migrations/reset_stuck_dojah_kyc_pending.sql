-- Reset KYC profiles that were marked pending by starting/syncing Dojah but
-- never received a real Dojah pending/approved/declined result.
--
-- This lets stuck users start KYC again without touching users that Dojah has
-- genuinely submitted for review, approved, declined, or duplicate-blocked.

WITH stale_pending AS (
  SELECT id
  FROM public.profiles
  WHERE kyc_status = 'pending'
    AND COALESCE(kyc_provider, '') = 'dojah'
    AND kyc_verified_at IS NULL
    AND lower(COALESCE(
      kyc_verified_data->>'status',
      kyc_verified_data->>'verificationStatus',
      kyc_verified_data->>'verification_status',
      kyc_verified_data->>'decision',
      kyc_verified_data->>'result',
      kyc_verified_data#>>'{data,status}',
      kyc_verified_data#>>'{data,verificationStatus}',
      kyc_verified_data#>>'{data,verification_status}',
      kyc_verified_data#>>'{data,decision}',
      kyc_verified_data#>>'{data,result}',
      kyc_verified_data#>>'{data,entity,status}',
      kyc_verified_data#>>'{data,entity,verification_status}',
      kyc_verified_data#>>'{data,entity,verificationStatus}',
      ''
    )) NOT IN (
      'pending',
      'submitted',
      'processing',
      'in_progress',
      'review',
      'manual_review',
      'under_review',
      'success',
      'successful',
      'approved',
      'verified',
      'completed',
      'complete',
      'passed',
      'pass',
      'accepted',
      'failed',
      'failure',
      'declined',
      'rejected',
      'reject',
      'denied',
      'unsuccessful'
    )
)
UPDATE public.profiles p
SET kyc_status = 'not_started',
    kyc_failure_reason = NULL,
    updated_at = NOW()
FROM stale_pending s
WHERE p.id = s.id;
