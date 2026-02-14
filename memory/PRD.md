# Baggo Mobile App - Product Requirements Document

## Original Problem Statement
The user wants to get the "Baggo" mobile app project fully functional and ready for the App Store.

## Tech Stack
- **Frontend:** React Native (Expo), TypeScript
- **Backend:** Node.js, Express.js, MongoDB
- **Admin Panel:** React (Vite) at `/app/baggo/boggoAdmin`
- **Authentication:** JWT Bearer Tokens
- **Integrations:** Stripe, Paystack, DIDIT.me (KYC), Resend, Cloudinary, Google Auth, Expo Push Notifications

## What's Been Implemented

### February 2026 - Session 5 (Current)
- **CRITICAL FIX: KYC Status Not Unlocking App**
  - Root cause: DIDIT.me updates `kycStatus` field to 'approved', but screens checked legacy `status` field for 'verified'
  - Fixed sync between `kycStatus` and `status` fields in backend server.js
  - Updated useKYCCheck hook to use api utility consistently
  - Fixed add-trip.tsx to check both kycStatus==='approved' AND legacy status==='verified'
  - AuthContext now properly includes and refreshes status/isVerified fields
  - KYC verification screen now calls refreshUser() after approval to update global state
  
- **EAS Build Configuration:**
  - `eas.json` already configured with development, preview, preview-simulator, and production profiles
  - Ready for TestFlight builds

### December 2024 - Session 4
- **Push Notifications for KYC:**
  - When DIDIT approves KYC → Push notification sent to user
  - When DIDIT declines KYC → Push notification sent to user
  - In-app notifications created for both events
  - Helper function `sendPushNotification()` added to backend

- **Dark Mode Support (Partial):**
  - ThemeProvider integrated into app layout
  - Tab bar updated with dynamic colors
  - Updated screens: signin, signup, home, tracking, messages, profile
  - Theme toggle in Settings (Light/Dark/System)
  - **NOTE:** Many screens still have hardcoded Colors.xxx values - needs systematic update

- **Admin Dashboard:**
  - Located at `/app/baggo/boggoAdmin`
  - API endpoint: `https://neringa.onrender.com/api/Adminbaggo`
  - Features: Users, KYC, Tracking, Analytics, Withdrawals, Disputes, Settings

### Previous Sessions
- KYC flow fixed with DIDIT sync
- Traveler full names displayed
- Avatar selection with 6 presets
- Account deletion with questionnaire
- JWT authentication overhaul

## Currency Conversion
- Backend endpoint: `/api/currency/rates`
- Uses exchangerate-api.com
- Frontend utility: `/app/baggo/client/utils/currency.ts`
- Functions: `convertCurrency()`, `formatPrice()`, `getCurrencySymbol()`

## KYC Flow
- **Not started** → "Start Verification"
- **Started but incomplete** → "Continue Verification"
- **Actually submitted** → "Under Review" + "Refresh Status"
- **Approved** → "Verified" + Push notification + In-app notification
- **Declined** → "Try Again" + Push notification + In-app notification

## Prioritized Backlog

### P0 (Critical)
- [x] Push notifications for KYC - DONE
- [x] KYC status unlock bug - FIXED (Feb 2026)
- [x] EAS Build configuration - CONFIGURED
- [ ] Deploy backend to Render (USER ACTION)

### P1 (High Priority)
- [x] Admin dashboard verification - VERIFIED
- [ ] Complete Dark Mode for ALL screens (systematic update needed)
- [ ] Test currency conversion end-to-end

### P2 (Medium Priority)
- [ ] Test full KYC flow end-to-end
- [ ] Generate TestFlight build via EAS

## Key Files Changed - February 2026
- `/app/baggo/backend/server.js` - Fixed kycStatus→status sync
- `/app/baggo/client/contexts/AuthContext.tsx` - Added status/isVerified fields, improved refreshUser
- `/app/baggo/client/hooks/useKYCCheck.ts` - Switched to api utility
- `/app/baggo/client/app/kyc-verification.tsx` - Call refreshUser after approval
- `/app/baggo/client/app/add-trip.tsx` - Check both kycStatus and status fields

## Admin Dashboard Endpoints
- `POST /api/Adminbaggo/AdminLogin` - Admin login
- `GET /api/Adminbaggo/GetAllUsers` - List users
- `GET /api/Adminbaggo/getAllkyc` - List KYC requests
- `PUT /api/Adminbaggo/Verifykyc` - Verify KYC
- `GET /api/Adminbaggo/dashboard` - Dashboard stats
- `GET /api/Adminbaggo/analystic` - Analytics
