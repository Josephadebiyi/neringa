import fs from 'node:fs';
import http2 from 'node:http2';
import crypto from 'node:crypto';
import { Expo } from 'expo-server-sdk';
import { query as pgQuery, queryOne } from '../lib/postgres/db.js';

let admin = null;
let firebaseApp = null;

// Dynamically handle firebase-admin to prevent crash if not installed
const initFirebase = async () => {
  if (firebaseApp) return firebaseApp;
  try {
    admin = (await import('firebase-admin')).default;

    // Look for service account in env or disk
    let serviceAccount = null;

    const saEnv = process.env.FIREBASE_SERVICE_ACCOUNT_JSON || process.env.FIREBASE_SERVICE_ACCOUNT;
    if (saEnv) {
      try {
        serviceAccount = JSON.parse(saEnv);
      } catch (e) {
        console.error('❌ FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON');
      }
    } else {
      const saPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './firebase-service-account.json';
      if (fs.existsSync(saPath)) {
        serviceAccount = JSON.parse(fs.readFileSync(saPath, 'utf8'));
      }
    }

    if (serviceAccount && serviceAccount.project_id) {
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log('✅ Firebase Admin initialized successfully');
      return firebaseApp;
    } else {
      console.warn('⚠️ FIREBASE_SERVICE_ACCOUNT_JSON not found - FCM features disabled');
    }
  } catch (err) {
    console.warn('⚠️ Firebase Admin could not be initialized (might not be installed yet or config missing):', err.message);
  }
  return null;
};

// Initial attempt
initFirebase();

const expo = new Expo();

const APNS_PROD_HOST = 'https://api.push.apple.com';
const APNS_SANDBOX_HOST = 'https://api.sandbox.push.apple.com';

const base64UrlEncode = (value) =>
  Buffer.from(value)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

const normalizeToken = (token) => (typeof token === 'string' ? token.trim() : '');

const isExpoPushToken = (token) => Expo.isExpoPushToken(normalizeToken(token));

const isApnsPushToken = (token) => /^[0-9a-fA-F]{64}$/.test(normalizeToken(token));

const isFcmPushToken = (token) => {
  const t = normalizeToken(token);
  // FCM tokens are typically long alphanumeric strings (>100 chars)
  // and do not match the Expo or raw APNs hex pattern.
  return t.length > 50 && !isExpoPushToken(t) && !isApnsPushToken(t);
};

const getApnsPrivateKey = () => {
  const inlineKey = process.env.APNS_PRIVATE_KEY?.trim();
  if (inlineKey) {
    return inlineKey.includes('-----BEGIN') ? inlineKey : inlineKey.replace(/\\n/g, '\n');
  }

  const keyPath = process.env.APNS_PRIVATE_KEY_PATH?.trim();
  if (keyPath) {
    return fs.readFileSync(keyPath, 'utf8');
  }

  return null;
};

const getApnsHost = () =>
  process.env.APNS_USE_SANDBOX === 'true' ? APNS_SANDBOX_HOST : APNS_PROD_HOST;

const buildApnsJwt = () => {
  const teamId = process.env.APNS_TEAM_ID?.trim();
  const keyId = process.env.APNS_KEY_ID?.trim();
  const privateKey = getApnsPrivateKey();

  if (!teamId || !keyId || !privateKey) {
    throw new Error('APNs credentials are not configured');
  }

  const header = { alg: 'ES256', kid: keyId };
  const payload = {
    iss: teamId,
    iat: Math.floor(Date.now() / 1000),
  };

  const unsignedToken =
    `${base64UrlEncode(JSON.stringify(header))}.` +
    `${base64UrlEncode(JSON.stringify(payload))}`;
  const signature = crypto.sign('sha256', Buffer.from(unsignedToken), privateKey);

  return `${unsignedToken}.${base64UrlEncode(signature)}`;
};

const sendExpoPushToToken = async (pushToken, title, body, data = {}) => {
  const token = normalizeToken(pushToken);
  if (!isExpoPushToken(token)) {
    return { ok: false, provider: 'expo', skipped: true, reason: 'invalid_token' };
  }

  const messages = [{
    to: token,
    sound: 'default',
    title,
    body,
    data,
  }];

  const chunks = expo.chunkPushNotifications(messages);
  const results = [];

  for (const chunk of chunks) {
    try {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      results.push(...ticketChunk);
    } catch (error) {
      console.error('Expo push error:', error);
      results.push({ status: 'error', message: error.message });
    }
  }

  return { ok: true, provider: 'expo', results };
};

const sendApnsPushToToken = async (pushToken, title, body, data = {}) => {
  const token = normalizeToken(pushToken);
  if (!isApnsPushToken(token)) {
    return { ok: false, provider: 'apns', skipped: true, reason: 'invalid_token' };
  }

  const bundleId = process.env.APNS_BUNDLE_ID;
  if (!bundleId) {
    return { ok: false, provider: 'apns', skipped: true, reason: 'no_bundle_id' };
  }

  try {
    const jwt = buildApnsJwt();
    const host = getApnsHost();

    const payload = JSON.stringify({
      aps: {
        alert: { title, body },
        sound: 'default',
        badge: 1,
      },
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

      req.on('response', (headers) => {
        statusCode = headers[':status'];
      });

      req.on('data', (chunk) => {
        responseData += chunk;
      });

      req.on('end', () => {
        client.close();
        if (statusCode === 200) {
          resolve({ ok: true, provider: 'apns' });
        } else {
          resolve({ ok: false, provider: 'apns', status: statusCode, response: responseData });
        }
      });

      req.on('error', (err) => {
        client.close();
        reject(err);
      });

      req.write(payload);
      req.end();
    });
  } catch (err) {
    return { ok: false, provider: 'apns', error: err.message };
  }
};

const sendFcmPushToToken = async (pushToken, title, body, data = {}) => {
  const token = normalizeToken(pushToken);
  if (!isFcmPushToken(token)) {
    return { ok: false, provider: 'fcm', skipped: true, reason: 'invalid_token' };
  }

  try {
    const app = await initFirebase();
    if (!app) {
      return { ok: false, provider: 'fcm', skipped: true, reason: 'firebase_not_initialized' };
    }

    const message = {
      notification: { title, body },
      data: Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, String(v)])
      ),
      token,
    };

    const result = await admin.messaging().send(message);
    return { ok: true, provider: 'fcm', messageId: result };
  } catch (err) {
    console.error('FCM push error:', err.message);
    return { ok: false, provider: 'fcm', error: err.message };
  }
};

export const sendPushNotificationToToken = async (pushToken, title, body, data = {}) => {
  const token = normalizeToken(pushToken);

  if (isExpoPushToken(token)) {
    return sendExpoPushToToken(token, title, body, data);
  } else if (isApnsPushToken(token)) {
    return sendApnsPushToToken(token, title, body, data);
  } else if (isFcmPushToken(token)) {
    return sendFcmPushToToken(token, title, body, data);
  }

  return { ok: false, skipped: true, reason: 'unrecognized_token_format' };
};

export const sendPushNotification = async (userId, title, body, data = {}) => {
  try {
    // Fetch push tokens from Postgres
    const row = await queryOne(
      `SELECT push_tokens FROM public.profiles WHERE id = $1`,
      [userId]
    );

    // Store in-app notification regardless
    await pgQuery(
      `INSERT INTO public.notifications (user_id, title, message, type, read, created_at)
       VALUES ($1, $2, $3, 'general', false, NOW())
       ON CONFLICT DO NOTHING`,
      [userId, title, `${title}: ${body}`]
    ).catch(() => {
      // notifications table may have different schema, silently ignore
    });

    if (!row || !Array.isArray(row.push_tokens) || row.push_tokens.length === 0) {
      console.log(`No push tokens found for user ${userId}`);
      return [];
    }

    const uniqueTokens = [...new Set(row.push_tokens.map(normalizeToken).filter(Boolean))];
    const results = [];

    for (const pushToken of uniqueTokens) {
      try {
        const result = await sendPushNotificationToToken(pushToken, title, body, data);
        results.push(result);
      } catch (error) {
        console.error(`Error sending push notification to token ${pushToken}:`, error);
        results.push({ ok: false, error: error.message, token: pushToken });
      }
    }

    return results;
  } catch (error) {
    console.error('Error in sendPushNotification service:', error);
    throw error;
  }
};
