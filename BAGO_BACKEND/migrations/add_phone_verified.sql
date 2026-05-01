ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE public.profiles
SET phone_verified = TRUE
WHERE phone IS NOT NULL
  AND btrim(phone) <> ''
  AND phone_verified = FALSE;
