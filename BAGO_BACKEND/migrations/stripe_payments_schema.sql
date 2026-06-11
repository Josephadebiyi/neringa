create table if not exists public.payments (
  id uuid primary key default gen_random_uuid()
);

alter table public.payments
  add column if not exists id uuid default gen_random_uuid(),
  add column if not exists user_id uuid references public.profiles(id) on delete cascade,
  add column if not exists shipment_id uuid references public.shipment_requests(id) on delete set null,
  add column if not exists package_id uuid references public.packages(id) on delete set null,
  add column if not exists trip_id uuid references public.trips(id) on delete set null,
  add column if not exists provider text not null default 'stripe',
  add column if not exists payment_method text,
  add column if not exists stripe_payment_intent_id text,
  add column if not exists stripe_charge_id text,
  add column if not exists amount numeric(14,2) not null default 0,
  add column if not exists currency text not null default 'USD',
  add column if not exists commission_amount numeric(14,2) not null default 0,
  add column if not exists traveler_amount numeric(14,2) not null default 0,
  add column if not exists status text not null default 'pending',
  add column if not exists raw_response jsonb not null default '{}'::jsonb,
  add column if not exists created_at timestamptz not null default timezone('utc', now()),
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

create unique index if not exists payments_stripe_payment_intent_id_key
  on public.payments (stripe_payment_intent_id);

create index if not exists payments_user_status_idx
  on public.payments (user_id, status);
