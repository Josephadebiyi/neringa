-- Admin-created business accounts should only need a company name, trading
-- name, and email to get started — registration number, address, tax ID,
-- and representative details are things the business fills in themselves
-- afterward, and admin shouldn't be blocked from creating the account
-- without them. Drop the registration-number requirement from the identity
-- check (company_name/trading_name still required for a company row).
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_company_identity_check;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_company_identity_check') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_company_identity_check
      CHECK (
        account_type <> 'company'
        OR (
          nullif(trim(company_name), '') IS NOT NULL
          AND nullif(trim(trading_name), '') IS NOT NULL
        )
      ) NOT VALID;
  END IF;
END $$;
