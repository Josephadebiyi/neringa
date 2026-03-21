# Bago Mobile V2 - Setup Checklist

## ✅ Completed - Mobile App

### Frontend Architecture
- [x] Expo SDK 55 with React Native 0.83.2
- [x] File-based routing with Expo Router
- [x] NativeWind 4.2 + Tailwind CSS for styling
- [x] TypeScript for type safety
- [x] Modern UI with purple branding (#5845D8)

### Core Features Implemented
- [x] Welcome screen with onboarding
- [x] Authentication screens (Sign In, Sign Up)
- [x] Tab navigation (Home, Packages, Tracking, Profile)
- [x] Push notifications integration
- [x] Biometric authentication (Face ID/Touch ID/Fingerprint)
- [x] File upload support with progress tracking

### Backend Integration Layer
- [x] **API Service** - Axios HTTP client with auth interceptors
- [x] **Auth Service** - Login, register, Google OAuth, KYC, profile management
- [x] **Payment Service** - Stripe integration with wallet and withdrawals
- [x] **Package Service** - CRUD operations, tracking, traveler search
- [x] **Trip Service** - Trip management and package requests
- [x] **Message Service** - Real-time messaging with file attachments
- [x] **Tracking Service** - GPS tracking and delivery proof
- [x] **Auth Context** - Global state management
- [x] Environment configuration system
- [x] Secure token storage with auto-refresh
- [x] Complete documentation (BACKEND_INTEGRATION.md)

### Dependencies Installed
- [x] axios@1.13.6
- [x] @stripe/stripe-react-native@0.59.2
- [x] @supabase/supabase-js@2.99.3 (optional)
- [x] react-native-dotenv@3.5.1
- [x] expo-notifications
- [x] expo-local-authentication
- [x] expo-secure-store

## ⏳ Pending - Backend Development

### 1. Backend API Setup

You need to create a backend API that implements these endpoints:

#### Authentication Endpoints
- [ ] `POST /api/auth/register` - User registration
- [ ] `POST /api/auth/login` - User login
- [ ] `POST /api/auth/logout` - User logout
- [ ] `POST /api/auth/refresh` - Refresh access token
- [ ] `GET /api/auth/me` - Get current user
- [ ] `PUT /api/auth/profile` - Update user profile
- [ ] `POST /api/auth/upload-avatar` - Upload avatar
- [ ] `POST /api/auth/google` - Google Sign In
- [ ] `POST /api/auth/forgot-password` - Password reset request
- [ ] `POST /api/auth/reset-password` - Reset password
- [ ] `POST /api/auth/verify-email` - Email verification
- [ ] `POST /api/auth/kyc/submit` - Submit KYC documents
- [ ] `GET /api/auth/kyc/status` - Get KYC status

#### Package Endpoints
- [ ] `GET /api/packages` - List all packages
- [ ] `POST /api/packages` - Create new package
- [ ] `GET /api/packages/:id` - Get package details
- [ ] `PUT /api/packages/:id` - Update package
- [ ] `DELETE /api/packages/:id` - Delete package
- [ ] `GET /api/packages/my-packages` - Get user's packages
- [ ] `GET /api/packages/track/:trackingNumber` - Track package
- [ ] `GET /api/packages/:id/tracking` - Get tracking history
- [ ] `POST /api/packages/:id/location` - Update location
- [ ] `POST /api/packages/:id/pickup` - Mark as picked up
- [ ] `POST /api/packages/:id/deliver` - Mark as delivered
- [ ] `POST /api/packages/:id/report` - Report issue
- [ ] `GET /api/packages/:id/delivery-proof` - Get delivery proof

#### Trip Endpoints
- [ ] `GET /api/trips` - List all trips
- [ ] `POST /api/trips` - Create new trip
- [ ] `GET /api/trips/:id` - Get trip details
- [ ] `PUT /api/trips/:id` - Update trip
- [ ] `POST /api/trips/:id/cancel` - Cancel trip
- [ ] `POST /api/trips/:id/complete` - Complete trip
- [ ] `GET /api/trips/my-trips` - Get user's trips
- [ ] `GET /api/trips/search` - Search available trips
- [ ] `GET /api/trips/:id/requests` - Get package requests for trip

#### Package Request Endpoints
- [ ] `POST /api/package-requests` - Send package request
- [ ] `GET /api/package-requests/my-requests` - Get user's requests
- [ ] `POST /api/package-requests/:id/accept` - Accept request
- [ ] `POST /api/package-requests/:id/reject` - Reject request

#### Payment Endpoints
- [ ] `POST /api/payments/create` - Create payment intent
- [ ] `POST /api/payments/confirm` - Confirm payment
- [ ] `GET /api/payments/wallet` - Get wallet balance
- [ ] `POST /api/payments/add-funds` - Add funds to wallet
- [ ] `POST /api/payments/withdraw` - Withdraw funds
- [ ] `GET /api/payments/transactions` - Get transaction history
- [ ] `POST /api/payments/stripe-webhook` - Stripe webhook handler

#### Message Endpoints
- [ ] `GET /api/messages/conversations` - List conversations
- [ ] `POST /api/messages/conversations` - Create conversation
- [ ] `GET /api/messages/conversations/:id` - Get conversation
- [ ] `GET /api/messages/conversations/:id/messages` - Get messages
- [ ] `POST /api/messages/send` - Send message
- [ ] `POST /api/messages/conversations/:id/read` - Mark as read
- [ ] `DELETE /api/messages/:id` - Delete message
- [ ] `DELETE /api/messages/conversations/:id` - Delete conversation
- [ ] `GET /api/messages/unread` - Get unread count

#### User/Traveler Search
- [ ] `GET /api/travelers/search` - Search travelers by route

#### Notifications
- [ ] `POST /api/notifications/register` - Register push token
- [ ] `POST /api/notifications/send` - Send push notification
- [ ] `GET /api/notifications` - Get user notifications

### 2. Database Schema

You need to create database tables for:

- [ ] **users** - User accounts with authentication
- [ ] **profiles** - User profiles with KYC info
- [ ] **packages** - Package listings
- [ ] **trips** - Traveler trips
- [ ] **package_requests** - Connection between packages and trips
- [ ] **messages** - Chat messages
- [ ] **conversations** - Chat conversations
- [ ] **transactions** - Payment transactions
- [ ] **wallets** - User wallet balances
- [ ] **tracking_locations** - Package location history
- [ ] **notifications** - Push notification records
- [ ] **kyc_documents** - KYC verification documents

### 3. Third-Party Integrations

- [ ] **Stripe** - Payment processing
  - Set up Stripe account
  - Configure webhook endpoint
  - Handle payment intents
  - Process refunds

- [ ] **Expo Push Notifications**
  - Set up Expo account
  - Configure push notification service
  - Store device tokens
  - Send notifications from backend

- [ ] **Cloud Storage** (AWS S3, Cloudinary, etc.)
  - Store user avatars
  - Store package images
  - Store KYC documents
  - Store message attachments

- [ ] **Google OAuth** (optional)
  - Set up Google Cloud project
  - Configure OAuth credentials
  - Implement OAuth flow on backend

- [ ] **Paystack** (for African markets, optional)
  - Set up Paystack account
  - Configure webhook
  - Implement payment flow

### 4. Environment Variables Needed

Create a `.env` file in your backend with:

```bash
# Server
PORT=3000
NODE_ENV=production

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/bago

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_REFRESH_SECRET=your_refresh_secret_key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Paystack (optional)
PAYSTACK_SECRET_KEY=sk_live_...

# Expo Push Notifications
EXPO_ACCESS_TOKEN=your_expo_token

# Cloud Storage
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_BUCKET_NAME=...
# OR
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Email (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...

# Google OAuth (optional)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Frontend URLs (for CORS)
FRONTEND_URL=http://localhost:8081
WEB_APP_URL=http://localhost:3001
ADMIN_URL=http://localhost:3002
```

### 5. Security Considerations

- [ ] Implement rate limiting on all endpoints
- [ ] Add CORS configuration for mobile, web, and admin
- [ ] Validate all input data
- [ ] Sanitize file uploads
- [ ] Implement proper error logging (Sentry, LogRocket)
- [ ] Set up SSL/TLS certificates
- [ ] Implement API key authentication for admin endpoints
- [ ] Add request logging and monitoring
- [ ] Implement data encryption at rest
- [ ] Set up regular database backups

### 6. Admin Panel & Web App

- [ ] Create admin dashboard for managing:
  - Users and KYC approvals
  - Packages and trips
  - Payments and transactions
  - Support tickets
  - Analytics and reports

- [ ] Create web app with:
  - Same features as mobile app
  - Responsive design
  - Shared authentication
  - Real-time updates

## 📱 Mobile App Configuration

Once your backend is ready:

1. **Update `.env` file** in BAGO_MOBILE_V2:
```bash
API_URL=https://your-backend-api.com
STRIPE_PUBLISHABLE_KEY=pk_live_...
PAYSTACK_PUBLIC_KEY=pk_live_...
EXPO_PROJECT_ID=your_expo_project_id
```

2. **Test authentication flow**:
```bash
npm start
# Try login/register
```

3. **Test payment integration**:
```bash
# Create test payment in Stripe dashboard
# Test payment flow in app
```

4. **Test push notifications**:
```bash
# Send test notification from backend
# Verify receipt on device
```

## 🚀 Deployment

### Backend Deployment Options
- Railway.app
- Heroku
- AWS (EC2, ECS, Lambda)
- DigitalOcean
- Google Cloud Run
- Vercel (for serverless functions)

### Mobile App Deployment
- [ ] Build iOS app: `npx eas-cli build -p ios`
- [ ] Build Android app: `npx eas-cli build -p android`
- [ ] Submit to App Store
- [ ] Submit to Google Play

### Web App Deployment
- Vercel
- Netlify
- AWS S3 + CloudFront
- DigitalOcean

## 📊 Recommended Tech Stack for Backend

**Option 1: Node.js/Express**
- Express.js for API
- PostgreSQL for database
- Prisma ORM
- Socket.io for real-time features

**Option 2: Next.js API Routes**
- Next.js for both web app and API
- PostgreSQL with Prisma
- Built-in API routes
- Vercel deployment

**Option 3: Supabase (Fastest)**
- Built-in authentication
- Built-in PostgreSQL database
- Built-in file storage
- Built-in real-time subscriptions
- Just configure the client (already installed!)

## 🎯 Quick Start with Supabase

If you want to get started quickly, use Supabase:

1. Create Supabase project at https://supabase.com
2. Update `.env`:
```bash
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
```
3. Use Supabase client (already installed) instead of custom API

The app is already configured to work with both custom API and Supabase!

## 📞 Need Help?

Refer to:
- [BACKEND_INTEGRATION.md](./BACKEND_INTEGRATION.md) - Complete integration guide
- [Expo Documentation](https://docs.expo.dev)
- [Stripe Documentation](https://stripe.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
