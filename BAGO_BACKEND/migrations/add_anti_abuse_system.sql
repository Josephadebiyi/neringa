-- Anti-abuse and duplicate-account protection system
-- Adds risk scoring, security events, rate limiting, and account status gating

-- ── profiles additions ────────────────────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS google_sub           TEXT,
  ADD COLUMN IF NOT EXISTS account_status       TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS risk_score           INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS risk_signals         JSONB,
  ADD COLUMN IF NOT EXISTS kyc_attempt_count    INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_kyc_attempt_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS legal_name_submitted TEXT,
  ADD COLUMN IF NOT EXISTS legal_name_verified  BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS user_agent           TEXT,
  ADD COLUMN IF NOT EXISTS signup_country       TEXT,
  ADD COLUMN IF NOT EXISTS signup_city          TEXT;

-- account_status values:
--   active                  normal user (default)
--   pending_name            must submit legal name before KYC
--   pending_security_review under manual review, cannot start KYC
--   kyc_allowed             admin explicitly cleared for KYC
--   banned                  permanently banned
--   rejected                KYC permanently rejected by admin

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_google_sub
  ON public.profiles (google_sub) WHERE google_sub IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_account_status
  ON public.profiles (account_status) WHERE account_status != 'active';

CREATE INDEX IF NOT EXISTS idx_profiles_risk_score
  ON public.profiles (risk_score DESC) WHERE risk_score > 0;

-- ── Security events (immutable audit trail for every gate decision) ────────────
CREATE TABLE IF NOT EXISTS public.security_events (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  event_type   TEXT        NOT NULL,
  action       TEXT        NOT NULL,   -- allow | block | review | flag
  risk_score   INTEGER,
  risk_signals JSONB,
  reason_code  TEXT,
  ip_address   TEXT,
  device_fp    TEXT,
  user_agent   TEXT,
  metadata     JSONB,
  admin_id     UUID,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sec_events_user    ON public.security_events (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sec_events_type    ON public.security_events (event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sec_events_ip      ON public.security_events (ip_address) WHERE ip_address IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sec_events_device  ON public.security_events (device_fp) WHERE device_fp IS NOT NULL;

-- ── Signup rate-limit counters (one row per IP per day) ───────────────────────
CREATE TABLE IF NOT EXISTS public.signup_rate_limits (
  ip_address    TEXT NOT NULL,
  attempt_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  attempt_count INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (ip_address, attempt_date)
);
