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
10. Dark mode support with system default detection
11. Account deletion with feedback questionnaire

## What's Been Implemented

### December 2024 - Session 2
- **Dark Mode Support:**
  - ThemeProvider integrated into app layout
  - System default theme detection
  - Theme toggle in Profile settings (Light/Dark/System)
  - KYC verification screen updated with dynamic theme colors

- **Account Deletion Feature:**
  - Added "Danger Zone" section in Profile
  - 2-question feedback questionnaire (reason + improvement suggestion)
  - Backend endpoint `/api/baggo/delete-account` created
  - Deletes user data and KYC records

- **KYC Flow Improvements:**
  - Backend now syncs KYC status with DIDIT on every status check
  - Auto-approves/declines based on DIDIT session status
  - Frontend checks actual DIDIT session status for pending users
  - Proper handling of incomplete sessions (allow retry)

### December 2024 - Session 1
- **Backend Auth Overhaul:**
  - JWT verification middleware
  - User controller with JWT token generation
  - Secured KYC and currency routes

- **Frontend Auth Overhaul:**
  - Global Axios instance with Bearer token interceptor
  - AuthContext manages JWT state
  - signin.tsx uses useAuth().signIn() to update global context

## Prioritized Backlog

### P0 (Critical)
- [x] Fix KYC "not logged in" bug - FIXED
- [x] Dark mode support - IMPLEMENTED
- [x] Account deletion feature - IMPLEMENTED
- [ ] Deploy backend changes to Render (USER ACTION)

### P1 (High Priority)
- [x] KYC status sync with DIDIT - IMPLEMENTED
- [ ] Full currency conversion on frontend
- [ ] Admin dashboard verification

### P2 (Medium Priority)
- [ ] Profile field locking after KYC
- [ ] Verify UI/Safe Area fixes
- [ ] EAS Build setup for TestFlight

### P3 (Low Priority)
- [ ] Full audit against `Bago_Full_System_Implementation.pdf`

## Key Files
- `/app/baggo/client/app/_layout.tsx` - App layout with ThemeProvider
- `/app/baggo/client/contexts/ThemeContext.tsx` - Theme management
- `/app/baggo/client/app/(tabs)/profile.tsx` - Profile with theme toggle & delete account
- `/app/baggo/client/app/kyc-verification.tsx` - KYC verification with theme support
- `/app/baggo/backend/server.js` - Backend with delete-account & improved KYC status

## KYC Flow
- **Not started** → "Start Verification" button
- **Started but incomplete** → "Continue Verification" button (can restart)
- **Actually submitted** → "Under Review" with "Refresh Status" button
- **Approved** → "Continue to App" button
- **Declined** → "Try Again" button

## Known Issues
- Backend changes need deployment to production Render server
