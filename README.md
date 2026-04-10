# 🎒 Bago - Peer-to-Peer International Package Delivery Platform

<div align="center">

![Bago Logo](https://res.cloudinary.com/dmito8es3/image/upload/v1761919738/Bago_New_2_gh1gmn.png)

**Fast, Secure & Affordable International Package Delivery**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![React Native](https://img.shields.io/badge/React_Native-20232A?logo=react&logoColor=61DAFB)](https://reactnative.dev/)

</div>

---

## 📋 Table of Contents

- [About](#-about)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Quick Start](#quick-start)
- [Environment Variables](#-environment-variables)
- [Running the Application](#-running-the-application)
- [Docker Support](#-docker-support)
- [API Documentation](#-api-documentation)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 About

**Bago** connects people who need to send packages internationally with travelers going to those destinations. Our peer-to-peer platform makes international shipping fast, affordable, and secure.

### Why Bago?

- **💰 Save up to 70%** on international shipping costs
- **⚡ Faster delivery** through direct traveler connections
- **🔒 Secure & Verified** with KYC verification and insurance
- **🌍 Global reach** with local delivery options
- **💳 Flexible payments** via Stripe (global) and Paystack (Africa)

---

## ✨ Features

### For Senders
- 📦 Send packages anywhere in the world
- 💵 Real-time price comparison
- 🔍 Track shipments in real-time
- 🛡️ Optional insurance coverage
- 📱 Mobile & web platforms

### For Travelers
- 💸 Earn money while traveling
- ✈️ Easy trip posting
- 💳 Instant payouts (Stripe Connect/Paystack)
- ⭐ Build your traveler reputation
- 📊 Earnings dashboard

### For Admins
- 📊 Advanced analytics dashboard
- 👥 User management & KYC verification
- 🎫 Support ticket system
- 📧 Email campaign tools
- 🎁 Promo code management
- 💰 Financial tracking

---

## 🛠 Tech Stack

### Backend
- **Node.js** (v18+) with Express.js
- **MongoDB** with Mongoose ODM
- **Socket.IO** for real-time messaging
- **JWT** authentication
- **Cloudinary** for image storage
- **Stripe** & **Paystack** payment processing
- **DIDIT.me** KYC verification

### Frontend (Web)
- **React** (v18+)
- **Vite** build tool
- **TailwindCSS** for styling
- **Framer Motion** animations
- **React Router** v6
- **Axios** HTTP client

### Mobile App
- **React Native** with Expo
- **Expo Router** for navigation
- **TypeScript**
- **Lucide Icons**

### Admin Panel
- **React** with **TypeScript**
- **Vite**
- **TailwindCSS v4**
- **Recharts** for analytics
- **Zod** for validation

### DevOps
- **Docker** & **Docker Compose**
- **GitHub Actions** (CI/CD)
- **Render** / **Hostinger** deployment

---

## 📁 Project Structure

```
bago-platform/
├── BAGO_BACKEND/          # Node.js/Express API server
│   ├── controllers/       # Request handlers
│   ├── models/           # MongoDB schemas
│   ├── services/         # Business logic
│   ├── routes/           # API routes
│   ├── middleware/       # Auth & validation
│   └── server.js         # Entry point
│
├── BAGO_WEBAPP/          # React web application
│   ├── src/
│   │   ├── pages/        # React pages
│   │   ├── components/   # Reusable components
│   │   ├── context/      # React context
│   │   └── api.js        # API client
│   └── public/           # Static assets
│
├── ADMIN_NEW/            # Admin panel (React)
│   ├── src/
│   │   ├── pages/        # Admin pages
│   │   └── services/     # API services
│   └── public/
│
├── BAGO_MOBILE/          # React Native mobile app
│   ├── app/              # Expo Router pages
│   ├── components/       # Mobile components
│   ├── contexts/         # Global state
│   └── utils/            # Utilities
│
├── docker/               # Docker configuration
│   ├── Dockerfile.backend
│   ├── Dockerfile.webapp
│   └── Dockerfile.admin
│
├── .archived/            # Old/backup files
│
├── docker-compose.yml    # Multi-service orchestration
├── package.json          # Root package manager
├── start.sh              # Development startup script
├── stop.sh               # Stop all services
└── README.md            # This file
```

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.0.0 or higher) - [Download](https://nodejs.org/)
- **npm** (v9.0.0 or higher) - Comes with Node.js
- **MongoDB** (v6.0+) - [Download](https://www.mongodb.com/try/download/community) or use MongoDB Atlas
- **Git** - [Download](https://git-scm.com/)

**Optional:**
- **Docker** & **Docker Compose** - [Download](https://www.docker.com/)
- **Expo CLI** (for mobile development) - `npm install -g expo-cli`

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/bago-platform.git
   cd bago-platform
   ```

2. **Install root dependencies**
   ```bash
   npm install
   ```

3. **Install all service dependencies**
   ```bash
   npm run install:all
   ```

   Or install individually:
   ```bash
   npm run install:backend
   npm run install:webapp
   npm run install:admin
   npm run install:mobile
   ```

4. **Set up environment variables**

   Create `.env` files in each service directory:

   ```bash
   # Copy example env files
   cp BAGO_BACKEND/.env.example BAGO_BACKEND/.env
   ```

   See [Environment Variables](#-environment-variables) section for details.

### Quick Start

**Option 1: Using the start script (Recommended)**
```bash
./start.sh
```

**Option 2: Using npm scripts**
```bash
# Start all services (Backend + WebApp + Admin)
npm run dev

# Or start services individually
npm run dev:backend   # Port 3000
npm run dev:webapp    # Port 5173
npm run dev:admin     # Port 5174
npm run dev:mobile    # Expo dev server
```

**Option 3: Using Docker**
```bash
npm run docker:up
```

### Accessing the Application

Once started, open your browser to:

- **🌐 Web Application**: http://localhost:5173
- **📊 Admin Panel**: http://localhost:5174
- **🔌 Backend API**: http://localhost:3000
- **📱 Mobile App**: Scan QR code in Expo DevTools

---

## 🔐 Environment Variables

### Backend (.env)

Create `BAGO_BACKEND/.env`:

```env
# Server Configuration
PORT=3000
NODE_ENV=development
BASE_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173

# Security
JWT_SECRET=your_super_secret_jwt_key_here
ADMIN_SECRET_KEY=your_admin_secret_key_here

# Database
MONGODB_URI=mongodb://localhost:27017/bago
# Or use MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/bago

# Email Service (Resend)
RESEND_API_KEY=your_resend_api_key

# Image Upload (Cloudinary)
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret

# Payment Processors
STRIPE_SECRET_KEY=sk_test_your_stripe_key
PAYSTACK_SECRET=sk_test_your_paystack_key

# KYC Verification (DIDIT.me)
DIDIT_API_KEY=your_didit_api_key
DIDIT_WEBHOOK_SECRET=your_didit_webhook_secret

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### Frontend & Admin

No `.env` required for local development. For production, configure:

```env
VITE_API_URL=https://your-backend-api.com
```

---

## 🎮 Running the Application

### Development Mode

**Start all services together:**
```bash
./start.sh
```

**Start services separately:**

```bash
# Terminal 1 - Backend
cd BAGO_BACKEND
npm start

# Terminal 2 - Web App
cd BAGO_WEBAPP
npm run dev

# Terminal 3 - Admin Panel
cd ADMIN_NEW
npm run dev

# Terminal 4 - Mobile App
cd BAGO_MOBILE
npm run dev
```

**Stop all services:**
```bash
./stop.sh
```

### Production Build

```bash
# Build all services
npm run build

# Or build individually
npm run build:webapp
npm run build:admin
npm run build:mobile
```

### Running Tests

```bash
# Run all tests (when configured)
npm test

# Run specific service tests
cd BAGO_BACKEND && npm test
```

---

## 🐳 Docker Support

### Using Docker Compose

**Start all services:**
```bash
docker-compose up -d
```

**View logs:**
```bash
docker-compose logs -f
```

**Stop all services:**
```bash
docker-compose down
```

**Rebuild containers:**
```bash
docker-compose up -d --build
```

### Docker Services

- **mongodb**: MongoDB database (Port 27017)
- **backend**: API server (Port 3000)
- **webapp**: Web application (Port 5173)
- **admin**: Admin panel (Port 5174)

---

## 📚 API Documentation

### Base URL
```
Development: http://localhost:3000
Production: https://api.sendwithbago.com
```

### Authentication

Most endpoints require JWT authentication:

```http
Authorization: Bearer <your_jwt_token>
```

### Key Endpoints

#### Authentication
- `POST /api/bago/signup` - Register new user
- `POST /api/bago/login` - User login
- `POST /api/bago/verify-otp` - Verify OTP

#### Trips
- `GET /api/bago/trips` - Get all trips
- `POST /api/bago/add-trip` - Create a trip
- `PUT /api/bago/trip/:id` - Update trip

#### Packages
- `POST /api/bago/send-package` - Create package request
- `GET /api/bago/my-shipments` - Get user's shipments
- `GET /api/bago/package/:id` - Get package details

#### Payments
- `POST /api/payment/create-intent` - Create Stripe payment
- `POST /api/paystack/initialize` - Initialize Paystack payment
- `GET /api/payment/verify/:reference` - Verify payment

#### KYC
- `POST /api/bago/kyc/create-session` - Start KYC verification
- `GET /api/bago/kyc/status` - Check KYC status

#### Admin
- `GET /api/Adminbaggo/users` - Get all users
- `POST /api/Adminbaggo/promo-codes` - Create promo code
- `GET /api/Adminbaggo/analytics` - Get analytics

### Full API Documentation

For complete API documentation, visit:
- **Swagger Docs** (when available): http://localhost:3000/api-docs
- **Postman Collection**: [Link to Postman]

---

## 🌐 Deployment

### Backend Deployment (Render/Heroku)

1. **Push to GitHub**
2. **Connect to Render/Heroku**
3. **Set environment variables**
4. **Deploy**

### Frontend Deployment (Netlify/Vercel)

```bash
cd BAGO_WEBAPP
npm run build
# Deploy dist/ folder
```

### Mobile App Deployment

```bash
cd BAGO_MOBILE
# iOS
npm run build-ios

# Android
npm run build-android
```

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines

- Follow existing code style
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Team

- **Development Team** - Bago Platform
- **Contact**: support@sendwithbago.com
- **Website**: https://sendwithbago.com

---

## 🙏 Acknowledgments

- MongoDB for database
- Stripe & Paystack for payment processing
- DIDIT.me for KYC verification
- Cloudinary for image hosting
- All our contributors and users

---

<div align="center">

**Made with ❤️ by the Bago Team**

[Website](https://sendwithbago.com) · [Report Bug](https://github.com/yourusername/bago/issues) · [Request Feature](https://github.com/yourusername/bago/issues)

</div>
