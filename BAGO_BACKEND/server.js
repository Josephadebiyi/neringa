import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import { readdir, readFile } from 'fs/promises';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';
import fetch from 'node-fetch';
import crypto from 'crypto';
import userRouter from './routers/userRouters.js';
import cloudinary from 'cloudinary';
import multer from 'multer';
import { messageController } from './controllers/MessageController.js';
import AdminRouter from './AdminRouter/AdminRouter.js';
import priceRoutes from "./AdminRouter/priceperkgRoute.js";
import { query as pgQuery, queryOne } from './lib/postgres/db.js';
import { Resend } from 'resend';
import { startEscrowAutoRelease } from './cron/escrowCron.js'
import { assessShipment, filterCompatibleTrips, quickCompatibilityCheck } from './services/shipmentAssessment.js';
import { generateCustomsDeclarationPDF, generateShipmentSummaryPDF, generateShippingLabelPDF } from './services/pdfGenerator.js';
import { sendPushNotification, sendPushNotificationToToken } from './services/pushNotificationService.js';
import {
  capturePayPalOrder,
  createPayPalOrder,
  handlePayPalOAuthCallback,
  paypalCancel,
  paypalReturn,
  paypalWebhook,
  savePayPalPayoutSettings,
  sendPayPalPayout,
  sendPayPalPayoutOtp,
  startPayPalOAuth,
  verifyPayPalPayoutOtp,
} from './controllers/PayPalController.js';


dotenv.config();

// Fail fast if critical secrets are missing or misconfigured
const _requiredSecrets = ['JWT_SECRET', 'ADMIN_SECRET_KEY', 'JWT_REFRESH_SECRET'];
for (const key of _requiredSecrets) {
  if (!process.env[key]) {
    console.error(`FATAL: Environment variable ${key} is not set. Refusing to start.`);
    process.exit(1);
  }
}
if (process.env.ADMIN_SECRET_KEY === process.env.JWT_SECRET) {
  console.error('FATAL: ADMIN_SECRET_KEY must differ from JWT_SECRET. Refusing to start.');
  process.exit(1);
}
if (String(process.env.PAYPAL_MODE || '').toLowerCase() === 'live' && !process.env.PAYPAL_WEBHOOK_ID) {
  console.error('FATAL: PAYPAL_WEBHOOK_ID must be set when PAYPAL_MODE=live. Refusing to start.');
  process.exit(1);
}

const app = express();
const httpServer = createServer(app);
app.disable('x-powered-by');
app.set('trust proxy', 1);

const allowedOrigins = new Set([
  process.env.FRONTEND_URL,
  process.env.ADMIN_URL,
  process.env.WEBAPP_URL,
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
].filter(Boolean));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const io = new Server(httpServer, {
  cors: {
    // null origin = mobile apps / Postman (no browser Origin header)
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.has(origin)) return cb(null, true);
      return cb(new Error(`Socket CORS: origin ${origin} not allowed`), false);
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Initialize Resend (optional)
export let resend = null;
if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY);
} else {
  console.warn('⚠️ RESEND_API_KEY not set - Email features disabled');
}

// Run all SQL migration files on startup — each in its own try/catch so one
// failure doesn't block the rest.
async function ensureWalletTransactionEnumValues() {
  const enumExists = await pgQuery(`
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'wallet_transaction_type'
      AND n.nspname = 'public'
    LIMIT 1
  `);
  if (enumExists.rowCount === 0) return;

  for (const value of ['earning', 'admin_settlement', 'escrow_hold', 'withdrawal']) {
    await pgQuery(`ALTER TYPE public.wallet_transaction_type ADD VALUE IF NOT EXISTS '${value}'`);
  }
}

async function runMigrations() {
  const migrationsDir = path.join(__dirname, 'migrations');
  try {
    await ensureWalletTransactionEnumValues();
  } catch (err) {
    console.error('❌ Could not prepare wallet transaction enum values:', err.message);
  }
  let files;
  try {
    files = (await readdir(migrationsDir)).filter(f => f.endsWith('.sql')).sort();
  } catch (err) {
    console.error('❌ Could not read migrations dir:', err.message);
    return;
  }
  for (const file of files) {
    try {
      const sql = await readFile(path.join(migrationsDir, file), 'utf8');
      await pgQuery(sql);
      console.log(`✅ Migration applied: ${file}`);
    } catch (err) {
      console.error(`❌ Migration failed (${file}):`, err.message);
    }
  }
}

// Ensure the support_tickets table exists — runs each statement independently
// so it works even if the migration file runner fails.
async function ensureSupportTable() {
  const statements = [
    `CREATE TABLE IF NOT EXISTS public.support_tickets (
       id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
       user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
       subject       TEXT NOT NULL,
       description   TEXT NOT NULL,
       category      TEXT NOT NULL DEFAULT 'OTHER'
                       CHECK (category IN ('SHIPMENT','PAYMENT','ACCOUNT','OTHER')),
       status        TEXT NOT NULL DEFAULT 'OPEN'
                       CHECK (status IN ('OPEN','IN_PROGRESS','RESOLVED','CLOSED')),
       priority      TEXT NOT NULL DEFAULT 'MEDIUM'
                       CHECK (priority IN ('LOW','MEDIUM','HIGH','URGENT')),
       assigned_to   TEXT,
       messages      JSONB NOT NULL DEFAULT '[]',
       last_agent_at TIMESTAMPTZ,
       last_user_at  TIMESTAMPTZ,
       created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
       updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
     )`,
    `CREATE INDEX IF NOT EXISTS support_tickets_user_idx    ON public.support_tickets(user_id)`,
    `CREATE INDEX IF NOT EXISTS support_tickets_status_idx  ON public.support_tickets(status)`,
    `CREATE INDEX IF NOT EXISTS support_tickets_created_idx ON public.support_tickets(created_at DESC)`,
  ];
  for (const sql of statements) {
    try {
      await pgQuery(sql);
    } catch (err) {
      // Log but never crash startup
      console.error('ensureSupportTable:', err.message);
    }
  }
  console.log('✅ support_tickets table ready');
}

runMigrations();
ensureSupportTable();
startEscrowAutoRelease();
startCurrencyRateSync();

// ✅ Middleware setup
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman) and listed origins
      if (!origin || allowedOrigins.has(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS: origin ${origin} not allowed`), false);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'geolocation=(), camera=(), microphone=()');
  next();
});

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.memoryStorage();
const upload = multer({ storage });

app.use(express.json({ limit: '10mb', strict: true }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());

const MAX_STRING_LENGTH = 5000;
const MAX_ARRAY_LENGTH = 100;
const MAX_OBJECT_KEYS = 100;
const MAX_DEPTH = 8;
const DANGEROUS_KEYS = new Set(['__proto__', 'prototype', 'constructor']);

const isPlainObject = (value) => Object.prototype.toString.call(value) === '[object Object]';

const sanitizeScalar = (value) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  // Allow base64 data URLs (images, PDFs) — these are legitimately large
  if (trimmed.startsWith('data:') && trimmed.includes(';base64,')) return trimmed;
  if (trimmed.length > MAX_STRING_LENGTH) {
    const error = new Error('Payload contains a field that is too large.');
    error.statusCode = 413;
    throw error;
  }
  return trimmed;
};

const sanitizeInput = (value, depth = 0) => {
  if (depth > MAX_DEPTH) {
    const error = new Error('Payload nesting is too deep.');
    error.statusCode = 413;
    throw error;
  }

  if (value == null) return value;
  if (typeof value === 'string') return sanitizeScalar(value);
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (value instanceof Date) return value;
  if (Array.isArray(value)) {
    if (value.length > MAX_ARRAY_LENGTH) {
      const error = new Error('Payload array is too large.');
      error.statusCode = 413;
      throw error;
    }
    return value.map((item) => sanitizeInput(item, depth + 1));
  }
  if (isPlainObject(value)) {
    const keys = Object.keys(value);
    if (keys.length > MAX_OBJECT_KEYS) {
      const error = new Error('Payload object is too large.');
      error.statusCode = 413;
      throw error;
    }
    const output = {};
    for (const key of keys) {
      if (DANGEROUS_KEYS.has(key)) {
        const error = new Error('Unsafe payload key detected.');
        error.statusCode = 400;
        throw error;
      }
      output[key] = sanitizeInput(value[key], depth + 1);
    }
    return output;
  }
  return value;
};

// ✅ Security: Sanitize and validate user input globally
app.use((req, res, next) => {
  try {
    // Only validate JSON body for methods that typically have one
    const bodyMethods = ['POST', 'PUT', 'PATCH'];
    const hasJsonHeader = req.headers['content-type']?.toLowerCase().includes('application/json');
    
    if (bodyMethods.includes(req.method) && hasJsonHeader) {
      if (req.body === undefined || req.body === null || typeof req.body !== 'object') {
        return res.status(400).json({ success: false, message: 'Malformed JSON payload.' });
      }
    }

    const hasBody = req.body && typeof req.body === 'object';
    const hasParams = req.params && typeof req.params === 'object';

    if (hasBody) req.body = sanitizeInput(req.body);
    // Note: req.query is a read-only getter in some Express versions; sanitise keys in-place instead
    if (req.query && typeof req.query === 'object') {
      const sanitized = sanitizeInput(req.query);
      Object.keys(sanitized).forEach(k => { req.query[k] = sanitized[k]; });
    }
    if (hasParams) req.params = sanitizeInput(req.params);

    const authHeader = req.headers.authorization;
    if (authHeader && typeof authHeader === 'string' && authHeader.length > 4096) {
      return res.status(400).json({ success: false, message: 'Authorization header is too large.' });
    }

    next();
  } catch (error) {
    const statusCode = error.statusCode || 400;
    return res.status(statusCode).json({ success: false, message: error.message || 'Invalid request payload.' });
  }
});

// ✅ Rate limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Increased for mobile app usage (multiple API calls per screen)
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again in 15 minutes.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please try again in 15 minutes.' },
  skipSuccessfulRequests: true,
});

const sensitiveLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts on a sensitive operation. Please try again in 1 hour.' },
});

// Apply global limiter to all routes
app.use(globalLimiter);

// Apply strict limiter to all auth routes
const authRoutes = [
  '/api/bago/signin',
  '/api/bago/signup',
  '/api/bago/google-auth',
  '/api/bago/apple-auth',
  '/api/bago/revoke-all-sessions',
  '/api/bago/forgot-password',
  '/api/bago/verify-otp',
  '/api/bago/reset-password',
  '/api/bago/verify-signup-otp',
  '/api/bago/resend-otp',
  '/api/bago/refresh-token',
  '/api/bago/logout',
  '/api/bago/user/request-email-change',
  '/api/bago/user/verify-email-change',
  '/api/bago/user/request-phone-change',
  '/api/bago/user/verify-phone-change',
  '/api/Adminbaggo/AdminLogin',
  '/api/Adminbaggo/AdminSignup',
];
authRoutes.forEach(route => app.use(route, authLimiter));

// Stricter limits on sensitive financial operations (not KYC — users need to retry)
[
  '/api/bago/withdrawFunds',
  '/api/bago/paystack/initialize',
  '/api/bago/paystack/add-bank',
  '/api/paystack/add-bank',
  '/api/paystack/verify-bank-otp',
  '/api/paystack/withdraw',
  '/api/payments/paypal/create-order',
  '/api/payments/paypal/capture-order',
  '/api/payouts/paypal/send',
  '/api/payouts/paypal/send-otp',
  '/api/payouts/paypal/verify-otp',
  '/send-otp',
].forEach(route => app.use(route, sensitiveLimiter));

// ✅ Make io accessible to routers
app.set('io', io);

// ✅ Initialize Socket.IO message controller
messageController(io);

// ✅ Main Routes
app.use('/api/bago', userRouter);
app.use('/api/Adminbaggo', AdminRouter);
app.use("/api/prices", priceRoutes);

// ✅ Route Pricing API (Public endpoints for mobile app)
import {
  searchRoutes,
  calculatePrice,
  getPricingForTrip,
  isAfricanCountry,
  getPaymentGatewayForCountry,
  getCurrencyForCountry,
} from './controllers/routeController.js';

// ✅ Insurance Controller
import {
  calculateInsurance,
  getInsuranceSettings,
  updateInsuranceSettings,
} from './controllers/InsuranceController.js';

// ✅ Item Validation Controller
import {
  validateItemForShipping,
  getCategoryRulesAPI,
  getCategories,
} from './controllers/ItemValidationController.js';

// ✅ Currency Conversion Controller
import {
  convertAmount,
  getRate,
  getAllExchangeRates,
  getPaymentQuote,
} from './controllers/CurrencyController.js';

import { startCurrencyRateSync } from './cron/currencyCron.js';

import { isAuthenticated } from './Auth/UserAuthentication.js';
import { adminAuthenticated } from './Auth/AdminAuthentication.js';
import { requireKycVerification } from './middleware/kycMiddleware.js';

// ✅ Paystack Controller
import {
  initializePaystackPayment,
  verifyPaystackPayment,
  addBankAccount,
  verifyBankOTP,
  withdrawFundsPaystack,
  getPaystackBanks,
  resolvePaystackAccount,
  getPaystackCountries,
  paystackWebhook,
} from './controllers/PaystackController.js';

// ✅ IP Geolocation Service
import { getLocationFromIP, getClientIP } from './services/ipGeolocation.js';

// Public route search and pricing endpoints
app.get('/api/routes/search', searchRoutes);
app.post('/api/routes/calculate-price', calculatePrice);
app.post('/api/packages/calculate-price', getPricingForTrip); // Compatibility for mobile app
app.post('/api/routes/trip-pricing', getPricingForTrip);

// Get payment gateway for user's country
app.get('/api/payment/gateway/:countryCode', (req, res) => {
  const { countryCode } = req.params;
  const gateway = getPaymentGatewayForCountry(countryCode);
  const isAfrican = isAfricanCountry(countryCode);
  const currency = getCurrencyForCountry(countryCode);

  res.json({
    success: true,
    countryCode: countryCode.toUpperCase(),
    paymentGateway: gateway,
    isAfricanCountry: isAfrican,
    currency,
  });
});

// ✅ Insurance endpoints
app.get('/api/insurance/calculate', calculateInsurance);
// moved to AdminRouter

// ✅ Item validation endpoints
app.post('/api/items/validate', validateItemForShipping);
app.get('/api/items/categories', getCategories);
app.get('/api/items/category-rules/:category', getCategoryRulesAPI);

// ✅ Currency conversion endpoints
app.get('/api/currency/convert', convertAmount);
app.get('/api/currency/rate', getRate);
app.get('/api/currency/rates', getAllExchangeRates);
app.post('/api/currency/quote', getPaymentQuote);

// ✅ Paystack endpoints (for African users)
app.post('/api/paystack/initialize', isAuthenticated, requireKycVerification, initializePaystackPayment);
app.get('/api/paystack/verify/:reference', isAuthenticated, verifyPaystackPayment);
app.post('/api/paystack/add-bank', isAuthenticated, addBankAccount);
app.post('/api/paystack/verify-bank-otp', isAuthenticated, verifyBankOTP);
app.post('/api/paystack/withdraw', isAuthenticated, withdrawFundsPaystack);
app.get('/api/paystack/banks', getPaystackBanks);
app.get('/api/paystack/resolve', resolvePaystackAccount);
app.get('/api/paystack/countries', getPaystackCountries);
app.post('/api/paystack/webhook', paystackWebhook); // No auth - verified by signature

// ✅ PayPal checkout and payouts
app.post('/api/payments/paypal/create-order', isAuthenticated, createPayPalOrder);
app.post('/api/payments/paypal/capture-order', isAuthenticated, capturePayPalOrder);
app.post('/api/payouts/paypal/settings', isAuthenticated, savePayPalPayoutSettings);
app.post('/api/payouts/paypal/send', isAuthenticated, sendPayPalPayout);
app.post('/api/payouts/paypal/send-otp', isAuthenticated, sendPayPalPayoutOtp);
app.post('/api/payouts/paypal/verify-otp', isAuthenticated, verifyPayPalPayoutOtp);
app.get('/api/payouts/paypal/oauth/start', isAuthenticated, startPayPalOAuth);
app.get('/api/payouts/paypal/oauth/callback', handlePayPalOAuthCallback);
app.post('/api/webhooks/paypal', paypalWebhook);
app.get('/api/payments/paypal/return', paypalReturn);
app.get('/api/payments/paypal/cancel', paypalCancel);

// ✅ IP-based location and currency detection
app.get('/api/location/detect', async (req, res) => {
  try {
    const ip = getClientIP(req);
    const location = await getLocationFromIP(ip);

    res.json({
      success: true,
      ip,
      location,
      recommendedGateway: 'paypal'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});


// ✅ Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.1' });
});


app.get('/', async (req, res) => {
  res.json({ success: true, message: "Bago API is running", version: "1.0.0" });
});


// Serve admin panel from /admin
const adminDist = path.join(__dirname, '../ADMIN_NEW/dist');
app.use('/admin', express.static(adminDist));
app.get(/^\/admin(\/.*)?$/, (req, res) => {
  if (req.originalUrl === '/admin') return res.redirect(301, '/admin/');
  res.sendFile(path.join(adminDist, 'index.html'));
});

// ✅ Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  const message = err.message || 'Something went wrong!';
  res.status(500).json({ message });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);

  // Keep-alive ping — prevents Render free tier from sleeping (every 13 min)
  const selfUrl = process.env.BASE_URL || 'https://neringa.onrender.com';
  setInterval(() => {
    fetch(`${selfUrl}/api/health`).catch(() => {});
  }, 13 * 60 * 1000);

  // KYC is Dojah/manual only.
});





app.get('/api/health', (_, res) => res.json({ ok: true }));

// IP-based currency detection — no auth required, called on app startup
app.get('/api/detect-currency', async (req, res) => {
  try {
    const { default: geoip } = await import('geoip-lite');
    const ip =
      (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
      req.socket.remoteAddress ||
      '';
    const geo = geoip.lookup(ip);
    const countryCode = geo?.country || '';
    const currencyInfo = countryCode ? getCurrencyForCountry(countryCode) : null;
    const currency = (typeof currencyInfo === 'string' ? currencyInfo : currencyInfo?.currency) || 'USD';
    res.json({ currency, countryCode, ip });
  } catch {
    res.json({ currency: 'USD', countryCode: '', ip: '' });
  }
});

// ✅ Register Token
app.post('/api/bago/register-token', isAuthenticated, async (req, res) => {
  const { token, deviceToken, pushToken } = req.body;
  const userId = req.user?.id || req.user?._id;
  const resolvedToken = token || deviceToken || pushToken;

  if (!resolvedToken) {
    return res.status(400).json({ error: 'token required' });
  }

  try {
    const { addPushToken } = await import('./lib/postgres/profiles.js');
    await addPushToken(userId, resolvedToken);
    console.log(`✅ Push token registered for user ${userId} (len=${resolvedToken.length})`);
    res.json({ success: true, message: 'Token registered successfully' });
  } catch (err) {
    console.error('Register token error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ✅ Push notification diagnostic endpoint
app.get('/api/bago/push-debug/:userId', isAuthenticated, async (req, res) => {
  try {
    const { userId } = req.params;
    const row = await queryOne(
      `SELECT id, email, push_tokens, communication_prefs FROM public.profiles WHERE id = $1`,
      [userId]
    );
    
    if (!row) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const tokens = row.push_tokens || [];
    const tokenInfo = tokens.map(t => ({
      length: t?.length || 0,
      prefix: t?.substring(0, 20) + '...',
      isExpo: /^ExponentPushToken/.test(t || ''),
      isApns: /^[0-9a-fA-F]{64}$/.test((t || '').trim()),
      isFcm: (t || '').length > 50 && !/^ExponentPushToken/.test(t || '') && !/^[0-9a-fA-F]{64}$/.test((t || '').trim()),
    }));

    res.json({
      success: true,
      userId: row.id,
      email: row.email,
      tokenCount: tokens.length,
      tokens: tokenInfo,
      communicationPrefs: row.communication_prefs,
    });
  } catch (err) {
    console.error('Push debug error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Notifications are now handled in AdminRouter via NotificationController


// sendPushNotification is imported from pushNotificationService at the top of this file






const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET;
if (!PAYSTACK_SECRET) console.warn("⚠️ PAYSTACK_SECRET not set");

const headers = {
  Authorization: `Bearer ${PAYSTACK_SECRET}`,
  "Content-Type": "application/json",
};

// Convert amount to kobo (Paystack requires smallest unit)
const toKobo = (amount) => Math.round(Number(amount) * 100);

// -----------------------------
// 1️⃣  LIST BANKS
// -----------------------------
// Keep both routes for safety
app.get("/banks", async (req, res) => {
  // console.log('[banks] incoming request');
  try {
    const resp = await fetch("https://api.paystack.co/bank?currency=NGN", { method: "GET", headers });
    const text = await resp.text();
    // console.log('[banks] paystack raw response status:', resp.status, 'body:', text);

    const data = JSON.parse(text);
    // Forward Paystack shape to client (makes frontend simple)
    return res.json(data);
  } catch (err) {
    console.error('[banks] error fetching paystack:', err);
    res.status(500).json({ status: false, message: err.message });
  }
});

// NOTE: /api/paystack/banks is registered earlier with getPaystackBanks (correct { success, banks } shape).
// Do not register a duplicate here — it returned raw Paystack JSON and broke clients expecting res.data.banks.

// -----------------------------
// 2️⃣  CREATE RECIPIENT
// -----------------------------
// server.js (or wherever your route is)
app.post("/create-recipient", async (_req, res) => {
  return res.status(410).json({
    success: false,
    message: "This legacy payout endpoint is disabled. Use /api/paystack/add-bank.",
  });
});



app.post("/send-otp", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;

    const user = await queryOne(`SELECT id, email, first_name FROM public.profiles WHERE id = $1`, [userId]);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const otp = crypto.randomInt(100000, 1000000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await queryOne(
      `UPDATE public.profiles SET otp_code = $2, otp_expires_at = $3, updated_at = NOW() WHERE id = $1 RETURNING id`,
      [userId, otp, expiresAt]
    );

    if (!resend || !resend.emails?.send) {
      return res.status(500).json({ success: false, message: "Email service not configured" });
    }
    const html = `
  <!doctype html>
  <html>
  <head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Bago — Withdrawal OTP</title>
  </head>
  <body style="margin:0; padding:0; background-color:#f3f4f6;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="min-width:100%; background-color:#f3f4f6; padding:32px 0;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px; width:100%; background:#ffffff; border-radius:12px; box-shadow:0 8px 30px rgba(0,0,0,0.06); overflow:hidden;">

          <!-- Header -->
          <tr>
            <td bgcolor="#5240E8" style="padding:24px 28px; text-align:center; background:linear-gradient(90deg,#5240E8 0%, #6B5CFF 100%);">
              <a href="${process.env.FRONTEND_URL || '#'}" target="_blank" style="text-decoration:none; display:inline-block;">
                <img src="https://res.cloudinary.com/dmito8es3/image/upload/v1761919738/Bago_New_2_gh1gmn.png" alt="Bago" width="140" style="display:block; border:0;"/>
              </a>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <h1 style="margin:0 0 12px; font-family:Arial, sans-serif; font-size:20px; color:#111827;">Confirm Your Withdrawal</h1>
              <p style="margin:0 0 18px; font-family:Arial, sans-serif; font-size:14px; color:#6b7280; line-height:1.5;">
                Hi <strong style="color:#111827;">${user.first_name || "User"}</strong>,
                to proceed with your withdrawal request from your Bago wallet, please use the One-Time Password (OTP) below.
                This code will expire in <strong>5 minutes</strong>.
              </p>

              <!-- OTP block -->
              <div style="margin:22px 0; text-align:center;">
                <div style="display:inline-block; padding:18px 28px; border-radius:10px; background:#f8fafc; border:1px solid #e6e9ef;">
                  <div style="font-family: 'Courier New', Courier, monospace; font-size:32px; letter-spacing:6px; color:#111827; font-weight:700;">
                    ${otp}
                  </div>
                  <div style="margin-top:8px; font-size:12px; color:#6b7280;">One-time passcode (OTP)</div>
                </div>
              </div>

              <p style="margin:22px 0 0; font-family:Arial, sans-serif; font-size:13px; color:#6b7280; line-height:1.5;">
                Enter this OTP in the app to confirm your withdrawal. If you did not initiate this request, please ignore this message.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 24px 20px; background:#fbfbfe; text-align:center; font-family:Arial, sans-serif; font-size:12px; color:#9ca3af;">
              <div style="max-width:520px; margin:0 auto;">
                <p style="margin:0 0 12px; font-family:Arial, sans-serif; font-size:11px; color:#9ca3af;">Get the Bago app</p>
                <a href="${process.env.FRONTEND_URL || 'https://sendwithbago.com'}" target="_blank" style="display:inline-block;">
                  <img src="${process.env.FRONTEND_URL || 'https://sendwithbago.com'}/app_store_buttons.png" alt="Download on App Store and Google Play" width="240" style="display:block; border:0; margin:0 auto;"/>
                </a>
                <div style="margin-top:16px; margin-bottom:6px;">Need help? Visit our <a href="${process.env.FRONTEND_URL || 'https://sendwithbago.com'}" style="color:#5240E8; text-decoration:none;">Help Center</a>.</div>
                <div style="margin-top:8px;">© ${new Date().getFullYear()} Bago. All rights reserved.</div>
                <div style="margin-top:8px;"><a href="#" style="color:#9ca3af; text-decoration:underline;">Unsubscribe</a></div>
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
  </body>
  </html>
  `;


    await resend.emails.send({
      from: "Bago <no-reply@sendwithbago.com>",
      to: user.email,
      subject: "Your Withdrawal OTP Code",
      html
    });


    res.json({ success: true, message: "OTP sent to email" });
  } catch (err) {
    console.error("❌ send-otp error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});





app.post("/verify-otp", async (_req, res) => {
  return res.status(410).json({
    success: false,
    message: "This legacy withdrawal endpoint is disabled. Use /api/paystack/withdraw.",
  });
});





// -----------------------------
// 3️⃣  INITIATE TRANSFER (PAYOUT)
// -----------------------------
app.post("/transfer", async (_req, res) => {
  return res.status(410).json({
    success: false,
    message: "This legacy transfer endpoint is disabled. Use authenticated payout APIs.",
  });
});

// -----------------------------
// 4️⃣  FINALIZE TRANSFER (if OTP enabled)
// -----------------------------
app.post("/transfer/finalize", async (_req, res) => {
  return res.status(410).json({
    success: false,
    message: "This legacy transfer finalize endpoint is disabled.",
  });
});

// -----------------------------
// 5️⃣  CHECK BALANCE
// -----------------------------
app.get("/balance", adminAuthenticated, async (req, res) => {
  try {
    const resp = await fetch("https://api.paystack.co/balance", {
      method: "GET",
      headers,
    });
    const data = await resp.json();
    if (!data.status)
      return res.status(400).json({ success: false, message: data.message, data });

    res.json({ success: true, balance: data.data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});



app.post("/api/payment/initialize", async (req, res) => {
  try {
    const { amount, email, currency = "NGN", mobile_money } = req.body;

    if (!amount || !email) {
      return res.status(400).json({ error: "Amount and email are required" });
    }

    const body = {
      email,
      amount: amount * 100, // Paystack expects amount in kobo
      currency,
      callback_url: "https://sendwithbago.com/",
      ...(mobile_money ? { mobile_money } : {}),
    };

    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.message || "Paystack API error");
    }

    res.json({
      status: true,
      message: "Authorization URL created",
      data: data.data,
    });
  } catch (err) {
    console.error("❌ Paystack init error:", err.message);
    res.status(500).json({
      status: false,
      message: "Payment initialization failed",
      error: err.message,
    });
  }
});




app.get("/api/payment/verify/:reference", async (req, res) => {
  const { reference } = req.params;

  try {
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok || data.data.status !== "success") {
      return res.status(400).json({ status: false, message: "Payment not successful", data });
    }

    res.json({ status: true, message: "Payment successful", data: data.data });
  } catch (err) {
    console.error("❌ Paystack verify error:", err.message);
    res.status(500).json({ status: false, message: "Verification failed", error: err.message });
  }
});

// Admin: Manually approve KYC (for testing)
app.post("/api/bago/kyc/admin-approve", adminAuthenticated, async (req, res) => {
  try {
    const { userId } = req.body;

    const updated = await queryOne(
      `UPDATE public.profiles SET kyc_status = 'approved', kyc_verified_at = NOW(), updated_at = NOW() WHERE id = $1 RETURNING id`,
      [userId]
    );
    if (!updated) return res.status(404).json({ success: false, message: "User not found" });

    res.json({ success: true, message: "KYC approved successfully" });
  } catch (err) {
    console.error("❌ Admin KYC approve error:", err.message);
    res.status(500).json({ success: false, message: "Failed to approve KYC", error: err.message });
  }
});

// Update KYC status manually (for webhook simulation)
app.post("/api/bago/kyc/update-status", adminAuthenticated, async (req, res) => {
  try {
    const { userId, status } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }

    if (!['approved', 'pending', 'declined'].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const updated = await queryOne(
      `UPDATE public.profiles
       SET kyc_status = $2,
           kyc_verified_at = CASE WHEN $2 = 'approved' THEN NOW() ELSE kyc_verified_at END,
           updated_at = NOW()
       WHERE id = $1 RETURNING id`,
      [userId, status]
    );
    if (!updated) return res.status(404).json({ success: false, message: "User not found" });

    res.json({ success: true, message: "KYC status updated", kycStatus: status });
  } catch (err) {
    console.error("❌ KYC status update error:", err.message);
    res.status(500).json({ success: false, message: "Failed to update KYC status", error: err.message });
  }
});

// ======================================
// 🗑️ DELETE ACCOUNT
// ======================================
app.post("/api/bago/delete-account", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id;
    const { reason, improvement } = req.body;

    // Store feedback before deletion
    console.log(`📝 Account deletion feedback from user ${userId}:`);
    console.log(`   Reason: ${reason}`);
    console.log(`   Improvement: ${improvement || 'N/A'}`);

    // Delete user's related data then the profile
    await pgQuery(`DELETE FROM public.trips WHERE user_id = $1`, [userId]);
    await pgQuery(`DELETE FROM public.shipment_requests WHERE sender_id = $1 OR traveler_id = $1`, [userId]);
    await pgQuery(`DELETE FROM public.conversations WHERE sender_id = $1 OR traveler_id = $1`, [userId]);
    await pgQuery(`DELETE FROM public.notifications WHERE user_id = $1`, [userId]);
    await pgQuery(`DELETE FROM public.profiles WHERE id = $1`, [userId]);

    console.log(`✅ User ${userId} account deleted successfully`);
    res.json({ success: true, message: "Account deleted successfully" });
  } catch (err) {
    console.error("❌ Delete account error:", err.message);
    res.status(500).json({ success: false, message: "Failed to delete account", error: err.message });
  }
});

// ======================================
// 💱 CURRENCY CONVERSION API
// ======================================

// Cache for exchange rates (to avoid too many API calls)
let exchangeRatesCache = {
  rates: {},
  lastUpdated: null,
};

// Fetch exchange rates from a free API
async function fetchExchangeRates() {
  try {
    // Use ExchangeRate-API (free tier)
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    const data = await response.json();

    if (data && data.rates) {
      exchangeRatesCache = {
        rates: data.rates,
        lastUpdated: new Date(),
      };
      console.log('✅ Exchange rates updated');
      return data.rates;
    }
    return exchangeRatesCache.rates;
  } catch (err) {
    console.error('❌ Failed to fetch exchange rates:', err.message);
    return exchangeRatesCache.rates;
  }
}

// Get exchange rates (with caching - refresh every hour)
async function getExchangeRates() {
  const oneHour = 60 * 60 * 1000;
  if (!exchangeRatesCache.lastUpdated ||
    (new Date() - exchangeRatesCache.lastUpdated) > oneHour) {
    return await fetchExchangeRates();
  }
  return exchangeRatesCache.rates;
}

// Convert currency endpoint
app.get("/api/currency/convert", async (req, res) => {
  try {
    const { amount, from, to } = req.query;

    if (!amount || !from || !to) {
      return res.status(400).json({ success: false, message: "Missing amount, from, or to currency" });
    }

    const rates = await getExchangeRates();

    if (!rates[from] || !rates[to]) {
      return res.status(400).json({ success: false, message: "Invalid currency code" });
    }

    // Convert to USD first, then to target currency
    const amountInUSD = parseFloat(amount) / rates[from];
    const convertedAmount = amountInUSD * rates[to];

    res.json({
      success: true,
      amount: parseFloat(amount),
      from,
      to,
      rate: rates[to] / rates[from],
      convertedAmount: Math.round(convertedAmount * 100) / 100,
    });
  } catch (err) {
    console.error("❌ Currency conversion error:", err.message);
    res.status(500).json({ success: false, message: "Failed to convert currency", error: err.message });
  }
});

// Get all available rates
app.get("/api/currency/rates", async (req, res) => {
  try {
    const rates = await getExchangeRates();
    res.json({
      success: true,
      base: 'USD',
      rates,
      lastUpdated: exchangeRatesCache.lastUpdated,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to get rates", error: err.message });
  }
});

// Update user's preferred currency - PROTECTED ROUTE
// Public: active promotional banners for the app
app.get("/api/bago/banners", async (req, res) => {
  const { getActiveBanners } = await import('./controllers/AdminControllers/BannerController.js');
  return getActiveBanners(req, res);
});

app.post("/api/bago/user/currency", isAuthenticated, async (req, res) => {
  try {
    const { currency } = req.body;
    const user = req.user;

    if (!currency) {
      return res.status(400).json({ success: false, message: "Currency required" });
    }

    await pgQuery(
      `UPDATE public.profiles SET preferred_currency = $2, updated_at = NOW() WHERE id = $1`,
      [user.id, currency]
    );

    res.json({ success: true, message: "Currency updated", currency });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to update currency", error: err.message });
  }
});


// ============================================
// SHIPMENT ASSESSMENT & CUSTOMS COMPLIANCE API
// ============================================

/**
 * Assess shipment compatibility and generate risk scores
 * POST /api/shipment/assess
 */
app.post("/api/shipment/assess", isAuthenticated, async (req, res) => {
  try {
    const { tripId, item, senderCountry } = req.body;

    if (!tripId || !item) {
      return res.status(400).json({
        success: false,
        message: "tripId and item details are required"
      });
    }

    // Get trip data from Postgres
    const tripRow = await queryOne(
      `SELECT t.*, p.first_name, p.last_name, p.rating, p.completed_trips, p.cancellations
       FROM public.trips t
       LEFT JOIN public.profiles p ON p.id = t.user_id
       WHERE t.id = $1`,
      [tripId]
    );

    if (!tripRow) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }

    const tripData = {
      _id: tripRow.id, id: tripRow.id,
      from: tripRow.from_location, fromCountry: tripRow.from_country,
      to: tripRow.to_location, toCountry: tripRow.to_country,
      availableKg: parseFloat(tripRow.available_kg) || 0,
      travelMeans: tripRow.travel_means,
      departureDate: tripRow.departure_date,
      arrivalDate: tripRow.arrival_date,
    };
    const traveler = {
      _id: tripRow.user_id, id: tripRow.user_id,
      firstName: tripRow.first_name, lastName: tripRow.last_name,
      name: `${tripRow.first_name || ''} ${tripRow.last_name || ''}`.trim(),
      rating: parseFloat(tripRow.rating) || 0,
      completedTrips: parseInt(tripRow.completed_trips) || 0,
      cancellations: parseInt(tripRow.cancellations) || 0,
    };

    // Perform assessment
    const assessment = await assessShipment({
      trip: tripData,
      item,
      traveler,
      senderCountry: senderCountry || 'GB'
    });

    // Store assessment in database for later PDF retrieval
    const assessmentDoc = {
      ...assessment,
      senderUserId: req.user._id,
      createdAt: new Date()
    };

    // Store assessment in a simple way (just log it — no Mongo needed for this feature)
    console.log(`📦 Shipment assessment for user ${req.user.id}:`, assessmentDoc.declarationData?.shipmentId);

    res.json({
      success: true,
      assessment
    });

  } catch (err) {
    console.error("❌ Shipment assessment error:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to assess shipment",
      error: err.message
    });
  }
});

/**
 * Quick compatibility check for filtering trips
 * POST /api/shipment/quick-check
 */
app.post("/api/shipment/quick-check", async (req, res) => {
  try {
    const { trips, item } = req.body;

    if (!trips || !item) {
      return res.status(400).json({
        success: false,
        message: "trips array and item details required"
      });
    }

    const compatibleTrips = filterCompatibleTrips(trips, item);

    res.json({
      success: true,
      totalTrips: trips.length,
      compatibleCount: compatibleTrips.length,
      compatibleTrips
    });

  } catch (err) {
    console.error("❌ Quick check error:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to check compatibility",
      error: err.message
    });
  }
});

/**
 * Get compatibility for a specific trip-item combination
 * GET /api/shipment/compatibility/:tripId
 */
app.get("/api/shipment/compatibility/:tripId", async (req, res) => {
  try {
    const { tripId } = req.params;
    const { weight, category, type, value, quantity } = req.query;

    if (!weight || !category) {
      return res.status(400).json({
        success: false,
        message: "weight and category query params required"
      });
    }

    // Get trip from Postgres
    const pgTrip = await queryOne(
      `SELECT id, from_location, from_country, to_location, to_country, available_kg, travel_means, departure_date, arrival_date FROM public.trips WHERE id = $1`,
      [tripId]
    );

    if (!pgTrip) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }

    const trip = {
      _id: pgTrip.id, id: pgTrip.id,
      from: pgTrip.from_location, fromCountry: pgTrip.from_country,
      to: pgTrip.to_location, toCountry: pgTrip.to_country,
      availableKg: parseFloat(pgTrip.available_kg) || 0,
      travelMeans: pgTrip.travel_means,
    };
    const item = {
      weight: parseFloat(weight),
      category,
      type: type || category,
      value: parseFloat(value) || 0,
      quantity: parseInt(quantity) || 1
    };

    const result = quickCompatibilityCheck(trip, item);

    res.json({
      success: true,
      tripId,
      ...result,
      tripDetails: {
        from: trip.from,
        to: trip.to,
        availableKg: trip.availableKg,
        travelMeans: trip.travelMeans
      }
    });

  } catch (err) {
    console.error("❌ Compatibility check error:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to check compatibility",
      error: err.message
    });
  }
});

/**
 * Generate and download customs declaration PDF
 * GET /api/shipment/customs-pdf/:assessmentId
 */
app.get("/api/shipment/customs-pdf/:assessmentId", isAuthenticated, async (req, res) => {
  try {
    // Assessment history is not persisted server-side — client should pass data directly
    return res.status(404).json({
      success: false,
      message: "Assessment not found. Please use /api/shipment/generate-pdf with declarationData directly."
    });

  } catch (err) {
    console.error("❌ PDF generation error:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to generate PDF",
      error: err.message
    });
  }
});

/**
 * Generate customs PDF from assessment data (direct)
 * POST /api/shipment/generate-pdf
 */
app.post("/api/shipment/generate-pdf", isAuthenticated, async (req, res) => {
  try {
    const { declarationData } = req.body;

    if (!declarationData) {
      return res.status(400).json({
        success: false,
        message: "declarationData is required"
      });
    }

    // Generate PDF
    const pdfBuffer = await generateCustomsDeclarationPDF(declarationData);

    // Convert to base64 for mobile download
    const pdfBase64 = pdfBuffer.toString('base64');

    res.json({
      success: true,
      pdf: pdfBase64,
      filename: `customs-declaration-${declarationData.shipmentId}.pdf`,
      contentType: 'application/pdf'
    });

  } catch (err) {
    console.error("❌ PDF generation error:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to generate PDF",
      error: err.message
    });
  }
});

/**
 * Get country-specific customs rules
 * GET /api/customs/rules/:countryCode
 */
app.get("/api/customs/rules/:countryCode", async (req, res) => {
  try {
    const { countryCode } = req.params;

    // Import customs rules
    const { COUNTRY_RULES, TRANSPORT_RESTRICTIONS, HS_CODES } = await import('./data/customsRules.js');

    const rules = COUNTRY_RULES[countryCode.toUpperCase()] || COUNTRY_RULES.DEFAULT;

    res.json({
      success: true,
      countryCode: countryCode.toUpperCase(),
      rules,
      transportRestrictions: TRANSPORT_RESTRICTIONS,
      availableHSCodes: Object.keys(HS_CODES)
    });

  } catch (err) {
    console.error("❌ Customs rules error:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to get customs rules",
      error: err.message
    });
  }
});

/**
 * Get HS codes for item categories
 * GET /api/customs/hs-codes
 */
app.get("/api/customs/hs-codes", async (req, res) => {
  try {
    const { HS_CODES } = await import('./data/customsRules.js');

    res.json({
      success: true,
      hsCodes: HS_CODES
    });

  } catch (err) {
    console.error("❌ HS codes error:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to get HS codes",
      error: err.message
    });
  }
});

/**
 * Search trips with compatibility filter
 * POST /api/trips/search-compatible
 */
app.post("/api/trips/search-compatible", async (req, res) => {
  try {
    const { fromCountry, fromCity, toCountry, toCity, item } = req.body;

    if (!item || !item.weight || !item.category) {
      return res.status(400).json({
        success: false,
        message: "item with weight and category is required"
      });
    }

    // Get trips from Postgres with optional route filters
    const params = [];
    let where = `WHERE t.status IN ('active','verified')`;
    if (fromCountry) { params.push(`%${fromCountry}%`); where += ` AND t.from_country ILIKE $${params.length}`; }
    if (toCountry)   { params.push(`%${toCountry}%`);   where += ` AND t.to_country ILIKE $${params.length}`; }
    if (fromCity)    { params.push(`%${fromCity}%`);    where += ` AND t.from_location ILIKE $${params.length}`; }
    if (toCity)      { params.push(`%${toCity}%`);      where += ` AND t.to_location ILIKE $${params.length}`; }

    const pgTripsResult = await pgQuery(
      `SELECT t.id, t.from_location, t.from_country, t.to_location, t.to_country,
              t.available_kg, t.travel_means, t.departure_date, t.arrival_date,
              p.id as traveler_id, p.first_name, p.last_name, p.rating, p.completed_trips, p.cancellations, p.kyc_status, p.image_url
       FROM public.trips t
       LEFT JOIN public.profiles p ON p.id = t.user_id
       ${where} ORDER BY t.departure_date ASC LIMIT 200`,
      params
    );

    let allTrips = [];

    for (const row of pgTripsResult.rows) {
      const trip = {
        _id: row.id, id: row.id,
        from: row.from_location, fromCountry: row.from_country,
        to: row.to_location, toCountry: row.to_country,
        availableKg: parseFloat(row.available_kg) || 0,
        travelMeans: row.travel_means,
      };

      const compatibility = quickCompatibilityCheck(trip, item);

      if (compatibility.compatible) {
        allTrips.push({
          ...trip,
          departureDate: row.departure_date,
          arrivalDate: row.arrival_date,
          travelerId: row.traveler_id,
          travelerName: `${row.first_name || ''} ${row.last_name || ''}`.trim(),
          travelerRating: parseFloat(row.rating) || 0,
          travelerCompletedTrips: parseInt(row.completed_trips) || 0,
          travelerKycStatus: row.kyc_status,
          travelerImage: row.image_url,
          compatibility: 'Yes',
          compatibilityReason: compatibility.reason,
        });
      }
    }

    // Sort by departure date
    allTrips.sort((a, b) => new Date(a.departureDate || a.date) - new Date(b.departureDate || b.date));

    res.json({
      success: true,
      totalCompatibleTrips: allTrips.length,
      trips: allTrips.slice(0, 50) // Limit to 50 results
    });

  } catch (err) {
    console.error("❌ Search compatible trips error:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to search trips",
      error: err.message
    });
  }
});

/**
 * Get shipment assessment history
 * GET /api/shipment/history
 */
app.get("/api/shipment/history", isAuthenticated, async (req, res) => {
  // Shipment assessments are computed on-the-fly and not persisted in Postgres
  res.json({ success: true, count: 0, assessments: [] });
});

/**
 * Generate and download shipping label PDF
 * GET /api/shipping/label/:requestId
 */
app.get("/api/shipping/label/:requestId", isAuthenticated, async (req, res) => {
  try {
    const { requestId } = req.params;

    const request = await queryOne(
      `SELECT sr.id, sr.sender_id, sr.traveler_id, sr.tracking_number, sr.status,
              sr.amount, sr.currency, sr.insurance, sr.insurance_cost,
              sr.estimated_departure, sr.estimated_arrival,
              s.first_name as sender_first_name, s.last_name as sender_last_name,
              s.phone as sender_phone,
              t.first_name as traveler_first_name, t.last_name as traveler_last_name,
              pkg.package_weight, pkg.description as package_description,
              pkg.category as package_category, pkg.declared_value as package_declared_value,
              tr.travel_means, tr.departure_date, tr.arrival_date
       FROM public.shipment_requests sr
       LEFT JOIN public.profiles s ON s.id = sr.sender_id
       LEFT JOIN public.profiles t ON t.id = sr.traveler_id
       LEFT JOIN public.packages pkg ON pkg.id = sr.package_id
       LEFT JOIN public.trips tr ON tr.id = sr.trip_id
       WHERE sr.id = $1`,
      [requestId]
    );

    if (!request) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }

    const userId = req.user.id;
    if (request.sender_id !== userId && request.traveler_id !== userId) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const shippingData = {
      sender: {
        name: request.sender_first_name ? `${request.sender_first_name} ${request.sender_last_name || ''}`.trim() : 'Sender',
        phone: request.sender_phone || ''
      },
      traveler: {
        name: request.traveler_first_name ? `${request.traveler_first_name} ${request.traveler_last_name || ''}`.trim() : 'Traveler'
      },
      package: {
        weight: request.package_weight,
        description: request.package_description,
        category: request.package_category,
        declaredValue: request.package_declared_value,
      },
      trackingNumber: request.tracking_number || 'BGO-PENDING',
      status: request.status || 'pending',
      estimatedDeparture: request.estimated_departure || request.departure_date,
      estimatedArrival: request.estimated_arrival || request.arrival_date,
      insurance: request.insurance || false,
      insuranceCost: request.insurance_cost || 0,
      amount: request.amount || 0,
      currency: request.currency || 'USD',
      trip: {
        travelMeans: request.travel_means || 'N/A'
      }
    };

    // Generate PDF
    const pdfBuffer = await generateShippingLabelPDF(shippingData);

    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="BAGO_Label_${shippingData.trackingNumber}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);

  } catch (err) {
    console.error("❌ Shipping label generation error:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to generate shipping label",
      error: err.message
    });
  }
});


// ────────────────────────────────────────────────────────────────────────────
// Push notification diagnostic (temporary — remove after testing)
// ────────────────────────────────────────────────────────────────────────────
app.get('/api/bago/push-diag/tokens', adminAuthenticated, async (req, res) => {
  try {
    const result = await pgQuery(
      `SELECT id, email, first_name, last_name, array_length(push_tokens, 1) as token_count, push_tokens
       FROM public.profiles
       WHERE push_tokens IS NOT NULL AND array_length(push_tokens, 1) > 0
       ORDER BY updated_at DESC LIMIT 20`
    );
    const users = (result.rows || []).map(r => ({
      id: r.id,
      email: r.email,
      name: `${r.first_name || ''} ${r.last_name || ''}`.trim(),
      tokenCount: r.token_count || 0,
      tokens: (r.push_tokens || []).map(t => ({
        len: (t || '').length,
        prefix: (t || '').substring(0, 25) + '...',
        type: /^ExponentPushToken/.test(t) ? 'expo'
            : /^[0-9a-fA-F]{64}$/.test((t || '').trim()) ? 'apns'
            : (t || '').length > 50 ? 'fcm' : 'unknown',
      })),
    }));
    res.json({ success: true, usersWithTokens: users.length, users });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/bago/push-diag/test', adminAuthenticated, async (req, res) => {
  try {
    let { userId, email, title, body } = req.body;

    // Allow lookup by email
    if (!userId && email) {
      const user = await queryOne(`SELECT id, push_tokens FROM public.profiles WHERE lower(email) = lower($1)`, [email]);
      if (!user) return res.status(404).json({ error: 'User not found' });
      userId = user.id;
      if (!user.push_tokens?.length) {
        return res.status(200).json({ success: false, userId, tokens: 0, message: 'User has no push tokens stored — token registration may be failing' });
      }
    }

    if (!userId) return res.status(400).json({ error: 'userId or email required' });

    const { sendPushNotification: sendPush } = await import('./services/pushNotificationService.js');
    const results = await sendPush(userId, title || 'Bago Test 🔔', body || 'Push notifications are working!');
    res.json({ success: true, userId, results });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ✅ Explicit 404 handler — MUST be the last route (catches unmatched /api requests)
app.use((req, res, next) => {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(404).json({
      success: false,
      message: 'Route not found',
    });
  }
  next();
});
