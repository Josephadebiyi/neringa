-- Add read_at column to messages table (idempotent)
-- This column tracks when a message was read; used by listConversationMessages and markConversationRead.
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS read_at timestamptz;

-- Index to speed up "unread messages" queries (WHERE read_at IS NULL)
CREATE INDEX IF NOT EXISTS idx_messages_read_at_null
  ON public.messages (conversation_id)
  WHERE read_at IS NULL;
