-- Clear stale micro-escrow amounts (< 10 in any currency) that have no
-- matching active shipment request.  These are test/rounding artifacts.
UPDATE public.wallet_accounts
SET escrow_balance = 0,
    updated_at     = NOW()
WHERE escrow_balance > 0
  AND escrow_balance < 10
  AND NOT EXISTS (
    SELECT 1
    FROM public.shipment_requests sr
    WHERE (sr.sender_id = wallet_accounts.user_id OR sr.traveler_id = wallet_accounts.user_id)
      AND sr.status IN ('pending', 'accepted', 'intransit', 'delivering')
  );
