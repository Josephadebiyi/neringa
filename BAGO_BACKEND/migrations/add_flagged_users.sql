-- Flagging + device fingerprint infrastructure

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS device_fingerprint  TEXT,
  ADD COLUMN IF NOT EXISTS is_flagged          BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS flag_reason         TEXT,
  ADD COLUMN IF NOT EXISTS flag_source         TEXT,
  ADD COLUMN IF NOT EXISTS flagged_at          TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_profiles_is_flagged ON public.profiles (is_flagged) WHERE is_flagged = TRUE;
CREATE INDEX IF NOT EXISTS idx_profiles_device_fp  ON public.profiles (device_fingerprint) WHERE device_fingerprint IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.banned_device_fingerprints (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  fingerprint     TEXT        NOT NULL UNIQUE,
  banned_user_id  UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  reason          TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_banned_device_fp ON public.banned_device_fingerprints (fingerprint);
