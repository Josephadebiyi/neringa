// Show (and optionally unlock) the chat for an order.
//
//   node scripts/unlockChatByOrder.js SVV2GVX93                 # show chat + flagged messages
//   node scripts/unlockChatByOrder.js SVV2GVX93 --apply         # unlock it
//   node scripts/unlockChatByOrder.js SVV2GVX93 --apply --note "Asked for phone number, warning only"
//
// Needs the same database env vars as the backend (SUPABASE_DB_URL etc.).
import dotenv from 'dotenv';

dotenv.config();

const { findConversationIdByOrderNumber, getChatModerationDetails, unlockChat } =
  await import('../lib/postgres/chatModeration.js');

const args = process.argv.slice(2);
const orderNumber = args.find((a) => !a.startsWith('--'));
const apply = args.includes('--apply');
const noteIndex = args.indexOf('--note');
const note = noteIndex >= 0 ? args[noteIndex + 1] : 'Unlocked by admin: user asked for contact details, warning is enough.';

if (!orderNumber) {
  console.error('Usage: node scripts/unlockChatByOrder.js <ORDER_NUMBER> [--apply] [--note "..."]');
  process.exit(1);
}

const conversationId = await findConversationIdByOrderNumber(orderNumber);
if (!conversationId) {
  console.error(`No chat found for order ${orderNumber}`);
  process.exit(1);
}

const { conversation, flags, messages } = await getChatModerationDetails(conversationId);
console.log(`Order ${conversation.orderNumber} · conversation ${conversation.id}`);
console.log(`Sender:   ${conversation.senderName} <${conversation.senderEmail}>`);
console.log(`Traveler: ${conversation.travelerName} <${conversation.travelerEmail}>`);
console.log(`Locked:   ${conversation.chatLocked} ${conversation.chatLockReason ? `(${conversation.chatLockReason})` : ''}`);
console.log('\nFlagged messages:');
for (const f of flags) {
  console.log(`  [${new Date(f.createdAt).toISOString()}] ${f.senderName} → ${f.enforcementAction}: "${f.messageContent}"  (${f.reason || f.reasonCode})`);
}
console.log('\nLast messages:');
for (const m of messages.slice(-15)) {
  const tag = m.metadata?.policyFlagged ? ' [FLAGGED]' : m.metadata?.system ? ' [system]' : '';
  console.log(`  [${new Date(m.createdAt).toISOString()}] ${m.metadata?.system ? 'Bago' : m.senderName}${tag}: ${m.content}`);
}

if (!apply) {
  console.log('\nDry run. Re-run with --apply to unlock.');
  process.exit(0);
}

const result = await unlockChat({ conversationId, note });
console.log(result.alreadyUnlocked ? '\nChat was already unlocked.' : '\n✅ Chat unlocked. Both users can message again.');
process.exit(0);
