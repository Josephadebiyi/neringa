-- Undo the earlier seed_demo_account.sql bug: if support@etktglobal.com
-- already existed as a REAL account before that script ran, it only set
-- is_demo_account = true on it (without ever touching its real password),
-- which would have silently excluded that real business's trips from
-- customer search, admin revenue totals, and blocked its withdrawals.
--
-- This script only clears that one flag on that one email — it does not
-- touch the password, business details, trips, or anything else. Safe to
-- run even if the flag was never actually set (no-op in that case).
--
-- Run once:
--   psql "$DATABASE_URL" -f scripts/revert_wrong_demo_flag.sql

UPDATE public.profiles
SET is_demo_account = false
WHERE email = 'support@etktglobal.com';
