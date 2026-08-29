-- Business staff sub-accounts: up to 5 staff logins per business, each with
-- its own email/password and a custom mix of permissions the business owner
-- controls. Modeled directly on the existing admin_users pattern (a flat
-- JSONB permissions array on the row, not a join table) — see
-- middleware/adminAuthorization.js for the equivalent admin-side gate this
-- mirrors.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.business_staff_accounts (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  email              TEXT NOT NULL,
  password_hash      TEXT NOT NULL,
  full_name          TEXT,
  -- Known permission strings: deliveries.manage, accounts.view,
  -- accounts.withdraw, chats.manage. "All" is simply every string present —
  -- no special storage case, same convention as admin_users.permissions.
  permissions        JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active          BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at      TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE UNIQUE INDEX IF NOT EXISTS business_staff_accounts_email_unique_idx
  ON public.business_staff_accounts (lower(trim(email)));

CREATE INDEX IF NOT EXISTS business_staff_accounts_business_idx
  ON public.business_staff_accounts (business_profile_id);
