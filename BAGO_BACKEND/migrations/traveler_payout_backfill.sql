-- Backfill traveler payout from the traveler's posted price.
-- shipment_requests.amount can include Bago fees, so it must not be used as
-- the traveler's earning when traveler_payout is missing.
ALTER TABLE public.shipment_requests
  ADD COLUMN IF NOT EXISTS traveler_payout NUMERIC,
  ADD COLUMN IF NOT EXISTS sender_shipping_fee NUMERIC;

UPDATE public.shipment_requests sr
SET traveler_payout = ROUND((COALESCE(pkg.package_weight, 0) * COALESCE(t.price_per_kg, 0))::numeric, 2),
    sender_shipping_fee = COALESCE(NULLIF(sr.sender_shipping_fee, 0), sr.amount),
    updated_at = timezone('utc', now())
FROM public.packages pkg, public.trips t
WHERE pkg.id = sr.package_id
  AND t.id = sr.trip_id
  AND COALESCE(sr.traveler_payout, 0) <= 0
  AND COALESCE(pkg.package_weight, 0) > 0
  AND COALESCE(t.price_per_kg, 0) > 0;
