# Baggo Mobile App - Product Requirements Document

## Original Problem Statement
Build the "Baggo" mobile app - a peer-to-peer package delivery platform connecting travelers with senders. The app consists of:
- React Native (Expo) client
- Node.js/Express backend
- React admin panel
- MongoDB Atlas database

## User Personas
1. **Senders** - Users who need to send packages internationally/domestically
2. **Travelers** - Users who travel and can carry packages for others
3. **Admins** - Platform administrators managing users, trips, and disputes

## Core Requirements

### Authentication (IMPLEMENTED - Dec 2025)
- ✅ JWT Bearer Token authentication
- ✅ Token stored in AsyncStorage (mobile) and cookies (web)
- ✅ Axios interceptor for automatic token attachment
- ✅ 401 error handling with automatic logout
- ✅ 30-day token expiry

### KYC Verification (IMPLEMENTED)
- ✅ DIDIT.me integration
- ✅ Protected routes with Bearer token auth
- ✅ Profile field locking after KYC approval (firstName, lastName, dateOfBirth)
- ✅ Email remains editable post-KYC

### Payment Gateways (IMPLEMENTED)
- ✅ Stripe for non-African countries
- ✅ Paystack for African countries
- ✅ Auto-detection based on user's country during signup

### Currency Conversion (IMPLEMENTED)
- ✅ Real-time exchange rates via exchangerate-api.com
- ✅ Backend caching (1-hour refresh)
- ✅ Frontend utility for formatting and conversion
- ✅ User preferred currency stored in profile

### Signup Flow (IMPLEMENTED)
- ✅ Date of Birth field
- ✅ Country selection with flag emoji
- ✅ Phone number with country code

### UI/UX Fixes (IMPLEMENTED)
- ✅ SafeAreaView on all sub-pages
- ✅ Proper back button (ChevronLeft icon) on all headers
- Pages fixed: terms-conditions, privacy-policy, contact-support, send-package, personal-details

## Technical Architecture

```
/app/baggo/
├── admin/           # React Admin Panel
├── backend/         # Node.js/Express API
│   ├── Auth/
│   │   └── UserAuthentication.js  # JWT middleware
│   ├── controllers/
│   │   └── userController.js      # Login returns token
│   ├── middleware/
│   │   └── authMiddleware.js      # Bearer token verification
│   ├── models/
│   │   └── userScheme.js          # User model with KYC fields
│   ├── constants/
│   │   └── countries.js           # Payment gateway logic
│   └── server.js                  # Main server
└── client/          # React Native (Expo)
    ├── app/
    │   ├── (auth)/                # Auth screens
    │   ├── (tabs)/                # Main tab screens
    │   └── kyc-verification.tsx   # KYC flow
    ├── contexts/
    │   └── AuthContext.tsx        # Auth state management
    └── utils/
        ├── api.ts                 # Axios with interceptor
        ├── currency.ts            # Currency utilities
        └── backendDomain.ts       # API base URL
```

## Database Schema (Key Fields)

### User Model
```javascript
{
  firstName: String,
  lastName: String,
  email: String (unique),
  phone: String,
  dateOfBirth: Date,
  country: String,
  kycStatus: enum['not_started', 'pending', 'approved', 'declined'],
  paymentGateway: enum['stripe', 'paystack'],
  preferredCurrency: String,
  diditSessionId: String,
  kycVerifiedAt: Date
}
```

## Third-Party Integrations
- **DIDIT.me** - KYC verification
- **Stripe** - Primary payment (non-Africa)
- **Paystack** - Payment for Africa
- **Resend** - Email service
- **Cloudinary** - Media storage
- **MongoDB Atlas** - Database

## Deployment
- **Backend:** Render (neringa.onrender.com)
- **Database:** MongoDB Atlas (bago.dg1ry6q.mongodb.net)
- **Client:** Expo Go (development), App Store (production)

## Pending/Backlog Items
1. Full audit against Bago_Full_System_Implementation.pdf
2. EAS Build setup for TestFlight IPA
3. Admin dashboard full functionality verification
4. Dynamic currency display across all screens
5. Verification badge on user profiles

## Session Notes (Dec 2025)
- JWT auth system completely overhauled
- KYC "User not authenticated" bug fixed by removing email from request body
- Currency conversion API integrated (exchangerate-api.com)
- Profile locking implemented post-KYC
