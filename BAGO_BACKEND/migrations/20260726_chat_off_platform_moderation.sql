alter table public.conversations
  add column if not exists chat_locked boolean not null default false,
  add column if not exists chat_locked_at timestamptz,
  add column if not exists chat_lock_reason text,
  add column if not exists chat_locked_by text,
  add column if not exists chat_policy_unlocked_at timestamptz,
  add column if not exists chat_policy_unlocked_by uuid,
  add column if not exists chat_policy_unlock_note text,
  add column if not exists policy_warning_count integer not null default 0;

create table if not exists public.chat_policy_flags (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  request_id uuid references public.shipment_requests(id) on delete set null,
  message_id uuid references public.messages(id) on delete set null,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  message_content text not null,
  reason_code text not null,
  reason text,
  confidence numeric,
  classifier_provider text,
  classifier_model text,
  enforcement_action text not null check (enforcement_action in ('warning', 'chat_locked')),
  reviewed_at timestamptz,
  reviewed_by uuid,
  review_notes text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists chat_policy_flags_review_idx
  on public.chat_policy_flags (reviewed_at, created_at desc);
create index if not exists chat_policy_flags_conversation_idx
  on public.chat_policy_flags (conversation_id, created_at);
