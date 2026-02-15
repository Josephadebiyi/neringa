# Baggo Mobile App - Product Requirements Document

## Original Problem Statement
Build a fully functional mobile app for "Baggo" that connects travelers with package senders. The app needs:
1. Complete dark/light mode theming system
2. DIDIT.me KYC verification integration (webhook-driven)
3. Full authentication system (JWT)
4. Payment integration (Stripe, Paystack)
5. Trip management and package requests
6. Push notifications

## Tech Stack
- **Frontend:** React Native (Expo), TypeScript
- **Backend:** Node.js, Express.js, MongoDB
- **Admin Dashboard:** React/Vite
- **Integrations:** DIDIT.me (KYC), Stripe, Paystack, Resend, Cloudinary, Expo Push Notifications

## Architecture
```
/app/baggo
├── boggoAdmin/     # React/Vite Admin Panel
├── backend/        # Node.js/Express Backend (port 5000)
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routers/
│   └── server.js
└── client/         # React Native (Expo) Mobile App
    ├── app/
    ├── components/
    ├── contexts/
    ├── hooks/
    └── constants/
```

## What's Been Implemented

### February 15, 2026 - Complete Session

#### P0 - Dark Mode Refactor: ✅ COMPLETE
All 35+ screens updated to use dynamic theming via `ThemeContext`:
- Auth screens (signin, signup, forgot-password, verify-otp)
- Tab screens (index, profile, messages, tracking)
- Feature screens (add-trip, edit-trip, payment, search-travelers, etc.)
- Utility screens (banned, success, failed, not-found, etc.)

Key changes:
- Removed all `Colors` imports from `@/constants/Colors`
- All screens now use `const { colors } = useTheme()`
- Replaced `Colors.xxx` with `colors.xxx` throughout
- Added missing `useTheme` hooks where needed

#### P1 - Push Notifications: ✅ COMPLETE
- `PushNotificationSetup.tsx` utility integrated into `_layout.tsx`
- Backend already has push token registration at `/register-token`
- Notifications configured in `app.json` with expo-notifications plugin
- Push notifications sent on KYC status changes

#### P1 - Currency Conversion: ✅ COMPLETE
- Created `useCurrency` hook at `/app/baggo/client/hooks/useCurrency.ts`
- Features: currency detection by location, exchange rate caching, formatPrice utility
- Backend has `/api/currency/convert` and `/api/currency/rates` endpoints
- Currency symbols mapping for 30+ currencies

#### P2 - EAS Build Setup: ✅ CONFIGURED
- Updated `eas.json` with proper build profiles (development, preview, production)
- Configured TestFlight submission settings
- Added environment variables support
- Updated `app.json` with required plugins (expo-notifications, expo-location)

#### KYC Webhook System: ✅ COMPLETE
- **Webhook URL:** `https://neringa.onrender.com/api/didit/webhook`
- Parses `vendor_data` to extract userId
- Updates user's `kycStatus` in MongoDB
- Sends push notifications on approval/decline
- Creates in-app notifications

## Key Database Schema
```javascript
User: {
  kycStatus: String ('not_started', 'pending', 'approved', 'declined'),
  diditSessionId: String,
  expoPushToken: String,
  preferredCurrency: String,
  // ... other fields
}
```

## Environment Variables
Backend (.env):
- MONGO_URI
- JWT_SECRET
- DIDIT_API_KEY
- DIDIT_WEBHOOK_SECRET
- STRIPE_SECRET_KEY
- RESEND_API_KEY

## API Endpoints
- `POST /api/didit/webhook` - DIDIT KYC status webhook
- `GET /api/currency/convert` - Currency conversion
- `GET /api/currency/rates` - Exchange rates
- `POST /register-token` - Push notification token registration

## Remaining Work
- **Admin Dashboard Verification:** Full testing of `/app/baggo/boggoAdmin`
- **Full Audit:** Against `Bago_Full_System_Implementation.pdf`

## EAS Build Instructions
To build for TestFlight:
```bash
cd /app/baggo/client
eas build --platform ios --profile production
eas submit --platform ios
```

Required environment variables for submission:
- EXPO_APPLE_ID
- EXPO_ASC_APP_ID
- EXPO_APPLE_TEAM_ID
