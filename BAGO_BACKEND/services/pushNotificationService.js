import fs from 'node:fs';
import http2 from 'node:http2';
import crypto from 'node:crypto';
import { query as pgQuery, queryOne } from '../lib/postgres/db.js';

// ─── Token type detection ─────────────────────────────────────────────────────

const normalizeToken = (token) => (typeof token === 'string' ? token.trim() : '');

// APNs tokens are exactly 64 hex chars. FCM tokens are much longer (~140+ chars).
const isApnsToken = (token) => /^[0-9a-fA-F]{64}$/.test(normalizeToken(token));
const isFcmToken  = (token) => {
  const t = normalizeToken(token);
  return t.length > 100 && !isApnsToken(t);
};

const APNS_PERMANENT_TOKEN_REASONS = new Set([
  'BadDeviceToken',
  'DeviceTokenNotForTopic',
  'Unregistered',
]);

const FCM_PERMANENT_TOKEN_CODES = new Set([
  'messaging/invalid-registration-token',
  'messaging/registration-token-not-registered',
  'messaging/invalid-argument',
]);

const parseJsonSafely = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const removePushTokenForUser = async (userId, token, provider, reason) => {
  if (!userId || !token) return;
  await pgQuery(
    `
      update public.profiles
      set push_tokens = array_remove(coalesce(push_tokens, '{}'), $2),
          updated_at = timezone('utc', now())
      where id = $1
    `,
    [userId, token],
  ).catch((error) => {
    console.warn(`Push token cleanup failed for user ${userId}: ${error.message}`);
  });
  console.warn(`Removed invalid ${provider} push token for user ${userId}: ${reason}`);
};

// ─── APNs (iOS) ───────────────────────────────────────────────────────────────

const getApnsPrivateKey = () => {
  const inlineKey = process.env.APNS_PRIVATE_KEY?.trim();
  if (inlineKey) {
    return inlineKey.includes('-----BEGIN') ? inlineKey : inlineKey.replace(/\\n/g, '\n');
  }
  const keyPath = process.env.APNS_PRIVATE_KEY_PATH?.trim();
  if (keyPath) return fs.readFileSync(keyPath, 'utf8');
  return null;
};

const getApnsHosts = () => {
  const sandbox = 'https://api.sandbox.push.apple.com';
  const production = 'https://api.push.apple.com';
  return process.env.APNS_USE_SANDBOX === 'true'
    ? [sandbox, production]
    : [production, sandbox];
};

const base64UrlEncode = (value) =>
  Buffer.from(value).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

const buildApnsJwt = () => {
  const teamId = process.env.APNS_TEAM_ID?.trim();
  const keyId  = process.env.APNS_KEY_ID?.trim();
  const privateKey = getApnsPrivateKey();
  if (!teamId || !keyId || !privateKey) throw new Error('APNs credentials not configured');
  const header  = { alg: 'ES256', kid: keyId };
  const payload = { iss: teamId, iat: Math.floor(Date.now() / 1000) };
  const unsigned = `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(JSON.stringify(payload))}`;
  // APNs requires ES256 with raw R||S encoding (IEEE P1363), not DER
  const signature = crypto.sign('sha256', Buffer.from(unsigned), { key: privateKey, dsaEncoding: 'ieee-p1363' });
  return `${unsigned}.${base64UrlEncode(signature)}`;
};

const sendApnsToToken = async (pushToken, title, body, data = {}) => {
  const token = normalizeToken(pushToken);
  const bundleId = process.env.APNS_BUNDLE_ID;
  if (!bundleId) return { ok: false, provider: 'apns', skipped: true, reason: 'no_bundle_id' };

  try {
    const jwt  = buildApnsJwt();
    const payloadStr = JSON.stringify({
      aps: { alert: { title, body }, sound: 'default', badge: 1 },
      ...data,
    });

    const hosts = getApnsHosts();
    let lastResult = null;

    for (const host of hosts) {
      const client = http2.connect(host);
      const result = await new Promise((resolve, reject) => {
        const req = client.request({
          ':method': 'POST',
          ':path': `/3/device/${token}`,
          'authorization': `bearer ${jwt}`,
          'apns-topic': bundleId,
          'apns-push-type': 'alert',
          'apns-priority': '10',
          'apns-expiration': String(Math.floor(Date.now() / 1000) + 86400 * 7),
          'content-type': 'application/json',
          'content-length': Buffer.byteLength(payloadStr),
        });

        req.setEncoding('utf8');
        let responseData = '';
        let statusCode;

        req.on('response', (headers) => { statusCode = headers[':status']; });
        req.on('data', (chunk) => { responseData += chunk; });
        req.on('end', () => {
          client.close();
          const environment = host.includes('sandbox') ? 'sandbox' : 'production';
          if (statusCode === 200) {
            resolve({ ok: true, provider: 'apns', environment });
          } else {
            const parsed = parseJsonSafely(responseData);
            const reason = parsed?.reason || `apns_http_${statusCode}`;
            const permanent = APNS_PERMANENT_TOKEN_REASONS.has(reason);
            resolve({ ok: false, provider: 'apns', environment, status: statusCode, reason, permanent });
          }
        });
        req.on('error', (err) => { client.close(); reject(err); });
        req.write(payloadStr);
        req.end();
      });

      if (result.ok) return result;
      lastResult = result;
      if (result.reason !== 'BadDeviceToken') break;
    }

    return lastResult || { ok: false, provider: 'apns', reason: 'apns_no_result' };
  } catch (err) {
    return { ok: false, provider: 'apns', error: err.message };
  }
};

// ─── FCM (Android) ────────────────────────────────────────────────────────────

let _firebaseAdmin = null;

const getFirebaseAdmin = async () => {
  if (_firebaseAdmin) return _firebaseAdmin;

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (!serviceAccountJson) {
    if (!serviceAccountPath) {
      console.warn('⚠️  Firebase service account not set — FCM push will be skipped');
      return null;
    }
  }

  try {
    const { default: admin } = await import('firebase-admin');
    if (!admin.apps.length) {
      const serviceAccount = serviceAccountJson
        ? JSON.parse(serviceAccountJson)
        : JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }
    _firebaseAdmin = admin;
    return admin;
  } catch (err) {
    console.error('❌ Firebase admin init failed:', err.message);
    return null;
  }
};

const sendFcmToToken = async (fcmToken, title, body, data = {}) => {
  const admin = await getFirebaseAdmin();
  if (!admin) {
    return { ok: false, provider: 'fcm', skipped: true, reason: 'firebase_not_configured' };
  }

  try {
    const stringData = Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, String(v)])
    );

    await admin.messaging().send({
      token: normalizeToken(fcmToken),
      notification: { title, body },
      android: {
        priority: 'high',
        notification: { sound: 'default', channelId: 'bago_default' },
      },
      data: stringData,
    });

    return { ok: true, provider: 'fcm' };
  } catch (err) {
    const code = err.code || '';
    const permanent = FCM_PERMANENT_TOKEN_CODES.has(code)
      || /registration token is not a valid fcm registration token/i.test(err.message || '');
    return { ok: false, provider: 'fcm', error: err.message, code, permanent };
  }
};

// ─── Public API ───────────────────────────────────────────────────────────────

export const sendPushNotificationToToken = async (pushToken, title, body, data = {}) => {
  const token = normalizeToken(pushToken);
  if (isApnsToken(token)) return sendApnsToToken(token, title, body, data);
  if (isFcmToken(token))  return sendFcmToToken(token, title, body, data);
  return { ok: false, skipped: true, reason: 'unrecognized_token_format', preview: token.substring(0, 20) };
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
      console.log(`No push tokens for user ${userId}`);
      return [];
    }

    const uniqueTokens = [...new Set(row.push_tokens.map(normalizeToken).filter(Boolean))];
    const results = [];

    for (const token of uniqueTokens) {
      try {
        const result = await sendPushNotificationToToken(token, title, body, data);
        results.push(result);
        if (result.ok) console.log(`✅ Push sent to user ${userId} via ${result.provider}${result.environment ? ` (${result.environment})` : ''}`);
        else if (result.skipped) console.log(`⏭ Push skipped: ${result.reason}`);
        else {
          console.warn(`⚠️ Push failed for user ${userId}: provider=${result.provider} reason=${result.reason || result.error || 'unknown'} env=${result.environment || 'unknown'}`);
        }
        if (result.permanent) {
          await removePushTokenForUser(
            userId,
            token,
            result.provider,
            result.reason || result.code || result.error || 'invalid_token',
          );
        }
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
