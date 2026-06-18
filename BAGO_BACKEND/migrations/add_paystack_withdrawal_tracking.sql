-- Track Paystack withdrawals so webhook handlers can restore balance on async failure.
-- profiles.available_balance users (African currencies) don't have wallet_accounts records,
-- so they can't use wallet_transactions. This table fills that gap.
CREATE TABLE IF NOT EXISTS public.paystack_pending_withdrawals (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     text        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reference   text        NOT NULL UNIQUE,
    amount      numeric     NOT NULL,
    currency    text        NOT NULL DEFAULT 'NGN',
    status      text        NOT NULL DEFAULT 'pending',
    created_at  timestamptz NOT NULL DEFAULT NOW(),
    updated_at  timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ppw_reference ON public.paystack_pending_withdrawals (reference);
CREATE INDEX IF NOT EXISTS idx_ppw_user_id   ON public.paystack_pending_withdrawals (user_id);
