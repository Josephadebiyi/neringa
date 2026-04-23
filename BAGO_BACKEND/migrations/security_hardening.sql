-- Security hardening: login lockout + refresh token tracking

-- Login failure tracking (brute-force lockout)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS failed_login_attempts INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ;

-- Refresh token registry (session management + revoke-all)
CREATE TABLE IF NOT EXISTS public.user_refresh_tokens (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token_hash    TEXT NOT NULL UNIQUE,
  device_hint   TEXT,
  expires_at    TIMESTAMPTZ NOT NULL,
  revoked_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_urt_user_id  ON public.user_refresh_tokens (user_id);
CREATE INDEX IF NOT EXISTS idx_urt_hash     ON public.user_refresh_tokens (token_hash);
CREATE INDEX IF NOT EXISTS idx_urt_expires  ON public.user_refresh_tokens (expires_at);
