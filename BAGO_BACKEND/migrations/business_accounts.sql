ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_type TEXT NOT NULL DEFAULT 'individual',
  ADD COLUMN IF NOT EXISTS company_name TEXT,
  ADD COLUMN IF NOT EXISTS trading_name TEXT,
  ADD COLUMN IF NOT EXISTS business_registration_number TEXT,
  ADD COLUMN IF NOT EXISTS business_type TEXT,
  ADD COLUMN IF NOT EXISTS business_address TEXT,
  ADD COLUMN IF NOT EXISTS business_tax_id TEXT,
  ADD COLUMN IF NOT EXISTS representative_role TEXT,
  ADD COLUMN IF NOT EXISTS business_document_url TEXT,
  ADD COLUMN IF NOT EXISTS business_document_status TEXT NOT NULL DEFAULT 'not_uploaded',
  ADD COLUMN IF NOT EXISTS business_status TEXT NOT NULL DEFAULT 'not_started';

CREATE INDEX IF NOT EXISTS profiles_account_type_idx ON public.profiles (account_type);
CREATE INDEX IF NOT EXISTS profiles_business_status_idx ON public.profiles (business_status) WHERE account_type = 'company';
CREATE UNIQUE INDEX IF NOT EXISTS profiles_business_registration_unique_idx
  ON public.profiles (lower(trim(business_registration_number)))
  WHERE account_type = 'company' AND nullif(trim(business_registration_number), '') IS NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_account_type_check') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_account_type_check
      CHECK (account_type IN ('individual', 'company'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_company_identity_check') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_company_identity_check
      CHECK (
        account_type <> 'company'
        OR (
          nullif(trim(company_name), '') IS NOT NULL
          AND nullif(trim(trading_name), '') IS NOT NULL
          AND nullif(trim(business_registration_number), '') IS NOT NULL
        )
      ) NOT VALID;
  END IF;
END $$;
