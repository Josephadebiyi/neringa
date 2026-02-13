# Baggo Mobile App - Product Requirements Document

## Original Problem Statement
The user wants to get the "Baggo" mobile app project fully functional and ready for the App Store. This involves fixing critical bugs, overhauling the user authentication system, and implementing a large set of new features.

## Tech Stack
- **Frontend:** React Native (Expo), TypeScript
- **Backend:** Node.js, Express.js, MongoDB
- **Admin Panel:** React
- **Authentication:** JWT Bearer Tokens
- **Integrations:** Stripe, Paystack, DIDIT.me (KYC), Resend, Cloudinary, Google Auth

## Core Requirements
1. Full JWT Implementation with Bearer Token auth flow
2. KYC verification via DIDIT.me
3. Token persistence with AsyncStorage
4. Global Axios interceptor for auth headers
5. Date of Birth and Country fields in signup
6. Profile field locking after KYC completion
7. Payment Gateway: Paystack for Africa, Stripe for others
8. Currency conversion using exchangerate-api.com
9. UI/UX fixes: Safe area layouts, back buttons

## What's Been Implemented

### December 2024
- **Backend Auth Overhaul:**
  - JWT verification middleware (`/baggo/backend/middleware/authMiddleware.js`)
  - User controller with JWT token generation
  - Secured KYC and currency routes with auth middleware

- **Frontend Auth Overhaul:**
  - Global Axios instance with Bearer token interceptor (`/baggo/client/utils/api.ts`)
  - AuthContext refactored to manage JWT state
  - **FIX APPLIED:** signin.tsx now uses `useAuth().signIn()` to update global context state
  - **FIX APPLIED:** AuthContext.signIn() handles both old and new backend response formats

- **UI/UX Fixes:**
  - SafeAreaView added to multiple pages

## Prioritized Backlog

### P0 (Critical)
- [x] Fix KYC "not logged in" bug after successful login - **FIXED**
- [ ] Deploy backend changes to Render (USER ACTION REQUIRED)

### P1 (High Priority)
- [ ] Verify login flow works end-to-end after fix
- [ ] Full currency conversion on frontend
- [ ] Admin dashboard verification

### P2 (Medium Priority)
- [ ] Profile field locking after KYC
- [ ] Verify UI/Safe Area fixes
- [ ] EAS Build setup for TestFlight

### P3 (Low Priority)
- [ ] Full audit against `Bago_Full_System_Implementation.pdf`

## Key Files
- `/app/baggo/client/app/auth/signin.tsx` - Sign in screen
- `/app/baggo/client/contexts/AuthContext.tsx` - Auth state management
- `/app/baggo/client/app/kyc-verification.tsx` - KYC verification screen
- `/app/baggo/client/utils/api.ts` - Axios instance with interceptor
- `/app/baggo/backend/middleware/authMiddleware.js` - JWT verification

## Known Issues
- Backend changes are NOT DEPLOYED to production Render server
- Client communicates with production backend at neringa.onrender.com
