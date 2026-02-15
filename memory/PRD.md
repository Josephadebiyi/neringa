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
    └── constants/
```

## What's Been Implemented

### February 15, 2026 - Dark Mode & KYC Progress

#### Completed:
1. **ThemeContext.tsx** - Comprehensive theme system with light/dark colors
2. **Theme-aware screens updated:**
   - `index.tsx` (splash screen)
   - `onboarding.tsx`
   - `auth/signup.tsx`
   - `auth/signin.tsx`
   - `auth/verify-otp.tsx`
   - `auth/forgot-password.tsx`
   - `banned.tsx`
   - `success-page.tsx`
   - `failed-page.tsx`
   - `+not-found.tsx`
   - `add-address.tsx`
   - `traveler-details/[id].tsx`
   - `kyc-verification.tsx`

3. **KYC Webhook System (Backend):**
   - Webhook endpoint at `/api/didit/webhook`
   - Parses `vendor_data` to extract userId
   - Updates user's `kycStatus` in MongoDB
   - Sends push notifications on approval/decline
   - Creates in-app notifications

#### Webhook URL for DIDIT:
```
https://neringa.onrender.com/api/didit/webhook
```

## Remaining Work

### P0 - High Priority (Dark Mode Refactor)
21 screens still need theme updates:
- `privacy-policy.tsx`
- `search-travelers.tsx`
- `package-details.tsx`
- `notifications.tsx`
- `(tabs)/profile.tsx`
- `(tabs)/tracking.tsx`
- `(tabs)/index.tsx`
- `(tabs)/messages.tsx`
- `terms-conditions.tsx`
- `personal-details.tsx`
- `payment.tsx`
- `contact-support.tsx`
- `package-request.tsx`
- `edit-trip.tsx`
- `shipping-request.tsx`
- `traveler-dashboard.tsx`
- `add-trip.tsx`
- `payment-method.tsx`
- `send-package.tsx`
- `live-tracking.tsx`
- `check-rates.tsx`

### P1 - After Dark Mode Complete
- Push notification client-side implementation
- Currency conversion on frontend
- EAS Build setup for TestFlight

### P2 - Future Tasks
- Admin dashboard verification
- Full audit against `Bago_Full_System_Implementation.pdf`

## Key Database Schema
```javascript
User: {
  kycStatus: String ('not_started', 'pending', 'approved', 'declined'),
  diditSessionId: String,
  expoPushToken: String,
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

## Notes
- This is a React Native Expo project - no web frontend
- Backend runs on port 5000
- External URL: https://neringa.onrender.com
- Webhook receives DIDIT status updates and updates user in MongoDB
