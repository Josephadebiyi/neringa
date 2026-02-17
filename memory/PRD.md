# Baggo Mobile App - Product Requirements Document

## Original Problem Statement
Build a fully functional mobile app for "Baggo" that connects travelers with package senders. The app needs:
1. Complete dark/light mode theming system
2. DIDIT.me KYC verification integration (webhook-driven)
3. Full authentication system (JWT)
4. Payment integration (Stripe, Paystack)
5. Trip management and package requests
6. Push notifications
7. **Intelligent Shipment Assessment System** (NEW)

## Tech Stack
- **Frontend:** React Native (Expo), TypeScript
- **Backend:** Node.js, Express.js, MongoDB
- **Admin Dashboard:** React/Vite
- **Integrations:** DIDIT.me (KYC), Stripe, Paystack, Resend, Cloudinary, Expo Push Notifications, PDFKit

## Architecture
```
/app/baggo
├── boggoAdmin/     # React/Vite Admin Panel
├── backend/        # Node.js/Express Backend (port 5000)
│   ├── services/
│   │   ├── shipmentAssessment.js  # Risk scoring engine
│   │   └── pdfGenerator.js        # Customs PDF generation
│   ├── data/
│   │   └── customsRules.js        # HS codes, duties, restrictions
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   └── server.js
└── client/         # React Native (Expo) Mobile App
    ├── app/
    ├── components/
    │   ├── ShipmentAssessment.tsx    # Assessment modal
    │   └── ConfidenceScoreBadge.tsx  # Score badges
    ├── contexts/
    ├── hooks/
    └── utils/
        └── shipmentAssessment.ts  # API service
```

## What's Been Implemented

### February 17, 2026 - Shipment Assessment System

#### NEW: Intelligent Shipment Assessment System ✅
Complete implementation of shipment compatibility assessment with:

**Backend Services:**
- `/app/baggo/backend/services/shipmentAssessment.js` - Risk scoring engine
- `/app/baggo/backend/services/pdfGenerator.js` - PDF generation with PDFKit
- `/app/baggo/backend/data/customsRules.js` - Comprehensive customs database

**API Endpoints:**
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/shipment/assess` | POST | Full shipment assessment with risk scores |
| `/api/shipment/quick-check` | POST | Quick compatibility filter for trips |
| `/api/shipment/generate-pdf` | POST | Generate customs declaration PDF |
| `/api/shipment/customs-pdf/:id` | GET | Download stored PDF |
| `/api/shipment/history` | GET | User's assessment history |
| `/api/trips/search-compatible` | POST | Search with compatibility filter |
| `/api/customs/rules/:country` | GET | Country-specific rules |
| `/api/customs/hs-codes` | GET | HS code database |

**Features:**
1. **Shipment Compatibility Check** (Yes/No/Conditional)
2. **Delivery Confidence Score** (0-100)
3. **Risk Classification:**
   - Border/Customs Risk
   - Delay Risk
   - Damage Risk
   - Confiscation Risk
4. **Price Suggestions** based on weight, risk, urgency, transport mode
5. **Customs Compliance:**
   - HS Code classification
   - Duty & VAT estimates
   - Required documents
6. **PDF Customs Declaration** with:
   - Route information
   - Item details
   - Customs classification
   - Carrier information
   - Declaration statement
   - Signature boxes

**Risk Scoring Weights:**
- Traveler Reliability: 30%
- Item Category Risk: 25%
- Route Risk: 25%
- Transport Mode: 20%

**Supported Countries:**
EU, GB, US, NG, GH, KE, ZA, FR, DE, CA (+ DEFAULT fallback)

**Transport Modes:**
Air, Bus, Ship, Train, Car - each with specific restrictions

**Frontend Components:**
- `ShipmentAssessment.tsx` - Full assessment modal
- `ConfidenceScoreBadge.tsx` - Score display badges
- `shipmentAssessment.ts` - API service utilities
- Updated `search-travelers.tsx` - Compatibility filtering

### Previous Session - Dark Mode & Push Notifications

#### Dark Mode Refactor: ✅ COMPLETE
All 35+ screens use dynamic theming via `ThemeContext`

#### Push Notifications: ✅ COMPLETE
- Integrated `PushNotificationSetup` into root layout
- Backend handles token registration

#### Currency Conversion: ✅ COMPLETE
- `useCurrency` hook for currency detection and conversion

#### KYC Webhook: ✅ COMPLETE
- Webhook URL: `https://neringa.onrender.com/api/didit/webhook`

## API Usage Examples

### Assess a Shipment
```javascript
POST /api/shipment/assess
{
  "tripId": "trip_id_here",
  "item": {
    "type": "smartphone",
    "category": "electronics",
    "value": 500,
    "quantity": 1,
    "weight": 0.5
  },
  "senderCountry": "GB"
}
```

### Quick Compatibility Check
```javascript
POST /api/shipment/quick-check
{
  "trips": [...],
  "item": { "weight": 3, "category": "electronics", ... }
}
```

### Generate PDF
```javascript
POST /api/shipment/generate-pdf
{
  "declarationData": { ... }
}
// Returns base64 PDF
```

## Database Schema Updates
```javascript
User: {
  shipmentAssessments: [Mixed], // Assessment history
  completedTrips: Number,
  cancellations: Number,
  rating: Number,
  // ... existing fields
}
```

## Remaining Work
- **Testing:** Full end-to-end testing with Expo
- **Admin Dashboard:** Verification and testing

## Environment Variables
Backend (.env):
- MONGO_URI
- JWT_SECRET
- DIDIT_API_KEY, DIDIT_WEBHOOK_SECRET
- STRIPE_SECRET_KEY
- RESEND_API_KEY
