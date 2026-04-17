# Bago Platform - PRD

## Original Problem Statement
User reported multiple issues across Flutter app + Node.js backend:
1. Push notifications don't work (token never stored)
2. Admin white death screen
3. Chat not real-time/slow
4. Login issues
5. Communication prefs in profile
6. Phone number update "no routes found"
7. Traveler should see item images before accepting
8. Shipment status updates after acceptance
9. Bago logo missing on PDFs
10. Escrow balance + kg deduction on acceptance
11. Don't display unapproved trips
12. Admin push notification broadcast

## Architecture
- **Mobile App**: Flutter (Dart) - iOS & Android
- **Backend**: Node.js (Express + Socket.IO) on Render
- **Database**: PostgreSQL via Supabase
- **Admin Panel**: React + Vite + Tailwind CSS v4
- **Push Notifications**: Firebase Cloud Messaging (FCM) + Expo Push + APNs
- **Authentication**: JWT + Google OAuth
- **Payments**: Stripe + Paystack
- **Storage**: Cloudinary
- **KYC**: Didit.me

## What's Been Implemented

### Session 1 - Real-time Chat + Auth + Push Token Foundation
- Added `socket_io_client` to Flutter with `SocketService` singleton
- Updated `MessageProvider` with socket listeners + optimistic UI
- Fixed logout endpoint (GET vs POST mismatch)
- Added `/api/bago/refresh-token` endpoint
- Token refresh interceptor in Flutter `_AuthInterceptor`
- Fixed CORS for mobile apps, increased rate limiter
- Added `pg` + `@supabase/supabase-js` to backend package.json (CRITICAL missing deps)
- Admin ErrorBoundary + network error handling in apiCall

### Session 2 - iOS Push Token Fix
- Root cause: No delay after permission → FCM getToken() before APNs ready → null
- Rewrote `push_notification_service.dart` with APNs-first approach
- 2s delay after permission, APNs readiness check, 8 retries
- APNs token fallback, background message handler
- Android Firebase setup replicated from iOS

### Session 4 - Escrow Cron Bug Fix + Status Enum
- **Root cause**: Postgres `request_status` enum doesn't include `'delivered'` — only `'completed'`. Code was mapping `completed` → `delivered` (backwards!) and writing invalid enum to DB
- Fixed `shipping.js`: `'delivered'` and `'completed'` both map to `'completed'` in DB
- Fixed `escrowCron.js`: Queries `status = 'completed'` instead of `'delivered'`
- Fixed `postgresRequestController.js`: Maps incoming `'delivered'` → `'completed'` before DB write
- Fixed Flutter `RequestStatus` enum: Added `intransit`, `delivering`, `cancelled` values (were missing → all mapped to `pending`)
- User-facing labels still show "Delivered" — only DB storage uses `'completed'`
- **Phone change routes**: Added `POST /user/request-phone-change` + `POST /user/verify-phone-change` (were completely missing)
- **Escrow hold on acceptance**: When traveler accepts, sender's funds held in escrow + wallet transaction logged
- **KG deduction on acceptance**: Trip `available_kg` decremented by package weight
- **PDF logo**: Added fallback text-based "BAGO" logo when image file not found on Render. Added logo to ShipmentSummary + CustomsDeclaration PDFs (were missing)
- **Shipment status updates**: Added `updateShipmentStatus` to Flutter service. Added `_ShipmentStatusButtons` widget with progress indicator (accepted → intransit → delivering → delivered)
- **Package image gallery**: Added horizontal scrollable gallery of all package images before accept/reject buttons
- **Trip filtering**: Added `available_kg > 0` filter so fully booked trips don't appear
- **Admin broadcast**: Improved to store in-app notifications for all recipients + added history endpoint
- **Backend verification**: `savePushToken` now verifies storage, `addPushToken` uses RETURNING + updated_at

## Known Requirements
- Firebase service account JSON needed on Render for FCM
- `google-services.json` from Firebase Console for Android
- Render free tier causes cold starts

## Prioritized Backlog
### P0 (Critical)
- [ ] Register Android app in Firebase Console + real google-services.json
- [ ] Set FIREBASE_SERVICE_ACCOUNT_JSON on Render
- [ ] Redeploy backend to Render

### P1 (Important)
- [ ] Chat message pagination
- [ ] Typing indicators via Socket.IO
- [ ] Keep-alive cron to prevent Render cold starts

### P2 (Nice to have)
- [ ] Read receipts in chat
- [ ] Push notification sound customization
- [ ] Admin real-time dashboard updates
- [ ] Upgrade Render from free tier
