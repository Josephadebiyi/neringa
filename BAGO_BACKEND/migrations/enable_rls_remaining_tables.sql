-- Extends enable_rls_all_tables.sql to cover tables added since that
-- migration (Apr 23) plus tables created at runtime by ensureXTable()
-- helpers in the app code (e.g. refundController.ensureRefundsTable,
-- PremblyController.ensurePremblySessionTable). None of these ever had RLS
-- enabled, which — same as before RLS was added to the original table list —
-- means the anon/authenticated Supabase client roles have full PostgREST
-- read/write access to them if that API surface is exposed at all, with no
-- gate at the database layer. The Node backend is unaffected: it connects
-- via SUPABASE_DB_URL (direct postgres connection) and/or the service_role
-- key, both of which bypass RLS entirely.
--
-- Wrapped in a per-table existence check (via to_regclass) because several
-- of these tables are created lazily at runtime by the app rather than by a
-- migration, so they may not exist yet in every environment this runs against.
--
-- No policies are added, intentionally — same deny-all posture as
-- enable_rls_all_tables.sql. Only service_role / the direct postgres
-- connection can access these tables; anon/authenticated get nothing.

DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'banned_device_fingerprints',
    'banned_ips',
    'banned_names',
    'currency_conversion_audit_logs',
    'exchange_rate_logs',
    'exchange_rates',
    'insurance_settings',
    'item_categories',
    'operational_records',
    'payments',
    'payout_beneficiaries',
    'paystack_pending_withdrawals',
    'prembly_kyc_sessions',
    'prembly_webhook_events',
    'pricing_rules',
    'promotional_banners',
    'referral_rewards',
    'refunds',
    'routes',
    'security_events',
    'shipment_ledgers',
    'shipment_terms_acceptances',
    'signup_rate_limits',
    'support_saved_replies',
    'support_tickets',
    'user_refresh_tokens'
  ]
  LOOP
    IF to_regclass('public.' || tbl) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
    END IF;
  END LOOP;
END $$;
