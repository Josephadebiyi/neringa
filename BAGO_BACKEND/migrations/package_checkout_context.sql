-- Checkout details remembered when a payment starts, so an unpaid draft can
-- resume checkout ("Continue Payment") with the same trip and traveller.
alter table public.packages
  add column if not exists checkout_context jsonb;
