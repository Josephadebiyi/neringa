-- Enable Row Level Security on all backend tables.
-- The Node.js backend connects via SUPABASE_DB_URL (direct postgres connection),
-- which bypasses RLS entirely, so this has no effect on backend operation.
-- This closes off direct anon/authenticated Supabase client access to all tables.

ALTER TABLE public.profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipment_requests     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_accounts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_events        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_verifications     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_sessions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_codes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_reviews          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bago_config           ENABLE ROW LEVEL SECURITY;

-- No policies are added intentionally.
-- With RLS enabled and no policies, the anon and authenticated Supabase client
-- roles are denied all access. Only the service_role key (which bypasses RLS)
-- and the direct postgres connection (SUPABASE_DB_URL) can access these tables.
-- This is the correct posture for a server-side-only application.
