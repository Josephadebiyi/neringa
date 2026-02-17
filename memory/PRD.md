# Baggo Mobile App - Product Requirements Document

## Original Problem Statement
Build a fully functional mobile app for "Baggo" that connects travelers with package senders. The app needs:
1. Complete dark/light mode theming system
2. DIDIT.me KYC verification integration (webhook-driven)
3. Full authentication system (JWT)
4. Payment integration (Stripe, Paystack)
5. Trip management and package requests
6. Push notifications
7. **Intelligent Shipment Assessment System**
8. **Admin Pricing System** (NEW)
9. **Enhanced KYC Enforcement** (NEW)

## Tech Stack
- **Frontend:** React Native (Expo), TypeScript
- **Backend:** Node.js, Express.js, MongoDB
- **Admin Dashboard:** React/Vite
- **Integrations:** DIDIT.me (KYC), Stripe, Paystack, Resend, Cloudinary, Expo Push Notifications, PDFKit

## Architecture
```
/app/baggo
├── boggoAdmin/     # React/Vite Admin Panel
│   └── src/react-app/pages/
│       └── Routes.tsx           # NEW: Route pricing management
├── backend/        # Node.js/Express Backend (port 5000)
│   ├── controllers/
│   │   └── routeController.js   # NEW: Route CRUD operations
│   ├── models/
│   │   ├── RouteModel.js        # NEW: Route pricing schema
│   │   └── ShipmentModel.js     # NEW: Shipment booking schema
│   ├── services/
│   │   ├── shipmentAssessment.js
│   │   └── pdfGenerator.js
│   ├── data/
│   │   └── customsRules.js
│   └── server.js                # Enhanced KYC webhook
└── client/         # React Native (Expo) Mobile App
    ├── app/
    ├── components/
    ├── contexts/
    ├── hooks/
    └── utils/
```

## What's Been Implemented

### February 17, 2026 - Session 2

#### NEW: Enhanced KYC Enforcement System ✅
Complete overhaul of DIDIT webhook with:

1. **Data Matching**
   - Compares full name from document with signup name
   - Compares date of birth from document with signup DOB
   - Fuzzy matching for names (handles partial matches)
   - Rejects verification on mismatch with clear reason

2. **Identity Fingerprinting (Duplicate Protection)**
   - Generates SHA-256 hash of: `documentNumber + issuingCountry + DOB`
   - Checks for existing fingerprint before approval
   - Blocks verification if document already used by another account
   - Status: `blocked_duplicate` for caught duplicates

3. **Profile Overwrite**
   - On successful verification, overwrites user's name and DOB with document data
   - Stores verified document data for audit trail
   - Maintains `kycVerifiedData` object with all document fields

**KYC Status Values:**
- `not_started` - User hasn't initiated KYC
- `pending` - Verification in progress
- `approved` - Successfully verified
- `declined` - DIDIT rejected the documents
- `failed_verification` - Data mismatch detected
- `blocked_duplicate` - Document already used

#### NEW: Admin Pricing System ✅
Complete route/pricing management:

**Backend (routeController.js):**
- Create, Read, Update, Delete routes
- Search routes by origin/destination
- Calculate pricing for weight
- Get trip pricing based on route match
- Auto-detect African routes for Paystack

**Models:**
- `RouteModel.js`: Route schema with pricing, commission, weight limits
- `ShipmentModel.js`: Shipment booking with payment tracking

**Admin Dashboard:**
- `Routes.tsx`: Full CRUD UI for route management
- Add/Edit modal with all route fields
- Transport mode selection (Air, Bus, Ship, Train, Car)
- Active/Inactive toggle
- Search and filter functionality

**API Endpoints:**
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/Adminbaggo/routes` | GET | List all routes (admin) |
| `/api/Adminbaggo/routes` | POST | Create route (admin) |
| `/api/Adminbaggo/routes/:id` | PUT | Update route (admin) |
| `/api/Adminbaggo/routes/:id` | DELETE | Delete route (admin) |
| `/api/routes/search` | GET | Search routes (public) |
| `/api/routes/calculate-price` | POST | Calculate pricing (public) |
| `/api/routes/trip-pricing` | POST | Get pricing for trip (public) |
| `/api/payment/gateway/:countryCode` | GET | Get payment gateway for country |

**Payment Gateway Detection:**
- African countries → Paystack
- Other countries → Stripe
- Auto-currency detection based on country

**Route Schema:**
```javascript
{
  originCity, originCountry, originCountryCode,
  destinationCity, destinationCountry, destinationCountryCode,
  basePricePerKg: Number,
  currency: 'NGN' | 'USD' | 'GBP' | 'EUR' | 'GHS' | 'KES' | 'ZAR',
  travelerCommissionPercent: Number (default: 70),
  platformFeePercent: Number (auto-calculated),
  minWeightKg, maxWeightKg,
  estimatedDeliveryMinDays, estimatedDeliveryMaxDays,
  supportedTransportModes: ['air', 'bus', 'ship', 'train', 'car'],
  isAfricanRoute: Boolean (auto-detected),
  isActive: Boolean
}
```

### Previous Sessions

#### Intelligent Shipment Assessment System ✅
- Risk scoring engine
- Customs compliance checking
- PDF declaration generation

#### Push Notifications ✅
- Expo push notification integration
- KYC status notifications

#### Currency Conversion ✅
- `useCurrency` hook
- Exchange rate API integration

## Remaining Work

### P0 - In Progress
- [ ] Integrate admin pricing into mobile app trip display
- [ ] Implement Paystack payment flow in mobile app
- [ ] Post-payment tracking number generation

### P1 - Upcoming
- [ ] Resend email integration for receipts
- [ ] PDF receipt generation and download
- [ ] Push notifications for shipment status updates

### P2 - Future
- [ ] Re-attempt Dark Mode (different approach needed)
- [ ] EAS Build verification
- [ ] Full admin dashboard testing

## Environment Variables
Backend (.env):
- MONGO_URI
- JWT_SECRET
- DIDIT_API_KEY, DIDIT_WEBHOOK_SECRET
- STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY
- PAYSTACK_SECRET
- RESEND_API_KEY
- BASE_URL
