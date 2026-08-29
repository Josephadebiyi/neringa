-- Fast Payout: admin-only feature flag on business accounts, independent of
-- KYC status. KYC verification alone must never enable this.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS fast_payout_enabled BOOLEAN NOT NULL DEFAULT FALSE;

-- Guard flag so a shipment's escrow is only ever released to available_balance
-- once. Fast Payout can release before the shipment reaches its normal
-- completion state; the normal release paths (sender confirmation, handover
-- PIN, escrowCron) must check this before crediting available_balance again.
ALTER TABLE public.shipment_requests
  ADD COLUMN IF NOT EXISTS fast_payout_released_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS profiles_fast_payout_enabled_idx
  ON public.profiles (fast_payout_enabled)
  WHERE fast_payout_enabled = TRUE;
