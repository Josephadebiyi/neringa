-- Add apple_sub column for Sign in with Apple user identification.
-- Apple only provides the email on the first sign-in; subsequent sign-ins
-- are identified only by the stable 'sub' (user identifier) in the JWT.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS apple_sub TEXT UNIQUE;

CREATE INDEX IF NOT EXISTS idx_profiles_apple_sub ON public.profiles (apple_sub)
  WHERE apple_sub IS NOT NULL;
