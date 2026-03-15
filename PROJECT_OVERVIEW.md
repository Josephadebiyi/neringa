# 📊 Bago Platform - Project Overview

## 🎯 Project Summary

**Bago** is a full-stack peer-to-peer international package delivery platform that connects package senders with travelers going to their destination. The platform handles payments, KYC verification, real-time tracking, and provides a complete marketplace for international shipping.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     BAGO PLATFORM                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Web App    │  │  Mobile App  │  │ Admin Panel  │     │
│  │  (React)     │  │ (React Native)│  │  (React)     │     │
│  │  Port: 5173  │  │   (Expo)     │  │  Port: 5174  │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                  │                  │              │
│         └──────────────────┼──────────────────┘              │
│                            │                                 │
│                   ┌────────▼────────┐                       │
│                   │  Backend API    │                       │
│                   │  (Node.js)      │                       │
│                   │  Port: 3000     │                       │
│                   └────────┬────────┘                       │
│                            │                                 │
│         ┌──────────────────┼──────────────────┐             │
│         │                  │                  │             │
│    ┌────▼─────┐    ┌──────▼──────┐   ┌──────▼──────┐     │
│    │ MongoDB  │    │  Cloudinary │   │   Stripe/   │     │
│    │          │    │   (Images)  │   │  Paystack   │     │
│    └──────────┘    └─────────────┘   └─────────────┘     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📂 Directory Structure

```
bago-platform/
│
├── 🎨 Frontend Components
│   ├── BAGO_WEBAPP/        # Main web application (React + Vite)
│   ├── ADMIN_NEW/          # Admin dashboard (React + TypeScript)
│   └── BAGO_MOBILE/        # Mobile app (React Native + Expo)
│
├── 🔧 Backend Services
│   └── BAGO_BACKEND/       # API server (Node.js + Express + MongoDB)
│
├── 🐳 Infrastructure
│   ├── docker/             # Docker configurations
│   ├── docker-compose.yml  # Service orchestration
│   └── *.sh                # Startup scripts
│
├── 📚 Documentation
│   ├── README.md           # Main documentation
│   ├── QUICK_START.md      # Getting started guide
│   ├── CONTRIBUTING.md     # Contribution guidelines
│   ├── CHANGELOG.md        # Version history
│   └── PROJECT_OVERVIEW.md # This file
│
└── ⚙️ Configuration
    ├── package.json        # Root package manager
    ├── .env.example        # Environment template
    ├── .gitignore          # Git ignore rules
    └── .dockerignore       # Docker ignore rules
```

---

## 🔌 Services Breakdown

### 1. Backend API (Port 3000)

**Technology Stack:**
- Node.js v18+
- Express.js
- MongoDB with Mongoose
- Socket.IO (real-time messaging)
- JWT authentication

**Key Features:**
- User authentication & authorization
- Trip management
- Package requests
- Payment processing (Stripe & Paystack)
- KYC verification (DIDIT.me)
- Real-time messaging
- File uploads (Cloudinary)
- Email notifications (Resend)
- Currency conversion
- Analytics & tracking

**Main Entry Point:** `BAGO_BACKEND/server.js`

### 2. Web Application (Port 5173)

**Technology Stack:**
- React 18
- Vite (build tool)
- TailwindCSS
- Framer Motion
- React Router v6
- Axios

**Key Features:**
- User signup & login
- Browse available trips
- Send packages
- Track shipments
- Messaging with travelers
- Payment checkout
- Profile management

**Main Entry Point:** `BAGO_WEBAPP/src/main.jsx`

### 3. Admin Panel (Port 5174)

**Technology Stack:**
- React 19 with TypeScript
- Vite 7
- TailwindCSS v4
- Recharts (analytics)
- Zod (validation)

**Key Features:**
- User management
- KYC verification review
- Trip & package oversight
- Analytics dashboard
- Support tickets
- Promo codes
- Email campaigns
- Financial reports

**Main Entry Point:** `ADMIN_NEW/src/main.tsx`

### 4. Mobile App (Expo)

**Technology Stack:**
- React Native
- Expo SDK 54
- TypeScript
- Expo Router
- Lucide Icons

**Key Features:**
- Full feature parity with web
- Push notifications
- Camera integration (for item photos)
- Location services
- QR code scanning
- Offline support

**Main Entry Point:** `BAGO_MOBILE/app/_layout.tsx`

---

## 🔐 Authentication & Security

### Authentication Flow

1. **User Signup**
   - Email/password or Google OAuth
   - Email verification via OTP
   - JWT token issued

2. **KYC Verification**
   - DIDIT.me integration
   - Government ID verification
   - Liveness detection
   - Name/DOB matching
   - Duplicate identity prevention

3. **Session Management**
   - JWT stored in httpOnly cookies
   - Refresh token rotation
   - Session timeout (24 hours)

### Security Features

- ✅ Password hashing (bcrypt)
- ✅ JWT authentication
- ✅ Rate limiting
- ✅ CORS protection
- ✅ SQL injection prevention (Mongoose)
- ✅ XSS protection
- ✅ CSRF tokens
- ✅ Helmet.js security headers

---

## 💳 Payment Flow

### Sender Payment Process

1. **Select Trip & Package**
2. **Calculate Price**
   - Weight-based pricing
   - Currency conversion
   - Platform fee (10%)
3. **Payment Method**
   - Stripe (Global)
   - Paystack (Africa)
4. **Payment Processing**
   - Funds held in escrow
5. **Package Delivery**
6. **Release to Traveler**
   - After confirmation
   - Minus platform fee

### Supported Payment Methods

- **Stripe**: Cards (Visa, Mastercard, Amex)
- **Paystack**: Cards, Bank Transfer, USSD, Mobile Money

### Supported Currencies

USD, EUR, GBP, NGN, GHS, KES, ZAR, CAD, AUD

---

## 📊 Database Schema

### Core Collections

1. **users**
   - Authentication data
   - Profile information
   - KYC status
   - Wallet balance
   - Push tokens

2. **trips**
   - Route (from/to)
   - Dates
   - Available weight
   - Price per kg
   - Status

3. **requests**
   - Package details
   - Sender/Traveler
   - Status
   - Payment info
   - Tracking number

4. **messages**
   - Conversation threads
   - Real-time chat

5. **notifications**
   - In-app notifications
   - Push notifications

6. **transactions**
   - Payment records
   - Escrow management

---

## 🚀 Deployment Strategy

### Current Deployment

- **Backend**: Render / Hostinger
- **Frontend**: Netlify / Vercel
- **Database**: MongoDB Atlas
- **Images**: Cloudinary CDN
- **Mobile**: App Store & Google Play

### Environment Stages

1. **Development** (localhost)
2. **Staging** (staging.sendwithbago.com)
3. **Production** (sendwithbago.com)

---

## 📈 Key Performance Metrics

### Application Metrics

- API Response Time: < 200ms (avg)
- Database Query Time: < 50ms (avg)
- Page Load Time: < 2s
- Mobile App Size: ~30MB

### Business Metrics

- Active Users
- Total Packages Delivered
- Total Earnings (Travelers)
- Platform Revenue
- Average Delivery Time

---

## 🔧 Development Workflow

### Local Development

```bash
# Start all services
./start.sh

# Access services
Web App:     http://localhost:5173
Admin:       http://localhost:5174
Backend:     http://localhost:3000
```

### Testing

```bash
# Run all tests
npm test

# Backend tests
cd BAGO_BACKEND && npm test

# Frontend tests
cd BAGO_WEBAPP && npm test
```

### Building for Production

```bash
# Build all
npm run build

# Individual builds
npm run build:webapp
npm run build:admin
npm run build:mobile
```

---

## 🐛 Known Issues & Limitations

### Current Limitations

1. **Payments**
   - Stripe Connect requires manual onboarding
   - Paystack limited to certain African countries

2. **KYC**
   - DIDIT.me API costs apply after trial
   - Limited to passport/national ID

3. **Real-time**
   - Socket.IO requires sticky sessions for scaling

### Planned Improvements

- [ ] Add GraphQL API
- [ ] Implement Redis caching
- [ ] Add WebRTC video chat
- [ ] Multi-language support
- [ ] Advanced analytics
- [ ] AI-powered route matching

---

## 📞 Support & Contact

- **Documentation**: See README.md
- **Issues**: GitHub Issues
- **Email**: support@sendwithbago.com
- **Website**: https://sendwithbago.com

---

## 📜 License

MIT License - See [LICENSE](./LICENSE)

---

**Last Updated:** March 2024
**Version:** 1.0.0
**Maintainer:** Bago Development Team
