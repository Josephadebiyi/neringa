-- Banned names and IP infrastructure
-- Allows auto-banning users who share a name or IP with a previously banned account

-- Banned full names (normalized for case-insensitive matching)
CREATE TABLE IF NOT EXISTS public.banned_names (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name       TEXT        NOT NULL,
  normalized      TEXT        NOT NULL UNIQUE,   -- lower-cased, collapsed whitespace
  banned_user_id  UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  reason          TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_banned_names_normalized ON public.banned_names (normalized);

-- Banned IP addresses (signup or login IPs of banned users)
CREATE TABLE IF NOT EXISTS public.banned_ips (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address      TEXT        NOT NULL UNIQUE,
  banned_user_id  UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  reason          TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_banned_ips_ip ON public.banned_ips (ip_address);

-- Track IPs on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS signup_ip     TEXT,
  ADD COLUMN IF NOT EXISTS last_login_ip TEXT;

CREATE INDEX IF NOT EXISTS idx_profiles_signup_ip     ON public.profiles (signup_ip)     WHERE signup_ip IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_last_login_ip ON public.profiles (last_login_ip) WHERE last_login_ip IS NOT NULL;

-- Seed: immediately ban AANUOLUWAPO ADIGUN by name
INSERT INTO public.banned_names (full_name, normalized, reason)
VALUES ('AANUOLUWAPO ADIGUN', 'aanuoluwapo adigun', 'Multiple accounts — permanently banned by admin')
ON CONFLICT (normalized) DO NOTHING;
