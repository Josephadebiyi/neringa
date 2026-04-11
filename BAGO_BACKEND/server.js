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
import User from './models/userScheme.js';
import { Notification } from './models/notificationScheme.js';
import { Resend } from 'resend';
import { startEscrowAutoRelease } from './cron/escrowCron.js'
import { assessShipment, filterCompatibleTrips, quickCompatibilityCheck } from './services/shipmentAssessment.js';
import { generateCustomsDeclarationPDF, generateShipmentSummaryPDF, generateShippingLabelPDF } from './services/pdfGenerator.js';
import Request from './models/RequestScheme.js';
import { sendPushNotificationToToken } from './services/pushNotificationService.js';


dotenv.config();

const app = express();
const httpServer = createServer(app);
app.disable('x-powered-by');

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
    origin: Array.from(allowedOrigins),
    methods: ['GET', 'POST'],
    credentials: true,
  },
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

    user.stripeConnectAccountId = account.id;
    await user.save();

    console.log(`✅ Created Stripe account ${account.id} for user ${user._id}`);
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
      if (!origin || allowedOrigins.has(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
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
    if (req.headers['content-type']?.includes('application/json') && typeof req.body !== 'object') {
      return res.status(400).json({ success: false, message: 'Malformed JSON payload.' });
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
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again in 15 minutes.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
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

// ✅ Explicit 404 handler so missing routes return JSON instead of crashing
app.use((req, res, next) => {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(404).json({
      success: false,
      message: 'Route not found',
    });
  }
  next();
});

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

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const stripeAccountId = await createStripeAccountForUser(user);

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

    const user = await User.findById(userId);
    if (!user || !user.stripeConnectAccountId)
      return res.status(404).send('User or Stripe account not found');

    const account = await stripe.accounts.retrieve(user.stripeConnectAccountId);

    // ✅ Check onboarding completion - more lenient for initial linking
    const verified = account.details_submitted || (account.charges_enabled && account.payouts_enabled);

    user.stripeVerified = verified;
    await user.save();

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

    const user = await User.findById(userId);
    if (!user) return res.status(404).send('User not found');

    user.stripeVerified = false;
    await user.save();

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
    const user = await User.findById(userId);
    if (!user?.stripeConnectAccountId)
      return res.status(400).json({ message: 'User not connected to Stripe' });

    const account = await stripe.accounts.retrieve(user.stripeConnectAccountId);

    // ✅ Save verification & payout status in DB
    user.stripeVerified = account.charges_enabled && account.payouts_enabled;
    await user.save();

    res.json({
      success: true,
      verified: user.stripeVerified,
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

    const user = await User.findById(userId);
    if (!user?.stripeConnectAccountId)
      return res.status(400).json({ message: 'User not connected to Stripe' });

    // Check if user has sufficient balance
    if (user.balance < totalAmount) {
      return res.status(400).json({ message: 'Insufficient balance for withdrawal' });
    }

    // 10% platform fee → keep 10%, send 90%
    const amount = Math.round(Number(totalAmount) * 100);
    const userAmount = Math.round(amount * 0.9);
    const platformFee = amount - userAmount;

    const transfer = await stripe.transfers.create({
      amount: userAmount,
      currency: 'usd',
      destination: user.stripeConnectAccountId,
      description: `Traveller payout for ${user.email}`,
      metadata: { platformFee: (platformFee / 100).toFixed(2) },
    });

    // Deduct from user balance and record history
    user.balance -= totalAmount;
    user.balanceHistory.push({
      type: 'withdrawal',
      amount: totalAmount,
      status: 'completed',
      description: `Withdrawal via Stripe Connect to account ${user.stripeConnectAccountId}`,
      date: new Date(),
    });
    await user.save();

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


// ✅ PRODUCTION NOTE: Frontend files should be served from separate hosting (Hostinger, Vercel, etc.)
// Backend on Render.com is API-only. Admin and webapp dist folders don't exist in git.
// Uncomment below only for local development if you want backend to serve frontend files.

// const adminDist = path.join(__dirname, '../ADMIN_NEW/dist');
// const clientDist = path.join(__dirname, '../BAGO_WEBAPP/dist');
// app.use('/admin', express.static(adminDist));
// app.use(express.static(clientDist));
// app.get(/^\/admin/, (req, res) => {
//   if (req.originalUrl === '/admin') return res.redirect(301, '/admin/');
//   res.sendFile(path.join(adminDist, 'index.html'));
// });
// app.get(/.*/, (req, res, next) => {
//   if (req.url.startsWith('/api') || req.url.startsWith('/admin')) return next();
//   res.sendFile(path.join(clientDist, 'index.html'));
// });

// ✅ Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});





// ✅ Register Token
app.post('/api/bago/register-token', async (req, res) => {
  const { userId, token } = req.body;

  if (!userId || !token) {
    return res.status(400).json({ error: 'userId and token required' });
  }

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!user.pushTokens) user.pushTokens = [];

    if (!user.pushTokens.includes(token)) {
      user.pushTokens.push(token);
      await user.save();
    }

    res.json({ success: true, message: 'Token registered successfully' });
  } catch (err) {
    console.error('Register token error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Notifications are now handled in AdminRouter via NotificationController


// Reuse the shared push transport so native APNs tokens and Expo tokens
// are handled consistently throughout the backend.
const sendPushNotification = sendPushNotificationToToken;






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

    const user = await User.findById(userId);
    if (!user) {
      console.warn('[server] user not found:', userId);
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const body = {
      type: "nuban",
      name,
      account_number,
      bank_code,
      currency: "NGN",
    };

    console.log('[server] sending to paystack:', body);

    // ensure headers include your Paystack secret
    const headers = {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET}`, // <-- make sure this exists
      'Content-Type': 'application/json',
    };

    const resp = await fetch("https://api.paystack.co/transferrecipient", {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const raw = await resp.text();
    console.log('[server] paystack HTTP status:', resp.status);
    console.log('[server] paystack raw response:', raw);

    let data;
    try {
      data = JSON.parse(raw);
    } catch (parseErr) {
      console.error('[server] failed to parse paystack response as JSON:', parseErr);
      // return useful info to client for debugging (but not secrets)
      return res.status(502).json({
        success: false,
        message: 'Invalid response from Paystack (not JSON).',
        raw: raw.slice(0, 1000), // trim long HTML for safety
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
    user.recipient_code = data.data.recipient_code;
    await user.save();

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

    const user = await User.findById(userId);
    console.log("🔍 Found user:", user ? user.email : "No user found");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min validity
    console.log("🧮 Generated OTP:", otp, "expires at:", expiresAt);

    user.otp = { code: otp, expiresAt };
    await user.save();
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
                Hi <strong style="color:#111827;">${user.name || "User"}</strong>,
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
    const user = await User.findById(userId);

    if (!user || !user.otp)
      return res.status(400).json({ success: false, message: "OTP not found" });

    const { otp } = user;
    const now = new Date();

    if (now > otp.expiresAt)
      return res.status(400).json({ success: false, message: "OTP expired" });

    if (otp.code !== code)
      return res.status(400).json({ success: false, message: "Invalid OTP" });

    // OTP is valid → clear it
    user.otp = undefined;
    await user.save();

    // Proceed to Paystack transfer
    if (!user.recipient_code)
      return res.status(400).json({ success: false, message: "Recipient not set up" });

    const resp = await fetch("https://api.paystack.co/transfer", {
      method: "POST",
      headers,
      body: JSON.stringify({
        source: "balance",
        reason: "User withdrawal",
        amount: Math.round(amount * 100),
        recipient: user.recipient_code,
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

    const user = await User.findById(userId);
    if (!user?.recipient_code)
      return res.status(400).json({ success: false, message: "Recipient not created yet" });

    const sendAmount = toKobo(amount);

    const body = {
      source: "balance",
      amount: sendAmount,
      recipient: user.recipient_code,
      reason,
      currency: "NGN",
    };

    const resp = await fetch("https://api.paystack.co/transfer", {
      method: "POST",
      headers,
      body: JSON.stringify(body),
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
      user.diditSessionId = data.session_id;
      user.diditSessionToken = data.session_token;
      user.kycStatus = 'pending';
      await user.save();

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
    console.log("=".repeat(60));
    console.log("📥 DIDIT WEBHOOK RECEIVED - ENHANCED KYC ENFORCEMENT");
    console.log("Headers:", JSON.stringify(req.headers, null, 2));
    console.log("Body:", JSON.stringify(req.body, null, 2));
    console.log("=".repeat(60));

    const {
      session_id,
      status,
      vendor_data,
      // Document data from DIDIT (may vary based on their API structure)
      document_data,
      extracted_data,
      verification_data,
      kyc_data,
    } = req.body;

    if (!session_id) {
      console.log("⚠️ No session_id in webhook payload");
      return res.status(200).json({ success: false, message: "No session_id" });
    }

    // Parse vendor_data to extract userId
    let userId = null;
    let userEmail = null;

    try {
      const parsed = JSON.parse(vendor_data);
      userId = parsed.userId;
      userEmail = parsed.email;
      console.log("📋 Parsed vendor_data - userId:", userId, "email:", userEmail);
    } catch (parseErr) {
      userEmail = vendor_data;
      console.log("📋 Using vendor_data as email:", userEmail);
    }

    // Find user
    let user = null;
    if (userId) {
      user = await User.findById(userId);
    }
    if (!user && userEmail) {
      user = await User.findOne({ email: userEmail });
    }
    if (!user) {
      user = await User.findOne({ diditSessionId: session_id });
    }

    if (!user) {
      console.log("❌ User not found for webhook - session:", session_id);
      return res.status(200).json({ success: false, message: "User not found" });
    }

    console.log("👤 Found user:", user._id.toString(), user.email);
    console.log("📋 Current kycStatus:", user.kycStatus, "New status from DIDIT:", status);

    const normalizedStatus = status?.toLowerCase();

    // Only process if DIDIT says approved - we add our own validation layer
    if (normalizedStatus === 'approved') {
      // Extract document data from various possible DIDIT payload structures
      const docData = document_data || extracted_data || verification_data || kyc_data || {};

      // Try to get document fields (DIDIT API structure may vary)
      const verifiedFullName = docData.full_name || docData.name || docData.fullName ||
        `${docData.first_name || docData.firstName || ''} ${docData.last_name || docData.lastName || ''}`.trim();
      const verifiedFirstName = docData.first_name || docData.firstName || docData.given_name || verifiedFullName?.split(' ')[0];
      const verifiedLastName = docData.last_name || docData.lastName || docData.surname || docData.family_name || verifiedFullName?.split(' ').slice(1).join(' ');
      const verifiedDOB = docData.date_of_birth || docData.dateOfBirth || docData.dob || docData.birth_date;
      const documentNumber = docData.document_number || docData.documentNumber || docData.doc_number || docData.id_number;
      const documentType = docData.document_type || docData.documentType || docData.doc_type || 'ID';
      const issuingCountry = docData.issuing_country || docData.issuingCountry || docData.country || docData.nationality;

      console.log("📄 Extracted Document Data:");
      console.log("   Full Name:", verifiedFullName);
      console.log("   First Name:", verifiedFirstName);
      console.log("   Last Name:", verifiedLastName);
      console.log("   DOB:", verifiedDOB);
      console.log("   Document #:", documentNumber);
      console.log("   Document Type:", documentType);
      console.log("   Issuing Country:", issuingCountry);

      // ============================================
      // STEP 1: DATA MATCHING (Name & DOB Verification)
      // Google users bypass name matching — their Google account name may differ
      // from their government ID. KYC-verified name will replace their profile name.
      // ============================================
      const isGoogleUser = user.signupMethod === 'google';
      const userFullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();

      let nameMatches = true;
      let dobMatches = true;
      let matchFailureReason = null;

      // Only enforce name matching for non-Google users
      if (!isGoogleUser && verifiedFullName && userFullName) {
        nameMatches = compareNames(verifiedFullName, userFullName);
        if (!nameMatches) {
          console.log(`⚠️ NAME MISMATCH: Document="${verifiedFullName}" vs Signup="${userFullName}"`);
          matchFailureReason = `Name mismatch: Document shows "${verifiedFullName}" but signup name is "${userFullName}"`;
        }
      } else if (isGoogleUser) {
        console.log(`ℹ️ Google user — skipping name match, will use KYC name: "${verifiedFullName}"`);
      }

      if (verifiedDOB && user.dateOfBirth) {
        dobMatches = compareDates(verifiedDOB, user.dateOfBirth);
        if (!dobMatches) {
          console.log(`⚠️ DOB MISMATCH: Document="${verifiedDOB}" vs Signup="${user.dateOfBirth}"`);
          if (matchFailureReason) {
            matchFailureReason += '. ';
          } else {
            matchFailureReason = '';
          }
          matchFailureReason += `Date of birth mismatch`;
        }
      }

      // If data doesn't match, reject the verification
      if (!nameMatches || !dobMatches) {
        console.log("❌ KYC REJECTED due to data mismatch");
        user.kycStatus = 'failed_verification';
        user.kycFailureReason = matchFailureReason || 'Document data does not match signup information';
        user.kycVerifiedData = {
          fullName: verifiedFullName,
          firstName: verifiedFirstName,
          lastName: verifiedLastName,
          dateOfBirth: verifiedDOB ? new Date(verifiedDOB) : null,
          documentNumber: documentNumber,
          documentType: documentType,
          issuingCountry: issuingCountry,
          verificationStatus: 'mismatch',
        };
        await user.save();

        // Notify user of failure
        if (user.pushTokens?.length > 0) {
          try {
            await sendPushNotification(
              user.pushTokens[0],
              '⚠️ Verification Issue',
              'Your identity document does not match your signup information. Please update your profile and try again.',
              { type: 'kyc_mismatch' }
            );
          } catch (pushErr) {
            console.log("⚠️ Failed to send push notification:", pushErr.message);
          }
        }

        await Notification.create({
          userId: user._id,
          title: 'Verification Failed - Data Mismatch',
          message: 'Your identity document information does not match your profile. Please ensure your name and date of birth are correct, then try verification again.',
          type: 'kyc',
          read: false,
        });

        return res.status(200).json({
          success: true,
          message: "KYC rejected - data mismatch",
          kycStatus: user.kycStatus,
        });
      }

      // ============================================
      // STEP 2: DUPLICATE IDENTITY PROTECTION
      // ============================================
      if (documentNumber && issuingCountry && verifiedDOB) {
        const fingerprint = generateIdentityFingerprint(documentNumber, issuingCountry, verifiedDOB);
        console.log("🔐 Generated identity fingerprint:", fingerprint?.substring(0, 16) + "...");

        // Check if this identity is already used by another account
        const existingUser = await User.findOne({
          identityFingerprint: fingerprint,
          _id: { $ne: user._id }, // Exclude current user
        });

        if (existingUser) {
          console.log(`❌ DUPLICATE IDENTITY DETECTED! Already used by user: ${existingUser._id}`);
          user.kycStatus = 'blocked_duplicate';
          user.kycFailureReason = 'This identity document has already been used to verify another account';
          user.kycVerifiedData = {
            fullName: verifiedFullName,
            firstName: verifiedFirstName,
            lastName: verifiedLastName,
            dateOfBirth: verifiedDOB ? new Date(verifiedDOB) : null,
            documentNumber: documentNumber,
            documentType: documentType,
            issuingCountry: issuingCountry,
            verificationStatus: 'duplicate_blocked',
          };
          await user.save();

          // Notify user
          if (user.pushTokens?.length > 0) {
            try {
              await sendPushNotification(
                user.pushTokens[0],
                '🚫 Verification Blocked',
                'This identity document has already been used for another account. Contact support if you believe this is an error.',
                { type: 'kyc_duplicate' }
              );
            } catch (pushErr) {
              console.log("⚠️ Failed to send push notification:", pushErr.message);
            }
          }

          await Notification.create({
            userId: user._id,
            title: 'Verification Blocked',
            message: 'This identity document has already been used to verify another Baggo account. If you believe this is an error, please contact our support team.',
            type: 'kyc',
            read: false,
          });

          return res.status(200).json({
            success: true,
            message: "KYC blocked - duplicate identity",
            kycStatus: user.kycStatus,
          });
        }

        // Store fingerprint for future duplicate checks
        user.identityFingerprint = fingerprint;
      }

      // ============================================
      // STEP 3: PROFILE OVERWRITE & APPROVAL
      // ============================================
      console.log("✅ All checks passed - APPROVING KYC");

      // Overwrite profile with verified document data
      if (verifiedFirstName) {
        user.firstName = verifiedFirstName;
      }
      if (verifiedLastName) {
        user.lastName = verifiedLastName;
      }
      if (verifiedDOB) {
        user.dateOfBirth = new Date(verifiedDOB);
      }

      // Store verified data for audit
      user.kycVerifiedData = {
        fullName: verifiedFullName,
        firstName: verifiedFirstName,
        lastName: verifiedLastName,
        dateOfBirth: verifiedDOB ? new Date(verifiedDOB) : null,
        documentNumber: documentNumber,
        documentType: documentType,
        issuingCountry: issuingCountry,
        verificationStatus: 'approved',
      };

      // Update KYC fields
      user.kycStatus = 'approved';
      user.kycVerifiedAt = new Date();
      user.kycFailureReason = null;
      user.status = 'verified';
      user.isVerified = true;
      user.kycVerifiedName = {
        firstName: verifiedFirstName || user.firstName,
        lastName: verifiedLastName || user.lastName,
        dateOfBirth: verifiedDOB ? new Date(verifiedDOB) : user.dateOfBirth,
      };

      await user.save();
      console.log("💾 User KYC APPROVED and profile updated");

      // Send success notification
      if (user.pushTokens?.length > 0) {
        try {
          await sendPushNotification(
            user.pushTokens[0],
            '✅ Identity Verified!',
            'Congratulations! Your identity has been verified. You now have full access to all Baggo features.',
            { type: 'kyc_approved' }
          );
          console.log("📱 Push notification sent for KYC approval");
        } catch (pushErr) {
          console.log("⚠️ Failed to send push notification:", pushErr.message);
        }
      }

      await Notification.create({
        userId: user._id,
        title: 'Identity Verified',
        message: 'Your identity has been successfully verified. You now have full access to send packages and earn as a traveler!',
        type: 'kyc',
        read: false,
      });

      return res.status(200).json({
        success: true,
        message: "KYC approved successfully",
        kycStatus: user.kycStatus,
      });

    } else if (normalizedStatus === 'declined' || normalizedStatus === 'rejected') {
      // DIDIT declined the verification
      user.kycStatus = 'declined';
      user.status = 'rejected';
      user.kycFailureReason = 'Document verification was declined by the verification provider';
      await user.save();

      console.log("❌ KYC DECLINED by DIDIT for user:", user.email);

      if (user.pushTokens?.length > 0) {
        try {
          await sendPushNotification(
            user.pushTokens[0],
            '❌ Verification Unsuccessful',
            'We could not verify your identity. Please try again with valid, clear documents.',
            { type: 'kyc_declined' }
          );
        } catch (pushErr) {
          console.log("⚠️ Failed to send push notification:", pushErr.message);
        }
      }

      await Notification.create({
        userId: user._id,
        title: 'Verification Unsuccessful',
        message: 'We could not verify your identity documents. Please ensure your documents are valid and clearly visible, then try again.',
        type: 'kyc',
        read: false,
      });

    } else if (normalizedStatus === 'pending' || normalizedStatus === 'processing' || normalizedStatus === 'submitted') {
      user.kycStatus = 'pending';
      await user.save();
      console.log("⏳ KYC PENDING for user:", user.email);
    }

    res.status(200).json({
      success: true,
      message: "KYC webhook processed",
      userId: user._id.toString(),
      kycStatus: user.kycStatus
    });

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
            user.kycStatus = 'approved';
            user.kycVerifiedAt = new Date();
            // Also sync with legacy status field for backward compatibility
            user.status = 'verified';
            user.isVerified = true;
            await user.save();
            console.log(`✅ User ${user.email} KYC auto-approved from DIDIT`);

            // Send push notification for KYC approval
            if (previousStatus !== 'approved' && user.pushTokens?.length > 0) {
              await sendPushNotification(
                user.pushTokens[0],
                '🎉 Identity Verified!',
                'Congratulations! Your identity has been verified. You now have full access to all Baggo features.',
                { type: 'kyc_approved' }
              );
            }

            // Create in-app notification
            await Notification.create({
              userId: user._id,
              title: 'Identity Verified',
              message: 'Your identity has been successfully verified. You now have full access to send packages and create trips.',
              type: 'kyc',
              read: false,
            });

          } else if (diditStatus === 'declined') {
            user.kycStatus = 'declined';
            await user.save();
            console.log(`❌ User ${user.email} KYC declined from DIDIT`);

            // Send push notification for KYC decline
            if (previousStatus !== 'declined' && user.pushTokens?.length > 0) {
              await sendPushNotification(
                user.pushTokens[0],
                '⚠️ Verification Failed',
                'Your identity verification was not successful. Please try again with valid documents.',
                { type: 'kyc_declined' }
              );
            }

            // Create in-app notification
            await Notification.create({
              userId: user._id,
              title: 'Verification Failed',
              message: 'Your identity verification was declined. Please try again with clear, valid documents.',
              type: 'kyc',
              read: false,
            });
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

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.kycStatus = 'approved';
    user.kycVerifiedAt = new Date();
    await user.save();

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

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.kycStatus = status;
    if (status === 'approved') {
      user.kycVerifiedAt = new Date();
    }
    await user.save();

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

    // Delete user's related data
    await Kyc.deleteMany({ userid: userId });

    // Delete the user
    await User.findByIdAndDelete(userId);

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

    user.preferredCurrency = currency;
    await user.save();

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

    // Get trip data
    const trip = await User.findOne(
      { "trips._id": tripId },
      { "trips.$": 1, firstName: 1, lastName: 1, rating: 1, completedTrips: 1, cancellations: 1 }
    );

    if (!trip || !trip.trips || !trip.trips[0]) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }

    const tripData = trip.trips[0];
    const traveler = {
      _id: trip._id,
      firstName: trip.firstName,
      lastName: trip.lastName,
      name: `${trip.firstName || ''} ${trip.lastName || ''}`.trim(),
      rating: trip.rating || 0,
      completedTrips: trip.completedTrips || 0,
      cancellations: trip.cancellations || 0
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

    // Add to user's shipment assessments (could also be a separate collection)
    await User.findByIdAndUpdate(req.user._id, {
      $push: {
        shipmentAssessments: {
          $each: [assessmentDoc],
          $slice: -50 // Keep last 50 assessments
        }
      }
    });

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

    // Get trip
    const tripDoc = await User.findOne(
      { "trips._id": tripId },
      { "trips.$": 1 }
    );

    if (!tripDoc || !tripDoc.trips || !tripDoc.trips[0]) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }

    const trip = tripDoc.trips[0];
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
    const { assessmentId } = req.params;
    const userId = req.user._id;

    // Find the assessment in user's history
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const assessment = user.shipmentAssessments?.find(
      a => a.declarationData?.shipmentId === assessmentId
    );

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: "Assessment not found. Please run assessment first."
      });
    }

    // Generate PDF
    const pdfBuffer = await generateCustomsDeclarationPDF(assessment.declarationData);

    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="customs-declaration-${assessmentId}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);

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

    // Build query
    const query = { "trips.0": { $exists: true } };

    // Get all users with trips
    const usersWithTrips = await User.find(query, {
      trips: 1,
      firstName: 1,
      lastName: 1,
      rating: 1,
      completedTrips: 1,
      cancellations: 1,
      kycStatus: 1,
      profileImage: 1
    });

    // Flatten and filter trips
    let allTrips = [];

    for (const user of usersWithTrips) {
      if (!user.trips) continue;

      for (const trip of user.trips) {
        // Basic route matching
        const matchesRoute = (
          (!fromCountry || trip.fromCountry?.toLowerCase().includes(fromCountry.toLowerCase())) &&
          (!toCountry || trip.toCountry?.toLowerCase().includes(toCountry.toLowerCase())) &&
          (!fromCity || trip.from?.toLowerCase().includes(fromCity.toLowerCase())) &&
          (!toCity || trip.to?.toLowerCase().includes(toCity.toLowerCase()))
        );

        if (!matchesRoute) continue;

        // Check compatibility
        const compatibility = quickCompatibilityCheck(trip, item);

        if (compatibility.compatible) {
          allTrips.push({
            ...trip.toObject(),
            travelerId: user._id,
            travelerName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
            travelerRating: user.rating || 0,
            travelerCompletedTrips: user.completedTrips || 0,
            travelerKycStatus: user.kycStatus,
            travelerImage: user.profileImage,
            compatibility: 'Yes',
            compatibilityReason: compatibility.reason
          });
        }
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
  try {
    const user = await User.findById(req.user._id, { shipmentAssessments: 1 });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const assessments = user.shipmentAssessments || [];

    res.json({
      success: true,
      count: assessments.length,
      assessments: assessments.slice(-20).reverse() // Last 20, newest first
    });

  } catch (err) {
    console.error("❌ Get assessment history error:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to get assessment history",
      error: err.message
    });
  }
});

/**
 * Generate and download shipping label PDF
 * GET /api/shipping/label/:requestId
 */
app.get("/api/shipping/label/:requestId", isAuthenticated, async (req, res) => {
  try {
    const { requestId } = req.params;

    const request = await Request.findById(requestId)
      .populate('sender', 'firstName lastName email phone')
      .populate('traveler', 'firstName lastName email')
      .populate('package')
      .populate('trip', 'travelMeans departureDate arrivalDate');

    if (!request) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }

    // Verify user is sender or traveler
    const userId = req.user._id.toString();
    if (request.sender._id.toString() !== userId && request.traveler._id.toString() !== userId) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    // Map data for PDF generation with safe fallbacks
    const shippingData = {
      sender: {
        name: request.sender?.firstName ? `${request.sender.firstName} ${request.sender.lastName || ''}`.trim() : 'Sender',
        phone: request.sender?.phone || ''
      },
      traveler: {
        name: request.traveler?.firstName ? `${request.traveler.firstName} ${request.traveler.lastName || ''}`.trim() : 'Traveler'
      },
      package: request.package || {},
      trackingNumber: request.trackingNumber || 'BGO-PENDING',
      status: request.status || 'pending',
      estimatedDeparture: request.estimatedDeparture || request.trip?.departureDate,
      estimatedArrival: request.estimatedArrival || request.trip?.arrivalDate,
      insurance: request.insurance || false,
      insuranceCost: request.insuranceCost || 0,
      amount: request.amount || 0,
      currency: request.currency || 'USD',
      trip: {
        travelMeans: request.trip?.travelMeans || 'N/A'
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
