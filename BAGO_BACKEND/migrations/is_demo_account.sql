-- Marks an account as a permanent demo/showcase account. Demo accounts can
-- have real-looking trips, wallet balances, and shipment/chat history for
-- onboarding walkthroughs, but must never be bookable by a real sender,
-- never withdrawable, and never counted in admin revenue/analytics totals.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_demo_account BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS profiles_is_demo_account_idx
  ON public.profiles (is_demo_account)
  WHERE is_demo_account = TRUE;
