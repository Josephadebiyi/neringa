# Bago Platform - PRD

## Original Problem Statement
User reported: 1) Push notifications don't work - token never stored, 2) Admin panel white death screen, 3) Chat not real-time/slow, 4) Login issues, 5) Sidebar features need to work. Backend APIs stopped on Render.

## Architecture
- **Mobile App**: Flutter (Dart) - iOS & Android
- **Backend**: Node.js (Express + Socket.IO) hosted on Render
- **Database**: PostgreSQL via Supabase
- **Admin Panel**: React + Vite + Tailwind CSS v4
- **Push Notifications**: Firebase Cloud Messaging (FCM) + Expo Push + APNs
- **Authentication**: JWT + Google OAuth
- **Payments**: Stripe + Paystack
- **Storage**: Cloudinary
- **KYC**: Didit.me

## What's Been Implemented (Session 1 - Jan 2026)

### 1. Real-time Chat (NEW)
- Added `socket_io_client` (v3.1.4) to Flutter
- Created `SocketService` for WebSocket connection management
- Updated `MessageProvider` with socket listeners for instant message delivery
- Added `fromSocketData` and `optimistic` factory methods to `MessageModel`
- Optimistic UI: messages appear instantly before server confirmation
- Auto-scroll on new messages
- Socket connects on login, disconnects on logout

### 2. Push Notification Fixes
- **Root cause**: Android `firebase_options.dart` had PLACEHOLDER appId → FCM tokens never generated
- Fixed Android appId to match Firebase project
- Added Google Services Gradle plugin to `settings.gradle.kts` and `app/build.gradle.kts`
- Added FCM notification channel metadata to `AndroidManifest.xml`
- Increased push token registration retries from 3 to 5 with exponential backoff
- Improved Firebase Admin init on backend with multiple file path search
- Enhanced notification insert with dual-schema fallback
- Added push-debug diagnostic endpoint
- **IMPORTANT**: User still needs to place `google-services.json` in `android/app/`

### 3. Login Fixes
- Fixed logout endpoint mismatch (backend=GET, Flutter was calling POST → now GET)
- Added token refresh endpoint (`/api/bago/refresh-token`) on backend
- Implemented proper token refresh in Flutter's `_AuthInterceptor` (auto-retry on 401)
- Increased rate limiter from 100→500 requests/15min (mobile apps need more)
- Increased auth rate limiter from 5→10 attempts
- Fixed CORS to allow all origins (required for mobile apps)
- Added `pg` and `@supabase/supabase-js` to backend `package.json` (were MISSING — likely caused Render crashes)

### 4. Admin White Screen Fix
- Added `ErrorBoundary` component to catch React errors gracefully
- Wrapped App in ErrorBoundary in `main.tsx`
- Fixed `apiCall` to handle network errors (fetch throws TypeError when server unreachable)
- Fixed `adminLogin` to handle network errors
- All sidebar navigation features verified working (16 nav items)

### 5. Backend Stability
- Socket.IO CORS set to allow all origins with proper ping/timeout config
- Added health check path in render.yaml

## Known Requirements / User Needs
- Firebase service account JSON needs to be configured on Render backend (env: `FIREBASE_SERVICE_ACCOUNT_JSON`)
- `google-services.json` must be placed in `android/app/` for Android FCM tokens
- Render free tier causes cold starts (30-60s delay after inactivity)

## Prioritized Backlog
### P0 (Critical)
- [ ] User needs to provide/confirm `google-services.json` for Android builds
- [ ] User needs to set `FIREBASE_SERVICE_ACCOUNT_JSON` env on Render for backend FCM

### P1 (Important)
- [ ] Background message handler for Flutter (handle notifications when app is killed)
- [ ] Chat message pagination (currently loads all messages)
- [ ] Typing indicators via Socket.IO

### P2 (Nice to have)
- [ ] Read receipts in chat
- [ ] Push notification sound customization
- [ ] Admin panel - real-time dashboard updates
- [ ] Consider upgrading Render from free to paid tier for always-on backend
