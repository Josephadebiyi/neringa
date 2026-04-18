import fs from 'node:fs';
import http2 from 'node:http2';
import crypto from 'node:crypto';
import { query as pgQuery, queryOne } from '../lib/postgres/db.js';

const normalizeToken = (token) => (typeof token === 'string' ? token.trim() : '');

const isApnsPushToken = (token) => /^[0-9a-fA-F]{64}$/.test(normalizeToken(token));

const getApnsPrivateKey = () => {
  const inlineKey = process.env.APNS_PRIVATE_KEY?.trim();
  if (inlineKey) {
    return inlineKey.includes('-----BEGIN') ? inlineKey : inlineKey.replace(/\\n/g, '\n');
  }
  const keyPath = process.env.APNS_PRIVATE_KEY_PATH?.trim();
  if (keyPath) return fs.readFileSync(keyPath, 'utf8');
  return null;
};

const getApnsHost = () =>
  process.env.APNS_USE_SANDBOX === 'true'
    ? 'https://api.sandbox.push.apple.com'
    : 'https://api.push.apple.com';

const base64UrlEncode = (value) =>
  Buffer.from(value).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

const buildApnsJwt = () => {
  const teamId = process.env.APNS_TEAM_ID?.trim();
  const keyId = process.env.APNS_KEY_ID?.trim();
  const privateKey = getApnsPrivateKey();

  if (!teamId || !keyId || !privateKey) throw new Error('APNs credentials not configured');

  const header = { alg: 'ES256', kid: keyId };
  const payload = { iss: teamId, iat: Math.floor(Date.now() / 1000) };
  const unsigned = `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(JSON.stringify(payload))}`;
  const signature = crypto.sign('sha256', Buffer.from(unsigned), privateKey);
  return `${unsigned}.${base64UrlEncode(signature)}`;
};

const sendApnsPushToToken = async (pushToken, title, body, data = {}) => {
  const token = normalizeToken(pushToken);
  if (!isApnsPushToken(token)) {
    return { ok: false, provider: 'apns', skipped: true, reason: 'invalid_token' };
  }

  const bundleId = process.env.APNS_BUNDLE_ID;
  if (!bundleId) return { ok: false, provider: 'apns', skipped: true, reason: 'no_bundle_id' };

  try {
    const jwt = buildApnsJwt();
    const host = getApnsHost();
    const payload = JSON.stringify({
      aps: { alert: { title, body }, sound: 'default', badge: 1 },
      ...data,
    });

    const client = http2.connect(host);

    return await new Promise((resolve, reject) => {
      const req = client.request({
        ':method': 'POST',
        ':path': `/3/device/${token}`,
        'authorization': `bearer ${jwt}`,
        'apns-topic': bundleId,
        'apns-push-type': 'alert',
        'content-type': 'application/json',
        'content-length': Buffer.byteLength(payload),
      });

      req.setEncoding('utf8');
      let responseData = '';
      let statusCode;

      req.on('response', (headers) => { statusCode = headers[':status']; });
      req.on('data', (chunk) => { responseData += chunk; });
      req.on('end', () => {
        client.close();
        if (statusCode === 200) {
          resolve({ ok: true, provider: 'apns' });
        } else {
          console.error(`❌ APNs error ${statusCode}: ${responseData}`);
          resolve({ ok: false, provider: 'apns', status: statusCode, response: responseData });
        }
      });
      req.on('error', (err) => { client.close(); reject(err); });
      req.write(payload);
      req.end();
    });
  } catch (err) {
    return { ok: false, provider: 'apns', error: err.message };
  }
};

export const sendPushNotificationToToken = async (pushToken, title, body, data = {}) => {
  const token = normalizeToken(pushToken);
  if (!isApnsPushToken(token)) {
    return { ok: false, skipped: true, reason: 'unrecognized_token_format', token: token.substring(0, 20) };
  }
  return sendApnsPushToToken(token, title, body, data);
};

export const sendPushNotification = async (userId, title, body, data = {}) => {
  try {
    const row = await queryOne(
      `SELECT push_tokens FROM public.profiles WHERE id = $1`,
      [userId]
    );

    // Store in-app notification
    try {
      await pgQuery(
        `INSERT INTO public.notifications (user_id, title, body, type, read, created_at) VALUES ($1, $2, $3, 'general', false, NOW())`,
        [userId, title, body]
      );
    } catch {
      try {
        await pgQuery(
          `INSERT INTO public.notifications (user_id, title, message, type, read, created_at) VALUES ($1, $2, $3, 'general', false, NOW())`,
          [userId, title, `${title}: ${body}`]
        );
      } catch (_) {}
    }

    if (!row?.push_tokens?.length) {
      console.log(`No push tokens found for user ${userId}`);
      return [];
    }

    const uniqueTokens = [...new Set(row.push_tokens.map(normalizeToken).filter(Boolean))];
    const results = [];

    for (const pushToken of uniqueTokens) {
      try {
        const result = await sendPushNotificationToToken(pushToken, title, body, data);
        results.push(result);
        if (result.ok) console.log(`✅ APNs push sent to user ${userId}`);
        else if (result.skipped) console.log(`⏭ Push skipped: ${result.reason}`);
      } catch (error) {
        results.push({ ok: false, error: error.message });
      }
    }

    return results;
  } catch (error) {
    console.error('sendPushNotification error:', error);
    throw error;
  }
};
