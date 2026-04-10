import fs from 'node:fs';
import http2 from 'node:http2';
import crypto from 'node:crypto';
import { Expo } from 'expo-server-sdk';
import User from '../models/userScheme.js';
import { Notification } from '../models/notificationScheme.js';

let admin = null;
let firebaseApp = null;

// Dynamically handle firebase-admin to prevent crash if not installed
const initFirebase = async () => {
  if (firebaseApp) return firebaseApp;
  try {
    admin = (await import('firebase-admin')).default;
    
    // Look for service account in env or disk
    let serviceAccount = null;
    
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      } catch (e) {
        console.error('❌ FIREBASE_SERVICE_ACCOUNT is not valid JSON');
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
      console.warn('⚠️ FIREBASE_SERVICE_ACCOUNT or firebase-service-account.json not found - FCM features disabled');
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

  const tickets = await expo.sendPushNotificationsAsync(messages);
  return { ok: true, provider: 'expo', tickets };
};

const sendApnsPushToToken = async (pushToken, title, body, data = {}) => {
  const token = normalizeToken(pushToken);
  if (!isApnsPushToken(token)) {
    return { ok: false, provider: 'apns', skipped: true, reason: 'invalid_token' };
  }

  const bundleId = process.env.APNS_BUNDLE_ID?.trim();
  if (!bundleId) {
    throw new Error('APNS_BUNDLE_ID is not configured');
  }

  const customData = { ...data };
  delete customData.aps;

  const payload = {
    ...customData,
    aps: {
      alert: { title, body },
      sound: 'default',
    },
  };

  const jwt = buildApnsJwt();
  const host = getApnsHost();
  const client = http2.connect(host);

  return await new Promise((resolve, reject) => {
    const request = client.request({
      ':method': 'POST',
      ':path': `/3/device/${token}`,
      'apns-topic': bundleId,
      'apns-push-type': 'alert',
      'apns-priority': '10',
      authorization: `bearer ${jwt}`,
      'content-type': 'application/json',
    });

    let responseBody = '';
    let statusCode = 0;

    request.setEncoding('utf8');
    request.on('response', (headers) => {
      statusCode = Number(headers[':status'] || 0);
    });
    request.on('data', (chunk) => {
      responseBody += chunk;
    });
    request.on('error', (error) => {
      client.close();
      reject(error);
    });
    request.on('end', () => {
      client.close();
      if (statusCode >= 200 && statusCode < 300) {
        resolve({
          ok: true,
          provider: 'apns',
          statusCode,
          body: responseBody,
        });
        return;
      }

      resolve({
        ok: false,
        provider: 'apns',
        statusCode,
        body: responseBody,
      });
    });

    request.end(JSON.stringify(payload));
  });
};

const sendFcmPushToToken = async (pushToken, title, body, data = {}) => {
  const token = normalizeToken(pushToken);
  if (!token) return { ok: false, provider: 'fcm', skipped: true, reason: 'missing_token' };

  try {
    const app = await initFirebase();
    if (!app) {
      return { ok: false, provider: 'fcm', error: 'Firebase not initialized' };
    }

    const message = {
      token: token,
      notification: { title, body },
      data: {
        ...data,
        click_action: 'FLUTTER_NOTIFICATION_CLICK', // for older android versions
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            alert: { title, body },
          },
        },
      },
    };

    const response = await admin.messaging().send(message);
    return { ok: true, provider: 'fcm', response };
  } catch (error) {
    console.error('FCM Transmission Error:', error);
    return { ok: false, provider: 'fcm', error: error.message };
  }
};

export const sendPushNotificationToToken = async (pushToken, title, body, data = {}) => {
  const token = normalizeToken(pushToken);
  if (!token) {
    return { ok: false, skipped: true, reason: 'missing_token' };
  }

  if (isExpoPushToken(token)) {
    return sendExpoPushToToken(token, title, body, data);
  }

  if (isApnsPushToken(token)) {
    return sendApnsPushToToken(token, title, body, data);
  }

  if (isFcmPushToken(token)) {
    return sendFcmPushToToken(token, title, body, data);
  }

  return { ok: false, skipped: true, reason: 'unsupported_token_type' };
};

export const sendPushNotification = async (userId, title, body, data = {}) => {
  try {
    const user = await User.findById(userId);
    if (!user || !Array.isArray(user.pushTokens) || user.pushTokens.length === 0) {
      console.log(`No push tokens found for user ${userId}`);
      await Notification.create({
        user: userId,
        message: `${title}: ${body}`,
      });
      return [];
    }

    const uniqueTokens = [...new Set(user.pushTokens.map(normalizeToken).filter(Boolean))];
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

    await Notification.create({
      user: userId,
      message: `${title}: ${body}`,
    });

    return results;
  } catch (error) {
    console.error('Error in sendPushNotification service:', error);
    throw error;
  }
};
