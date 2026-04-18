import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
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
import Stripe from 'stripe';
import priceRoutes from "./AdminRouter/priceperkgRoute.js";
import { query as pgQuery, queryOne } from './lib/postgres/db.js';
import { Resend } from 'resend';
import { startEscrowAutoRelease } from './cron/escrowCron.js'
import { assessShipment, filterCompatibleTrips, quickCompatibilityCheck } from './services/shipmentAssessment.js';
import { generateCustomsDeclarationPDF, generateShipmentSummaryPDF, generateShippingLabelPDF } from './services/pdfGenerator.js';
import { sendPushNotification, sendPushNotificationToToken } from './services/pushNotificationService.js';


dotenv.config();

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
    origin: '*', // Allow all origins for mobile app compatibility
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// ✅ Initialize Stripe (optional - will be null if no key provided)
let stripe = null;
const stripeKey = process.env.STRIPE_SECRET_KEY;
if (stripeKey && stripeKey !== 'your_stripe_secret_key' && stripeKey.startsWith('sk_')) {
  stripe = new Stripe(stripeKey);
  console.log('✅ Stripe initialized successfully');
} else {
  console.warn('⚠️ STRIPE_SECRET_KEY not set or invalid - Stripe features disabled');
  console.warn('   To enable Stripe: Get your key from https://dashboard.stripe.com/apikeys');
}

// Initialize Resend (optional)
export let resend = null;
if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY);
} else {
  console.warn('⚠️ RESEND_API_KEY not set - Email features disabled');
}

startEscrowAutoRelease();
startCurrencyRateSync();

// create or return an existing Stripe account id for a user
async function createStripeAccountForUser(user) {
  if (!stripe) {
    console.warn('❌ createStripeAccountForUser failed: Stripe not configured');
    throw new Error('Stripe not configured');
  }
  if (!user) throw new Error('User required');

  if (user.stripeConnectAccountId) return user.stripeConnectAccountId;

  try {
    const account = await stripe.accounts.create({
      type: 'express',                  // or 'standard' / 'custom' depending on your model
      email: user.email,
      capabilities: { transfers: { requested: true } },
    });

    await pgQuery(
      `UPDATE public.profiles SET stripe_connect_account_id = $2, updated_at = NOW() WHERE id = $1`,
      [user.id, account.id]
    );

    console.log(`✅ Created Stripe account ${account.id} for user ${user.id}`);
    return account.id;
  } catch (err) {
    console.error('❌ Stripe Account Creation Error:', err.message);
    throw err;
  }
}



// ✅ Middleware setup
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Postman)
      if (!origin || allowedOrigins.has(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Allow all origins for mobile app compatibility
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
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Increased slightly for mobile auth retries
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please try again in 15 minutes.' },
  skipSuccessfulRequests: true, // only count failed attempts
});

// Apply global limiter to all routes
app.use(globalLimiter);

// Apply strict limiter to all auth routes
const authRoutes = [
  '/api/bago/signin',
  '/api/bago/signup',
  '/api/bago/google-auth',
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
];
authRoutes.forEach(route => app.use(route, authLimiter));

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
app.post('/api/paystack/initialize', isAuthenticated, initializePaystackPayment);
app.get('/api/paystack/verify/:reference', isAuthenticated, verifyPaystackPayment);
app.post('/api/paystack/add-bank', isAuthenticated, addBankAccount);
app.post('/api/paystack/verify-bank-otp', isAuthenticated, verifyBankOTP);
app.post('/api/paystack/withdraw', isAuthenticated, withdrawFundsPaystack);
app.get('/api/paystack/banks', getPaystackBanks);
app.get('/api/paystack/resolve', resolvePaystackAccount);
app.get('/api/paystack/countries', getPaystackCountries);
app.post('/api/paystack/webhook', paystackWebhook); // No auth - verified by signature

// ✅ IP-based location and currency detection
app.get('/api/location/detect', async (req, res) => {
  try {
    const ip = getClientIP(req);
    const location = await getLocationFromIP(ip);

    res.json({
      success: true,
      ip,
      location,
      recommendedGateway: location.countryCode && ['NG', 'GH', 'ZA', 'KE'].includes(location.countryCode) ? 'paystack' : 'stripe'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✅ Simple KYC Test Route (for testing connection)
app.post('/kyc/start-verification', (req, res) => {
  console.log("KYC request received from app");
  res.json({
    success: true,
    message: "Verification session created",
    sessionId: "KYC" + Date.now()
  });
});

// ✅ Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});


// ✅ Stripe Payment Intent Route (Standard Payment)
app.post('/api/payment/create-intent', async (req, res) => {
  if (!stripe) {
    return res.status(503).json({ error: 'Payment service not configured' });
  }

  const { amount, travellerName, travellerEmail, currency = 'usd' } = req.body;
  const paymentCurrency = String(currency || 'usd').toLowerCase();

  console.log('💡 /create-intent called with:', { amount, travellerName, travellerEmail, currency: paymentCurrency });

  try {
    if (!amount) {
      console.warn('⚠️ Missing required parameter: amount');
      return res.status(400).json({ error: 'Missing required parameter: amount.' });
    }

    const stripeAmount = Math.round(Number(amount) * 100);
    console.log('💡 Calculated stripeAmount (in cents):', stripeAmount);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: stripeAmount,
      currency: paymentCurrency,
      receipt_email: travellerEmail, // ✅ this is what Stripe dashboard uses
      metadata: { travellerName },   // optional for reference
      automatic_payment_methods: { enabled: true },
    });


    console.log('💡 PaymentIntent created successfully:', paymentIntent.id);
    console.log('💡 Client Secret:', paymentIntent.client_secret);

    res.status(200).json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        currency: paymentCurrency,
      },
    });
  } catch (error) {
    console.error('❌ Stripe Payment Intent Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});


// ✅ STRIPE CONNECT - Onboarding
app.post('/api/stripe/connect/onboard', async (req, res) => {
  if (!stripe) {
    return res.status(503).json({ success: false, message: 'Payment service not configured' });
  }
  try {
    const { userId, email } = req.body;
    if (!userId || !email) return res.status(400).json({ success: false, message: 'userId and email are required' });

    const user = await queryOne(`SELECT * FROM public.profiles WHERE id = $1`, [userId]);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const stripeAccountId = await createStripeAccountForUser({ ...user, _id: user.id, stripeConnectAccountId: user.stripe_connect_account_id });

    // create account link for onboarding
    let backendUrl = process.env.BACKEND_URL;
    if (!backendUrl) {
      const host = req.get('host');
      const protocol = req.protocol;
      backendUrl = `${protocol}://${host}/api/stripe`;
    } else {
      backendUrl = backendUrl.endsWith('/api/stripe') ? backendUrl : `${backendUrl}/api/stripe`;
    }
    // Actually, I'll use the frontend URL to redirect back for refresh, but return should go to backend to save status
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      return_url: `${backendUrl.replace('/api/stripe', '')}/api/stripe/onboarding/complete?userId=${userId}`,
      refresh_url: `${backendUrl.replace('/api/stripe', '')}/api/stripe/onboarding/refresh?userId=${userId}`,
      type: 'account_onboarding',
    });

    res.json({ success: true, url: accountLink.url });
  } catch (error) {
    console.error('❌ Stripe Onboarding Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});




// ✅ STRIPE CONNECT - Onboarding Complete
app.get('/api/stripe/onboarding/complete', async (req, res) => {
  if (!stripe) {
    return res.status(503).send('Payment service not configured');
  }
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).send('Missing userId');

    const user = await queryOne(`SELECT id, email, stripe_connect_account_id FROM public.profiles WHERE id = $1`, [userId]);
    if (!user || !user.stripe_connect_account_id)
      return res.status(404).send('User or Stripe account not found');

    const account = await stripe.accounts.retrieve(user.stripe_connect_account_id);

    // ✅ Check onboarding completion - more lenient for initial linking
    const verified = account.details_submitted || (account.charges_enabled && account.payouts_enabled);

    await queryOne(`UPDATE public.profiles SET stripe_verified = $2, updated_at = NOW() WHERE id = $1 RETURNING id`, [userId, verified]);

    console.log(`✅ Stripe onboarding completed for user ${user.email} (Verified: ${verified})`);

    // Detect frontend URL dynamically if not in production
    let frontendUrl = process.env.FRONTEND_URL;
    if (!frontendUrl) {
      const referer = req.headers.referer || '';
      if (referer.includes('localhost') || referer.includes('127.0.0.1')) {
        frontendUrl = 'http://localhost:5173';
      } else {
        frontendUrl = 'https://sendwithbago.com';
      }
    }
    const redirectUrl = `${frontendUrl}/dashboard?stripe=success`;

    res.send(`
       <!DOCTYPE html>
       <html>
         <head>
           <meta charset="utf-8">
           <meta name="viewport" content="width=device-width, initial-scale=1">
           <title>Bago — Onboarding Complete</title>
           <style>
             @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
             body {
               font-family: 'Inter', system-ui, sans-serif;
               background-color: #F8F6F3;
               margin: 0;
               display: flex;
               align-items: center;
               justify-content: center;
               height: 100vh;
               color: #054752;
             }
             .card {
               background: white;
               padding: 48px;
               border-radius: 32px;
               box-shadow: 0 20px 50px rgba(5, 71, 82, 0.05);
               max-width: 480px;
               width: 90%;
               text-align: center;
               border: 1px solid rgba(5, 71, 82, 0.05);
             }
             .logo {
               height: 48px;
               margin-bottom: 32px;
             }
             .icon-circle {
               width: 80px;
               height: 80px;
               background: #ECFDED;
               color: #16A34A;
               border-radius: 50%;
               display: flex;
               align-items: center;
               justify-content: center;
               font-size: 40px;
               margin: 0 auto 24px;
             }
             h1 {
               font-size: 24px;
               font-weight: 800;
               margin: 0 0 12px;
               color: #054752;
             }
             p {
               font-size: 16px;
               color: #708c91;
               margin: 0 0 32px;
               line-height: 1.6;
             }
             .btn {
               background: #5845D8;
               color: white;
               text-decoration: none;
               padding: 16px 32px;
               border-radius: 16px;
               font-weight: 700;
               display: block;
               transition: transform 0.2s;
               cursor: pointer;
               border: none;
             }
             .btn:active { transform: scale(0.98); }
           </style>
         </head>
         <body>
           <div class="card">
             <img src="https://res.cloudinary.com/dmito8es3/image/upload/v1761919738/Bago_New_2_gh1gmn.png" class="logo" alt="Bago">
             <div class="icon-circle">✓</div>
             <h1>Payout Settings Enabled</h1>
             <p>Your Stripe account has been linked successfully. You can now receive payouts from your earnings.</p>
             <button onclick="window.location.href='${redirectUrl}'" class="btn">Return to Bago</button>
           </div>
           <script>
              setTimeout(() => {
                window.location.href = '${redirectUrl}';
              }, 3000);
           </script>
         </body>
       </html>
     `);

  } catch (error) {
    console.error('❌ Stripe Onboarding Complete Error:', error);
    res.status(500).send('Error completing onboarding.');
  }
});


// ⚠️ STRIPE CONNECT - Onboarding Refresh (expired/cancelled)
app.get('/api/stripe/onboarding/refresh', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).send('Missing userId');

    const user = await queryOne(`SELECT id, email FROM public.profiles WHERE id = $1`, [userId]);
    if (!user) return res.status(404).send('User not found');

    await queryOne(`UPDATE public.profiles SET stripe_verified = false, updated_at = NOW() WHERE id = $1 RETURNING id`, [userId]);

    console.log(`⚠️ Stripe onboarding refresh triggered for user ${user.email}`);

    res.send(`
       <!DOCTYPE html>
       <html>
         <head>
           <meta charset="utf-8">
           <meta name="viewport" content="width=device-width, initial-scale=1">
           <title>Bago — Session Expired</title>
           <style>
             @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
             body {
               font-family: 'Inter', system-ui, sans-serif;
               background-color: #F8F6F3;
               margin: 0;
               display: flex;
               align-items: center;
               justify-content: center;
               height: 100vh;
               color: #054752;
             }
             .card {
               background: white;
               padding: 48px;
               border-radius: 32px;
               box-shadow: 0 20px 50px rgba(5, 71, 82, 0.05);
               max-width: 480px;
               width: 90%;
               text-align: center;
               border: 1px solid rgba(5, 71, 82, 0.05);
             }
             .logo {
               height: 48px;
               margin-bottom: 32px;
             }
             .icon-circle {
               width: 80px;
               height: 80px;
               background: #FEF2F2;
               color: #EF4444;
               border-radius: 50%;
               display: flex;
               align-items: center;
               justify-content: center;
               font-size: 40px;
               margin: 0 auto 24px;
             }
             h1 {
               font-size: 24px;
               font-weight: 800;
               margin: 0 0 12px;
               color: #054752;
             }
             p {
               font-size: 16px;
               color: #708c91;
               margin: 0 0 32px;
               line-height: 1.6;
             }
             .btn {
               background: #5845D8;
               color: white;
               text-decoration: none;
               padding: 16px 32px;
               border-radius: 16px;
               font-weight: 700;
               display: block;
               transition: transform 0.2s;
               cursor: pointer;
               border: none;
             }
             .btn:active { transform: scale(0.98); }
           </style>
         </head>
         <body>
           <div class="card">
             <img src="https://res.cloudinary.com/dmito8es3/image/upload/v1761919738/Bago_New_2_gh1gmn.png" class="logo" alt="Bago">
             <div class="icon-circle">!</div>
             <h1>Session Interrupted</h1>
             <p>The onboarding session expired or was cancelled. Your progress won't be saved until you complete the link.</p>
             <button onclick="window.close()" class="btn">Return to App</button>
           </div>
         </body>
       </html>
    `);
  } catch (error) {
    console.error('❌ Stripe Onboarding Refresh Error:', error);
    res.status(500).send('Error handling onboarding refresh.');
  }
});



// ✅ STRIPE CONNECT - Check Account Status & Save Verification
app.get('/api/stripe/connect/status/:userId', async (req, res) => {
  if (!stripe) {
    return res.status(503).json({ message: 'Payment service not configured' });
  }
  try {
    const { userId } = req.params;
    const user = await queryOne(`SELECT id, email, stripe_connect_account_id FROM public.profiles WHERE id = $1`, [userId]);
    if (!user?.stripe_connect_account_id)
      return res.status(400).json({ message: 'User not connected to Stripe' });

    const account = await stripe.accounts.retrieve(user.stripe_connect_account_id);

    // ✅ Save verification & payout status in DB
    const verified = account.charges_enabled && account.payouts_enabled;
    await queryOne(`UPDATE public.profiles SET stripe_verified = $2, updated_at = NOW() WHERE id = $1 RETURNING id`, [userId, verified]);

    res.json({
      success: true,
      verified,
      account,
    });
  } catch (error) {
    console.error('❌ Stripe Status Error:', error);
    res.status(500).json({ message: error.message });
  }
});

app.get('/', async (req, res) => {
  res.json({ success: true, message: "Bago API is running", version: "1.0.0" });
});

// ✅ STRIPE CONNECT - Platform Fee (10%) + Transfer to Traveller
app.post('/api/stripe/connect/transfer', async (req, res) => {
  if (!stripe) {
    return res.status(503).json({ message: 'Payment service not configured' });
  }
  try {
    const { userId, totalAmount } = req.body;
    if (!userId || !totalAmount)
      return res.status(400).json({ message: 'userId and totalAmount are required' });

    const user = await queryOne(
      `SELECT id, email, stripe_connect_account_id, available_balance FROM public.profiles WHERE id = $1`,
      [userId]
    );
    if (!user?.stripe_connect_account_id)
      return res.status(400).json({ message: 'User not connected to Stripe' });

    // Check if user has sufficient balance
    if ((user.available_balance || 0) < totalAmount) {
      return res.status(400).json({ message: 'Insufficient balance for withdrawal' });
    }

    // 10% platform fee → keep 10%, send 90%
    const amount = Math.round(Number(totalAmount) * 100);
    const userAmount = Math.round(amount * 0.9);
    const platformFee = amount - userAmount;

    const transfer = await stripe.transfers.create({
      amount: userAmount,
      currency: 'usd',
      destination: user.stripe_connect_account_id,
      description: `Traveller payout for ${user.email}`,
      metadata: { platformFee: (platformFee / 100).toFixed(2) },
    });

    // Deduct from user balance
    await queryOne(
      `UPDATE public.profiles SET available_balance = available_balance - $2, updated_at = NOW() WHERE id = $1 RETURNING id`,
      [userId, totalAmount]
    );

    res.json({
      success: true,
      message: `Transfer successful. Platform fee: $${(platformFee / 100).toFixed(2)}`,
      transfer,
    });
  } catch (error) {
    console.error('❌ Stripe Transfer Error:', error);
    res.status(500).json({ message: error.message });
  }
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
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});





// ✅ Register Token (legacy endpoint — also accepts userId in body for unauthenticated calls)
app.post('/api/bago/register-token', async (req, res) => {
  const { userId, token, deviceToken, pushToken } = req.body;
  const resolvedToken = token || deviceToken || pushToken;

  if (!userId || !resolvedToken) {
    return res.status(400).json({ error: 'userId and token required' });
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
app.post("/create-recipient", async (req, res) => {
  try {
    console.log('[server] /create-recipient called with body:', req.body);

    const { userId, name, account_number, bank_code } = req.body;
    if (!userId || !name || !account_number || !bank_code) {
      console.warn('[server] missing fields:', { userId, name, account_number, bank_code });
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const user = await queryOne(`SELECT id, email FROM public.profiles WHERE id = $1`, [userId]);
    if (!user) {
      console.warn('[server] user not found:', userId);
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const paystackBody = {
      type: "nuban",
      name,
      account_number,
      bank_code,
      currency: "NGN",
    };

    console.log('[server] sending to paystack:', paystackBody);

    // ensure headers include your Paystack secret
    const paystackHeaders = {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET}`,
      'Content-Type': 'application/json',
    };

    const resp = await fetch("https://api.paystack.co/transferrecipient", {
      method: "POST",
      headers: paystackHeaders,
      body: JSON.stringify(paystackBody),
    });

    const raw = await resp.text();
    console.log('[server] paystack HTTP status:', resp.status);
    console.log('[server] paystack raw response:', raw);

    let data;
    try {
      data = JSON.parse(raw);
    } catch (parseErr) {
      console.error('[server] failed to parse paystack response as JSON:', parseErr);
      return res.status(502).json({
        success: false,
        message: 'Invalid response from Paystack (not JSON).',
        raw: raw.slice(0, 1000),
      });
    }

    // If Paystack returned an error-like response
    if (!data.status) {
      console.warn('[server] paystack responded with failure:', data);
      return res.status(400).json({
        success: false,
        message: 'Paystack API error',
        paystack: data,
      });
    }

    // Save recipient code to user
    await queryOne(
      `UPDATE public.profiles SET paystack_recipient_code = $2, updated_at = NOW() WHERE id = $1 RETURNING id`,
      [userId, data.data.recipient_code]
    );

    // Return a consistent payload to client — include both shapes so client can handle either
    return res.json({
      success: true,
      status: true,
      recipient: data.data, // recipient resource from paystack
    });
  } catch (err) {
    console.error('[server] create-recipient exception:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});



app.post("/send-otp", async (req, res) => {
  try {
    console.log("📩 Incoming /send-otp request with body:", req.body);

    const { userId } = req.body;
    if (!userId) {
      console.warn("⚠️ No userId provided in body");
      return res.status(400).json({ success: false, message: "userId required" });
    }

    const user = await queryOne(`SELECT id, email, first_name FROM public.profiles WHERE id = $1`, [userId]);
    console.log("🔍 Found user:", user ? user.email : "No user found");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min validity
    console.log("🧮 Generated OTP:", otp, "expires at:", expiresAt);

    await queryOne(
      `UPDATE public.profiles SET otp_code = $2, otp_expires_at = $3, updated_at = NOW() WHERE id = $1 RETURNING id`,
      [userId, otp, expiresAt]
    );
    console.log("💾 OTP saved for user:", user.email);

    // Check that resend instance exists
    if (!resend || !resend.emails?.send) {
      console.error("🚨 Resend instance not configured properly!");
      return res.status(500).json({ success: false, message: "Email service not configured" });
    }

    console.log("📤 Sending email to:", user.email);
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
            <td style="padding:24px 28px; text-align:center; background:linear-gradient(90deg,#5240E8 0%, #6B5CFF 100%);">
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
            <td style="padding:18px 24px; background:#fbfbfe; text-align:center; font-family:Arial, sans-serif; font-size:12px; color:#9ca3af;">
              <div style="max-width:520px; margin:0 auto;">
                <div style="margin-bottom:6px;">Need help? Visit our <a href="${process.env.FRONTEND_URL || '#'}" style="color:#5240E8; text-decoration:none;">Help Center</a>.</div>
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


    const emailResponse = await resend.emails.send({
      from: "Bago <no-reply@sendwithbago.com>",
      to: user.email,
      subject: "Your Withdrawal OTP Code",
      html
    });


    console.log("📨 Email API response:", emailResponse);

    res.json({ success: true, message: "OTP sent to email", debug: emailResponse });
  } catch (err) {
    console.error("❌ send-otp error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});





app.post("/verify-otp", async (req, res) => {
  try {
    const { userId, code, amount } = req.body;
    const user = await queryOne(
      `SELECT id, otp_code, otp_expires_at, paystack_recipient_code FROM public.profiles WHERE id = $1`,
      [userId]
    );

    if (!user || !user.otp_code)
      return res.status(400).json({ success: false, message: "OTP not found" });

    if (new Date() > new Date(user.otp_expires_at))
      return res.status(400).json({ success: false, message: "OTP expired" });

    if (user.otp_code !== code)
      return res.status(400).json({ success: false, message: "Invalid OTP" });

    // OTP is valid → clear it
    await queryOne(
      `UPDATE public.profiles SET otp_code = NULL, otp_expires_at = NULL, updated_at = NOW() WHERE id = $1 RETURNING id`,
      [userId]
    );

    // Proceed to Paystack transfer
    if (!user.paystack_recipient_code)
      return res.status(400).json({ success: false, message: "Recipient not set up" });

    const otpPaystackHeaders = {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET}`,
      'Content-Type': 'application/json',
    };

    const resp = await fetch("https://api.paystack.co/transfer", {
      method: "POST",
      headers: otpPaystackHeaders,
      body: JSON.stringify({
        source: "balance",
        reason: "User withdrawal",
        amount: Math.round(amount * 100),
        recipient: user.paystack_recipient_code,
      }),
    });

    const data = await resp.json();
    if (!data.status) {
      return res.status(400).json({ success: false, message: data.message });
    }

    res.json({ success: true, message: "Withdrawal successful", data: data.data });
  } catch (err) {
    console.error("verify-otp error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});





// -----------------------------
// 3️⃣  INITIATE TRANSFER (PAYOUT)
// -----------------------------
app.post("/transfer", async (req, res) => {
  try {
    const { userId, amount, reason = "Wallet Payout" } = req.body;
    if (!userId || !amount)
      return res.status(400).json({ success: false, message: "userId and amount required" });

    const user = await queryOne(
      `SELECT id, paystack_recipient_code FROM public.profiles WHERE id = $1`,
      [userId]
    );
    if (!user?.paystack_recipient_code)
      return res.status(400).json({ success: false, message: "Recipient not created yet" });

    const sendAmount = toKobo(amount);

    const transferBody = {
      source: "balance",
      amount: sendAmount,
      recipient: user.paystack_recipient_code,
      reason,
      currency: "NGN",
    };

    const transferHeaders = {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET}`,
      'Content-Type': 'application/json',
    };

    const resp = await fetch("https://api.paystack.co/transfer", {
      method: "POST",
      headers: transferHeaders,
      body: JSON.stringify(transferBody),
    });

    const data = await resp.json();
    if (!data.status)
      return res.status(400).json({ success: false, message: data.message, data });

    res.json({ success: true, transfer: data.data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// -----------------------------
// 4️⃣  FINALIZE TRANSFER (if OTP enabled)
// -----------------------------
app.post("/transfer/finalize", async (req, res) => {
  try {
    const { transfer_code, otp } = req.body;
    if (!transfer_code || !otp)
      return res.status(400).json({ success: false, message: "transfer_code and otp required" });

    const resp = await fetch("https://api.paystack.co/transfer/finalize_transfer", {
      method: "POST",
      headers,
      body: JSON.stringify({ transfer_code, otp }),
    });

    const data = await resp.json();
    if (!data.status)
      return res.status(400).json({ success: false, message: data.message, data });

    res.json({ success: true, transfer: data.data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// -----------------------------
// 5️⃣  CHECK BALANCE
// -----------------------------
app.get("/balance", async (req, res) => {
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

// ============================================
// DIDIT.ME KYC VERIFICATION ROUTES
// ============================================
const DIDIT_API_KEY = process.env.DIDIT_API_KEY;
const DIDIT_WORKFLOW_ID = '701347c6-bd51-4ab7-8a35-8a442db4b63c';
const DIDIT_WEBHOOK_SECRET = process.env.DIDIT_WEBHOOK_SECRET;

// Create DIDIT verification session - PROTECTED ROUTE
app.post("/api/bago/kyc/create-session", isAuthenticated, async (req, res) => {
  try {
    // User is authenticated via Bearer token - req.user is populated
    const user = req.user;

    if (!user) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }

    // Check if user already has approved KYC
    if (user.kycStatus === 'approved') {
      return res.status(200).json({
        success: true,
        message: "KYC already approved",
        status: 'approved'
      });
    }

    const callbackUrl = `${process.env.BASE_URL || 'https://neringa.onrender.com'}/api/didit/webhook`;

    // Create session with DIDIT API - include userId in vendor_data as JSON
    const vendorData = JSON.stringify({
      userId: user._id.toString(),
      email: user.email
    });

    console.log("📝 Creating DIDIT session for user:", user._id.toString(), "email:", user.email);
    console.log("📝 Callback URL:", callbackUrl);

    const response = await fetch('https://verification.didit.me/v3/session/', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'x-api-key': DIDIT_API_KEY,
      },
      body: JSON.stringify({
        workflow_id: DIDIT_WORKFLOW_ID,
        vendor_data: vendorData,
        callback: callbackUrl,
      }),
    });

    const data = await response.json();
    console.log("📥 DIDIT Response:", data);

    if (response.ok && data.session_id) {
      // Store session ID in user record
      await pgQuery(
        `UPDATE public.profiles
         SET didit_session_id = $2, didit_session_token = $3, kyc_status = 'pending', updated_at = NOW()
         WHERE id = $1`,
        [user.id, data.session_id, data.session_token || null]
      );

      console.log("✅ DIDIT session created:", data.session_id);

      return res.json({
        success: true,
        sessionId: data.session_id,
        sessionToken: data.session_token,
        sessionUrl: data.url,
        message: "Verification session created"
      });
    }

    // API call failed
    console.error("❌ DIDIT API Error:", data);
    return res.status(400).json({
      success: false,
      message: data.detail || data.message || "Failed to create verification session",
      error: data
    });
  } catch (err) {
    console.error("❌ DIDIT KYC error:", err.message);
    res.status(500).json({ success: false, message: "Failed to create KYC session", error: err.message });
  }
});

// DIDIT webhook callback - handles verification completion events
app.post("/api/bago/kyc/callback", async (req, res) => {
  console.log("📥 DIDIT Callback received (old endpoint):", req.body);
  // Redirect to new webhook endpoint
  res.status(200).json({ success: true, message: "Please use /api/didit/webhook" });
});

// ============================================
// DIDIT.ME WEBHOOK ENDPOINT (ENHANCED KYC ENFORCEMENT)
// ============================================
// This is the main webhook endpoint that DIDIT calls when verification is complete
// Implements: Data Matching, Identity Fingerprinting, Profile Overwrite

/**
 * Generate identity fingerprint for duplicate detection
 * Hash of: documentNumber + issuingCountry + dateOfBirth
 */
function generateIdentityFingerprint(documentNumber, issuingCountry, dateOfBirth) {
  if (!documentNumber || !issuingCountry || !dateOfBirth) {
    return null;
  }
  const dobString = new Date(dateOfBirth).toISOString().split('T')[0]; // YYYY-MM-DD
  const data = `${documentNumber.toUpperCase().trim()}|${issuingCountry.toUpperCase().trim()}|${dobString}`;
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Compare names with fuzzy matching tolerance
 * Returns true if names match closely enough
 */
function compareNames(name1, name2) {
  if (!name1 || !name2) return false;

  // Normalize: lowercase, trim, remove extra spaces
  const normalize = (str) => str.toLowerCase().trim().replace(/\s+/g, ' ');
  const n1 = normalize(name1);
  const n2 = normalize(name2);

  // Exact match
  if (n1 === n2) return true;

  // Check if one contains the other (for partial names)
  if (n1.includes(n2) || n2.includes(n1)) return true;

  // Compare individual words (at least 2 words should match for full names)
  const words1 = n1.split(' ');
  const words2 = n2.split(' ');
  const matchingWords = words1.filter(w => words2.includes(w));

  // If at least 2 words match, consider it a match
  if (matchingWords.length >= 2) return true;

  // If it's a short name (1 word), require exact match
  if (words1.length === 1 || words2.length === 1) {
    return words1[0] === words2[0];
  }

  return false;
}

/**
 * Compare dates with tolerance for timezone differences
 */
function compareDates(date1, date2) {
  if (!date1 || !date2) return false;

  const d1 = new Date(date1);
  const d2 = new Date(date2);

  // Compare year, month, day only (ignore time)
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();
}

app.get("/api/didit/webhook", (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || 'https://sendwithbago.com';
  // Redirect back to dashboard, optionally with a check flag
  res.redirect(`${frontendUrl}/dashboard?kyc_check=true`);
});

app.post("/api/didit/webhook", async (req, res) => {
  try {
    console.log("📥 DIDIT WEBHOOK RECEIVED");

    const { session_id, status, vendor_data, document_data, extracted_data, verification_data, kyc_data } = req.body;

    if (!session_id) {
      return res.status(200).json({ success: false, message: "No session_id" });
    }

    // Parse vendor_data to extract userId/email
    let userId = null;
    let userEmail = null;
    try {
      const parsed = JSON.parse(vendor_data);
      userId = parsed.userId;
      userEmail = parsed.email;
    } catch (_) {
      userEmail = vendor_data;
    }

    // Find user in Postgres
    let user = null;
    if (userId) {
      user = await queryOne(`SELECT * FROM public.profiles WHERE id = $1`, [userId]);
    }
    if (!user && userEmail) {
      user = await queryOne(`SELECT * FROM public.profiles WHERE lower(email) = lower($1)`, [userEmail]);
    }
    if (!user) {
      user = await queryOne(`SELECT * FROM public.profiles WHERE didit_session_id = $1`, [session_id]);
    }
    if (!user) {
      console.log("❌ User not found for webhook - session:", session_id);
      return res.status(200).json({ success: false, message: "User not found" });
    }

    console.log("👤 Found user:", user.id, user.email, "| current KYC:", user.kyc_status, "| DIDIT status:", status);

    const normalizedStatus = status?.toLowerCase();
    const pgUserId = user.id;

    // Helper: save KYC update to Postgres
    const saveKyc = async (fields) => {
      const keys = Object.keys(fields);
      const sets = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
      const vals = keys.map(k => fields[k]);
      await queryOne(`UPDATE public.profiles SET ${sets}, updated_at = NOW() WHERE id = $1`, [pgUserId, ...vals]);
    };

    // Helper: save notification to Postgres
    const saveNotification = async (title, message) => {
      await queryOne(
        `INSERT INTO public.notifications (user_id, title, body, type) VALUES ($1, $2, $3, 'kyc')`,
        [pgUserId, title, message]
      ).catch(() => {});
    };

    if (normalizedStatus === 'approved') {
      const docData = document_data || extracted_data || verification_data || kyc_data || {};
      const verifiedFullName = (docData.full_name || docData.name || docData.fullName ||
        `${docData.first_name || docData.firstName || ''} ${docData.last_name || docData.lastName || ''}`.trim()) || '';
      const verifiedFirstName = docData.first_name || docData.firstName || docData.given_name || verifiedFullName.split(' ')[0] || '';
      const verifiedLastName = docData.last_name || docData.lastName || docData.surname || docData.family_name || verifiedFullName.split(' ').slice(1).join(' ') || '';
      const verifiedDOB = docData.date_of_birth || docData.dateOfBirth || docData.dob || docData.birth_date || null;
      const documentNumber = docData.document_number || docData.documentNumber || docData.doc_number || docData.id_number || null;
      const documentType = docData.document_type || docData.documentType || docData.doc_type || 'ID';
      const issuingCountry = docData.issuing_country || docData.issuingCountry || docData.country || docData.nationality || null;

      // STEP 1: Name & DOB matching
      const isGoogleUser = user.signup_method === 'google';
      const userFullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
      let nameMatches = true, dobMatches = true, matchFailureReason = null;

      if (!isGoogleUser && verifiedFullName && userFullName) {
        nameMatches = compareNames(verifiedFullName, userFullName);
        if (!nameMatches) matchFailureReason = `Name mismatch: Document shows "${verifiedFullName}" but signup name is "${userFullName}"`;
      }
      if (verifiedDOB && user.date_of_birth) {
        dobMatches = compareDates(verifiedDOB, user.date_of_birth);
        if (!dobMatches) matchFailureReason = (matchFailureReason ? matchFailureReason + '. ' : '') + 'Date of birth mismatch';
      }

      if (!nameMatches || !dobMatches) {
        console.log("❌ KYC REJECTED - data mismatch");
        await saveKyc({
          kyc_status: 'failed_verification',
          kyc_failure_reason: matchFailureReason || 'Document data does not match signup information',
          kyc_verified_data: JSON.stringify({ verificationStatus: 'mismatch', verifiedFullName }),
        });
        await sendPushNotification(pgUserId, 'Verification Issue', 'Your identity document does not match your signup information. Please update your profile and try again.').catch(() => {});
        await saveNotification('Verification Failed - Data Mismatch', 'Your identity document information does not match your profile. Please ensure your name and date of birth are correct, then try again.');
        return res.status(200).json({ success: true, message: "KYC rejected - data mismatch", kycStatus: 'failed_verification' });
      }

      // STEP 2: Duplicate identity check
      if (documentNumber && issuingCountry && verifiedDOB) {
        const fingerprint = generateIdentityFingerprint(documentNumber, issuingCountry, verifiedDOB);
        const duplicate = await queryOne(
          `SELECT id FROM public.profiles WHERE identity_fingerprint = $1 AND id != $2`,
          [fingerprint, pgUserId]
        );
        if (duplicate) {
          console.log("❌ DUPLICATE IDENTITY for user:", pgUserId);
          await saveKyc({
            kyc_status: 'blocked_duplicate',
            kyc_failure_reason: 'This identity document has already been used to verify another account',
            kyc_verified_data: JSON.stringify({ verificationStatus: 'duplicate_blocked' }),
          });
          await sendPushNotification(pgUserId, 'Verification Blocked', 'This identity document has already been used for another account.').catch(() => {});
          await saveNotification('Verification Blocked', 'This identity document has already been used to verify another Bago account. Contact support if you believe this is an error.');
          return res.status(200).json({ success: true, message: "KYC blocked - duplicate identity", kycStatus: 'blocked_duplicate' });
        }
        // Store fingerprint
        await queryOne(`UPDATE public.profiles SET identity_fingerprint = $1 WHERE id = $2`, [fingerprint, pgUserId]);
      }

      // STEP 3: Approve
      console.log("✅ All checks passed - APPROVING KYC for user:", pgUserId);
      const updateFields = {
        kyc_status: 'approved',
        kyc_verified_at: new Date(),
        kyc_failure_reason: null,
        kyc_verified_data: JSON.stringify({
          fullName: verifiedFullName, firstName: verifiedFirstName, lastName: verifiedLastName,
          dateOfBirth: verifiedDOB || null, documentNumber, documentType, issuingCountry,
          verificationStatus: 'approved',
        }),
      };
      if (verifiedFirstName) updateFields.first_name = verifiedFirstName;
      if (verifiedLastName) updateFields.last_name = verifiedLastName;
      if (verifiedDOB) updateFields.date_of_birth = new Date(verifiedDOB);
      await saveKyc(updateFields);

      await sendPushNotification(pgUserId, 'Identity Verified!', 'Your identity has been verified. You now have full access to all Bago features.').catch(() => {});
      await saveNotification('Identity Verified', 'Your identity has been successfully verified. You now have full access to send packages and earn as a traveler!');

      return res.status(200).json({ success: true, message: "KYC approved successfully", kycStatus: 'approved' });

    } else if (normalizedStatus === 'declined' || normalizedStatus === 'rejected') {
      console.log("❌ KYC DECLINED by DIDIT for user:", pgUserId);
      await saveKyc({ kyc_status: 'declined', kyc_failure_reason: 'Document verification was declined by the verification provider' });
      await sendPushNotification(pgUserId, 'Verification Unsuccessful', 'We could not verify your identity. Please try again with valid, clear documents.').catch(() => {});
      await saveNotification('Verification Unsuccessful', 'We could not verify your identity documents. Please ensure documents are valid and clearly visible, then try again.');

    } else if (['pending', 'processing', 'submitted'].includes(normalizedStatus)) {
      await saveKyc({ kyc_status: 'pending' });
      console.log("⏳ KYC PENDING for user:", pgUserId);
    }

    res.status(200).json({ success: true, message: "KYC webhook processed", userId: pgUserId, kycStatus: normalizedStatus });

  } catch (err) {
    console.error("❌ DIDIT webhook error:", err.message, err.stack);
    res.status(200).json({ success: false, message: "Webhook processing error", error: err.message });
  }
});

// Get KYC status - PROTECTED ROUTE
app.get("/api/bago/kyc/status", isAuthenticated, async (req, res) => {
  try {
    // User is authenticated via Bearer token
    const user = req.user;
    const previousStatus = user.kycStatus;

    // If user has a DIDIT session and status is pending, check actual DIDIT status
    if (user.diditSessionId && user.kycStatus === 'pending') {
      try {
        const diditResponse = await fetch(`https://verification.didit.me/v3/session/${user.diditSessionId}`, {
          method: 'GET',
          headers: {
            'accept': 'application/json',
            'x-api-key': DIDIT_API_KEY,
          },
        });

        if (diditResponse.ok) {
          const diditData = await diditResponse.json();
          const diditStatus = diditData.status?.toLowerCase();

          console.log(`📋 DIDIT session ${user.diditSessionId} status: ${diditStatus}`);

          // Sync DIDIT status to our database
          if (diditStatus === 'approved') {
            await queryOne(
              `UPDATE public.profiles SET kyc_status = 'approved', kyc_verified_at = NOW(), updated_at = NOW() WHERE id = $1 RETURNING id`,
              [user.id]
            );
            user.kycStatus = 'approved'; // update local object so response is correct
            console.log(`✅ User ${user.email} KYC auto-approved from DIDIT`);

            if (previousStatus !== 'approved') {
              await sendPushNotification(user.id, '🎉 Identity Verified!', 'Your identity has been verified. You now have full access to all Bago features.', { type: 'kyc_approved' }).catch(() => {});
              await pgQuery(
                `INSERT INTO public.notifications (user_id, title, message, type, read, created_at) VALUES ($1,$2,$3,'kyc',false,NOW())`,
                [user.id, 'Identity Verified', 'Your identity has been successfully verified.']
              ).catch(() => {});
            }

          } else if (diditStatus === 'declined') {
            await queryOne(
              `UPDATE public.profiles SET kyc_status = 'declined', updated_at = NOW() WHERE id = $1 RETURNING id`,
              [user.id]
            );
            user.kycStatus = 'declined';
            console.log(`❌ User ${user.email} KYC declined from DIDIT`);

            if (previousStatus !== 'declined') {
              await sendPushNotification(user.id, '⚠️ Verification Failed', 'Your identity verification was not successful. Please try again with valid documents.', { type: 'kyc_declined' }).catch(() => {});
              await pgQuery(
                `INSERT INTO public.notifications (user_id, title, message, type, read, created_at) VALUES ($1,$2,$3,'kyc',false,NOW())`,
                [user.id, 'Verification Failed', 'Your identity verification was declined. Please try again with clear, valid documents.']
              ).catch(() => {});
            }
          }
          // For 'created', 'started', 'submitted', 'processing' - keep as pending
        }
      } catch (diditErr) {
        console.log('Could not sync with DIDIT:', diditErr.message);
      }
    }

    res.json({
      success: true,
      email: user.email,
      kycStatus: user.kycStatus || 'not_started',
      kycVerifiedAt: user.kycVerifiedAt || null,
      sessionId: user.diditSessionId || null,
    });
  } catch (err) {
    console.error("❌ KYC status error:", err.message);
    res.status(500).json({ success: false, message: "Failed to get KYC status", error: err.message });
  }
});

// Check session status from DIDIT
app.get("/api/bago/kyc/check-session/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;

    const response = await fetch(`https://verification.didit.me/v3/session/${sessionId}`, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'x-api-key': DIDIT_API_KEY,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(400).json({ success: false, message: "Failed to check session", error: data });
    }

    res.json({ success: true, session: data });
  } catch (err) {
    console.error("❌ DIDIT session check error:", err.message);
    res.status(500).json({ success: false, message: "Failed to check session", error: err.message });
  }
});

// Admin: Manually approve KYC (for testing)
app.post("/api/bago/kyc/admin-approve", async (req, res) => {
  try {
    const { userId, adminKey } = req.body;

    // Simple admin key check (you should use proper admin auth)
    if (adminKey !== 'bago_admin_2024') {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

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
app.post("/api/bago/kyc/update-status", async (req, res) => {
  try {
    const userId = req.cookies.userId;
    const { status } = req.body;

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
app.get('/api/bago/push-diag/tokens', async (req, res) => {
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

app.post('/api/bago/push-diag/test', async (req, res) => {
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
