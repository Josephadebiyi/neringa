import crypto from 'crypto';
import { listActiveAdminEmails } from '../lib/postgres/trips.js';
import { getChatModerationDetails } from '../lib/postgres/chatModeration.js';
import { sendChatLockedAdminNotification } from './emailNotifications.js';

export const CHAT_ACTIONS = ['unlock', 'keep_locked'];
const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function getSecret() {
  const secret = process.env.CHAT_MODERATION_ACTION_SECRET || process.env.JWT_SECRET;
  if (!secret) throw new Error('CHAT_MODERATION_ACTION_SECRET or JWT_SECRET must be set');
  return secret;
}

function sign(payload) {
  return crypto.createHmac('sha256', getSecret()).update(payload).digest('base64url');
}

/** A signed, expiring link token tied to one conversation, one admin and one action. */
export function createChatActionToken({ conversationId, adminEmail, action, now = Date.now() }) {
  if (!CHAT_ACTIONS.includes(action)) throw new Error(`Unknown chat action: ${action}`);
  const payload = Buffer.from(JSON.stringify({
    c: conversationId,
    e: adminEmail,
    a: action,
    x: now + TOKEN_TTL_MS,
  })).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

export function verifyChatActionToken(token, now = Date.now()) {
  const [payload, signature] = String(token || '').split('.');
  if (!payload || !signature) return null;
  const expected = sign(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!data?.c || !data?.e || !CHAT_ACTIONS.includes(data.a)) return null;
    if (!Number.isFinite(data.x) || data.x < now) return null;
    return { conversationId: data.c, adminEmail: data.e, action: data.a, expiresAt: data.x };
  } catch {
    return null;
  }
}

function apiBaseUrl() {
  return (process.env.API_PUBLIC_URL || process.env.BACKEND_URL || process.env.RENDER_EXTERNAL_URL || 'https://neringa.onrender.com').replace(/\/$/, '');
}

export function buildChatActionUrl(token) {
  return `${apiBaseUrl()}/api/chat-moderation/action?token=${encodeURIComponent(token)}`;
}

/**
 * Email every active admin when a chat gets locked, with the flagged messages
 * and one-click Unlock / Keep locked buttons. Never throws.
 */
export async function notifyAdminsOfChatLock(conversationId) {
  try {
    const details = await getChatModerationDetails(conversationId);
    if (!details) return;
    const adminEmails = await listActiveAdminEmails().catch(() => []);
    if (!adminEmails.length) {
      console.warn(`[chat-moderation] chat ${conversationId} locked but no active admin emails to notify`);
      return;
    }
    const { conversation, flags } = details;
    const sinceUnlock = conversation.unlockedAt ? new Date(conversation.unlockedAt).getTime() : 0;
    const recentFlags = flags.filter((f) => new Date(f.createdAt).getTime() > sinceUnlock);
    const adminUrl = process.env.ADMIN_URL || `${process.env.FRONTEND_URL || 'https://sendwithbago.com'}/admin`;

    await Promise.all(adminEmails.map((adminEmail) => sendChatLockedAdminNotification(adminEmail, {
      orderNumber: conversation.orderNumber,
      senderName: conversation.senderName,
      senderEmail: conversation.senderEmail,
      travelerName: conversation.travelerName,
      travelerEmail: conversation.travelerEmail,
      flaggedMessages: recentFlags.map((f) => ({
        senderName: f.senderName,
        content: f.messageContent,
        reason: f.reason || f.reasonCode,
        action: f.enforcementAction,
        createdAt: f.createdAt,
      })),
      unlockUrl: buildChatActionUrl(createChatActionToken({ conversationId, adminEmail, action: 'unlock' })),
      keepLockedUrl: buildChatActionUrl(createChatActionToken({ conversationId, adminEmail, action: 'keep_locked' })),
      reviewUrl: `${adminUrl}/flagged-chats`,
    }).catch((e) => console.error('[chat-moderation] admin email failed:', e.message))));
  } catch (error) {
    console.error('[chat-moderation] notifyAdminsOfChatLock failed:', error.message);
  }
}
