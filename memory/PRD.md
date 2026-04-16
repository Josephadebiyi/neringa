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

### 2. Push Notification Fixes (Session 1 + 2)
- **Root cause iOS**: Dual token conflict — native APNs (MethodChannel) and FCM (Firebase) were racing. No delay after permission grant → FCM `getToken()` called before APNs token ready → returned null → all retries failed → token never stored
- **Root cause Android**: PLACEHOLDER appId in `firebase_options.dart`, missing `google-services.json`, missing Google Services Gradle plugin
- **Flutter fixes**:
  - Rewrote `push_notification_service.dart` with iOS APNs-first approach
  - Added 2s delay after permission grant to let iOS register with Apple
  - Checks `getAPNSToken()` readiness before requesting FCM token
  - APNs token fallback when FCM `getToken()` fails after 8 attempts
  - Native MethodChannel no longer conflicts with Firebase path (defers when Firebase active)
  - Increased retries from 3→8 with progressive delays
  - Added background message handler (`_firebaseMessagingBackgroundHandler`) in `main.dart`
- **Android fixes**:
  - Created `google-services.json` from iOS Firebase config
  - Added Google Services Gradle plugin to `settings.gradle.kts` + `app/build.gradle.kts`
  - Fixed Android appId in `firebase_options.dart`
  - Added FCM notification channel/icon metadata to `AndroidManifest.xml`
- **Backend fixes**:
  - `savePushToken` now verifies storage and logs details
  - `addPushToken` SQL now uses `RETURNING` + updates `updated_at`
  - Added push-debug diagnostic endpoint
  - Improved Firebase Admin init with multiple file path search
  - Enhanced notification insert with dual-schema fallback

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
