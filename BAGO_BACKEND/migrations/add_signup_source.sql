ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS signup_source TEXT DEFAULT 'app';
