import express from 'express';
import { verifyChatActionToken } from '../services/chatModerationActions.js';
import {
  findActiveAdminIdByEmail,
  getChatModerationDetails,
  keepChatLocked,
  unlockChat,
} from '../lib/postgres/chatModeration.js';
import { createAuditLog } from '../lib/postgres/audit.js';

// One-click review links sent to admins when a chat is locked.
// GET only shows a confirmation page (email scanners prefetch links);
// the change happens on POST from that page.
const router = express.Router();

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function page(title, body) {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex"><title>${esc(title)}</title>
<style>
body{font-family:Arial,sans-serif;background:#f3f4f6;color:#111827;margin:0;padding:16px}
.card{max-width:640px;margin:24px auto;background:#fff;border-radius:12px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,.08)}
h1{font-size:20px;margin:0 0 12px}.muted{color:#6b7280;font-size:13px}
.msg{border:1px solid #e5e7eb;border-radius:8px;padding:10px 12px;margin:0 0 8px;font-size:14px;white-space:pre-wrap}
.msg.flag{border-color:#fca5a5;background:#fef2f2}.sys{background:#f9fafb;color:#6b7280}
textarea{width:100%;box-sizing:border-box;border:1px solid #d1d5db;border-radius:8px;padding:10px;font-size:14px;min-height:70px}
button{border:0;border-radius:8px;padding:12px 22px;font-size:15px;font-weight:700;color:#fff;cursor:pointer;margin-top:12px}
.unlock{background:#16a34a}.keep{background:#dc2626}
</style></head><body><div class="card">${body}</div></body></html>`;
}

function describe(action) {
  return action === 'unlock'
    ? { verb: 'Unlock this chat', button: 'Confirm unlock', cls: 'unlock' }
    : { verb: 'Keep this chat locked', button: 'Confirm keep locked', cls: 'keep' };
}

async function resolve(req, res) {
  const token = req.method === 'POST' ? req.body?.token : req.query.token;
  const data = verifyChatActionToken(token);
  if (!data) {
    res.status(400).send(page('Link expired', '<h1>This link is invalid or has expired</h1><p class="muted">Open the admin dashboard → Flagged Chats to review this chat.</p>'));
    return null;
  }
  const adminId = await findActiveAdminIdByEmail(data.adminEmail);
  if (!adminId) {
    res.status(403).send(page('Not allowed', '<h1>Your admin account is not active</h1>'));
    return null;
  }
  return { ...data, token, adminId };
}

router.get('/action', async (req, res, next) => {
  try {
    const ctx = await resolve(req, res);
    if (!ctx) return;
    const details = await getChatModerationDetails(ctx.conversationId);
    if (!details) return res.status(404).send(page('Not found', '<h1>Chat not found</h1>'));
    const { conversation: c, messages } = details;
    const { verb, button, cls } = describe(ctx.action);
    const status = c.chatLocked
      ? '<strong style="color:#b91c1c">Currently LOCKED</strong>'
      : '<strong style="color:#16a34a">Currently unlocked</strong>';
    const history = messages.map((m) => {
      const meta = m.metadata || {};
      const cls2 = meta.policyFlagged ? 'msg flag' : meta.system ? 'msg sys' : 'msg';
      const label = meta.policyFlagged ? ' · FLAGGED, not delivered' : meta.system ? ' · system notice' : '';
      return `<div class="${cls2}"><div class="muted">${esc(meta.system ? 'Bago' : m.senderName || 'User')} · ${esc(new Date(m.createdAt).toUTCString())}${label}</div>${esc(m.content)}</div>`;
    }).join('');
    return res.send(page(verb, `
      <h1>${esc(verb)}?</h1>
      <p>Order <strong>${esc(c.orderNumber || 'not linked')}</strong> · ${status}</p>
      <p class="muted">Sender: ${esc(c.senderName)} (${esc(c.senderEmail)})<br>Traveler: ${esc(c.travelerName)} (${esc(c.travelerEmail)})</p>
      <h2 style="font-size:15px;margin:18px 0 8px">Chat history (latest 50)</h2>
      ${history || '<p class="muted">No messages.</p>'}
      <form method="POST" action="action">
        <input type="hidden" name="token" value="${esc(ctx.token)}">
        <label class="muted" for="note">Note (optional, saved to the audit log)</label>
        <textarea id="note" name="note" maxlength="500"></textarea>
        <button class="${cls}" type="submit">${esc(button)}</button>
      </form>`));
  } catch (error) {
    return next(error);
  }
});

router.post('/action', express.urlencoded({ extended: false }), async (req, res, next) => {
  try {
    const ctx = await resolve(req, res);
    if (!ctx) return;
    const note = String(req.body?.note || '').trim().slice(0, 500);
    const result = ctx.action === 'unlock'
      ? await unlockChat({ conversationId: ctx.conversationId, adminId: ctx.adminId, note: note || `Unlocked from email by ${ctx.adminEmail}` })
      : await keepChatLocked({ conversationId: ctx.conversationId, adminId: ctx.adminId, note: note || `Kept locked from email by ${ctx.adminEmail}` });
    if (!result) return res.status(404).send(page('Not found', '<h1>Chat not found</h1>'));

    await createAuditLog({
      actorAdminId: ctx.adminId,
      action: ctx.action === 'unlock' ? 'admin.chat.unlock' : 'admin.chat.keep_locked',
      targetType: 'conversation',
      targetId: ctx.conversationId,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      metadata: { via: 'email_link', note },
    }).catch(() => {});

    if (ctx.action === 'unlock' && !result.alreadyUnlocked) {
      req.app.get('io')?.to(String(ctx.conversationId)).emit('chat_policy_action', {
        action: 'chat_unlocked',
        message: 'Bago Support has reviewed and unlocked this chat.',
      });
    }

    let message;
    if (ctx.action === 'unlock') {
      message = result.alreadyUnlocked ? 'This chat was already unlocked.' : 'Chat unlocked. Both users can message again and were notified in the chat.';
    } else {
      message = result.notLocked ? 'This chat is not locked any more (another admin may have unlocked it). Nothing was changed.' : 'Chat stays locked and the flags are marked as reviewed.';
    }
    return res.send(page('Done', `<h1>Done</h1><p>${esc(message)}</p>`));
  } catch (error) {
    return next(error);
  }
});

export default router;
