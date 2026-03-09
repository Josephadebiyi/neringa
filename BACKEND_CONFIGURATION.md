# 🔧 Bago Backend Configuration Guide

Complete guide for configuring and deploying the Bago backend API.

---

## 📋 Table of Contents
- [Current Configuration](#current-configuration)
- [Environment Variables](#environment-variables)
- [Production Setup](#production-setup)
- [Admin Setup](#admin-setup)
- [Third-Party Services](#third-party-services)
- [Database Configuration](#database-configuration)
- [Deployment Checklist](#deployment-checklist)

---

## 🔍 Current Configuration

### **Active Environment Variables**

Based on your current `.env` file at `baggo/backend/.env`:

```env
# Server
PORT=3000
BASE_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173

# Security
JWT_SECRET=super_secret_bago_key_12345
ADMIN_SECRET_KEY=fallback_admin_secret_key_123

# Database
MONGODB_URI=mongodb+srv://chideracalistus:economic00@cluster0.aryyobw.mongodb.net/dealShub

# Email
RESEND_API_KEY=re_XfzwEqGr_K1UePtoezH4sv6mDFEXtp5UT

# Payments
STRIPE_SECRET_KEY=sk_live_[CONFIGURED] ✅
PAYSTACK_SECRET=sk_live_[CONFIGURED] ✅

# KYC
DIDIT_API_KEY=[CONFIGURED] ✅
DIDIT_WEBHOOK_SECRET=[CONFIGURED] ✅

# Google OAuth
GOOGLE_CLIENT_ID=[CONFIGURED].apps.googleusercontent.com ✅
GOOGLE_CLIENT_SECRET=GOCSPX-[CONFIGURED] ✅
GOOGLE_PROJECT_ID=bago-489400

# Cloudinary (not configured)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

---

## 🌐 Environment Variables

### **Required for Production**

#### **1. Server Configuration**
```env
PORT=3000
BASE_URL=https://api.sendwithbago.com
BACKEND_URL=https://api.sendwithbago.com
FRONTEND_URL=https://sendwithbago.com
```

**Notes**:
- `PORT`: The port your Node.js server will run on
- `BASE_URL` & `BACKEND_URL`: Your production API URL
- `FRONTEND_URL`: Your production frontend URL (for CORS and redirects)

---

#### **2. Security Keys**
```env
JWT_SECRET=your_very_secure_random_string_here
ADMIN_SECRET_KEY=another_very_secure_random_string
```

**⚠️ IMPORTANT**:
- Generate strong random strings for production
- Use: `openssl rand -base64 32` to generate secure keys
- NEVER use the default values in production
- Keep these secret and never commit to git

---

#### **3. Database**
```env
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/baggo
```

**Current**: `mongodb+srv://chideracalistus:economic00@cluster0.aryyobw.mongodb.net/dealShub`

**Setup**:
1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create a cluster or use existing
3. Database name: `baggo` (or `dealShub` if using current)
4. Get connection string from "Connect" → "Connect your application"
5. Replace `<username>` and `<password>` with your credentials

---

#### **4. Email Service (Resend)**
```env
RESEND_API_KEY=re_your_api_key_here
```

**Current**: `re_XfzwEqGr_K1UePtoezH4sv6mDFEXtp5UT` ✅

**Used for**:
- OTP verification emails
- Password reset emails
- Account notifications

**Setup**:
- Dashboard: https://resend.com/api-keys
- Current key appears to be active

---

#### **5. Payment Processing**

##### **Stripe (International)**
```env
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
```

**Current**: ✅ Configured (Live mode active)

**Features**:
- Stripe Connect for traveler payouts (non-African currencies)
- International payment processing
- Automatic currency conversion

**Dashboard**: https://dashboard.stripe.com/

---

##### **Paystack (African Markets)**
```env
PAYSTACK_SECRET=sk_live_your_paystack_secret_key
```

**Current**: ✅ Configured (Live mode active)

**Features**:
- Nigerian Naira (NGN) payments
- African currency support
- Bank transfers

**Dashboard**: https://dashboard.paystack.com/

---

#### **6. KYC Verification (Didit)**
```env
DIDIT_API_KEY=your_api_key
DIDIT_WEBHOOK_SECRET=your_webhook_secret
```

**Current**: ✅ Configured

**Used for**:
- Identity verification for travelers
- Document verification
- Compliance and safety

**Dashboard**: https://didit.me/dashboard

---

#### **7. Google OAuth**
```env
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your_client_secret
GOOGLE_PROJECT_ID=your_project_id
```

**Current**: ✅ Configured for `bago-489400` project

**Used for**:
- Social login with Google
- Faster user registration

**Dashboard**: https://console.cloud.google.com/apis/credentials

---

#### **8. Cloud Storage (Cloudinary) - ⚠️ NOT CONFIGURED**
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**Status**: ⚠️ Using placeholder values (images stored as base64)

**Recommended**:
1. Sign up at https://cloudinary.com/
2. Get credentials from dashboard
3. Update .env with actual values
4. Better performance for image uploads

**Current Behavior**:
- Package images stored as base64 in MongoDB
- Works but not optimal for production
- May cause database bloat with many images

---

## 👨‍💼 Admin Setup

### **Admin Credentials**

**Email**: `taiwojos2@yahoo.com`
**Password**: `Passw0rd@1`
**Role**: `SUPER_ADMIN`

### **Creating/Updating Admin**

```bash
cd baggo/backend
node seed_admin.js
```

**What it does**:
- Creates admin user if doesn't exist
- Updates password if admin exists
- Uses credentials from `seed_admin.js`

**Admin Login URL**:
- Local: `http://localhost:5173/admin/`
- Production: `https://sendwithbago.com/admin/`

---

## 🚀 Production Setup

### **Step 1: Update .env for Production**

Create a production `.env` file:

```bash
cd baggo/backend
cp .env .env.production
nano .env.production
```

Update these values:
```env
# Change URLs
BASE_URL=https://api.sendwithbago.com
BACKEND_URL=https://api.sendwithbago.com
FRONTEND_URL=https://sendwithbago.com

# Generate new secrets
JWT_SECRET=$(openssl rand -base64 32)
ADMIN_SECRET_KEY=$(openssl rand -base64 32)

# Keep other values (already configured)
```

### **Step 2: Deploy Backend**

**Option A: VPS/Dedicated Server**
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Clone and setup
git clone https://github.com/Josephadebiyi/neringa.git
cd neringa/baggo/backend
npm install

# Start with PM2
pm2 start server.js --name bago-api
pm2 save
pm2 startup
```

**Option B: Cloud Platform (Heroku/Railway/Render)**
1. Connect GitHub repository
2. Set environment variables in dashboard
3. Deploy automatically on push

### **Step 3: Configure Domain**

**DNS Records**:
```
Type  Name  Value
A     api   your_server_ip
```

**Nginx Configuration** (if using reverse proxy):
```nginx
server {
    listen 80;
    server_name api.sendwithbago.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### **Step 4: SSL Certificate**

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d api.sendwithbago.com
```

### **Step 5: Seed Admin**

```bash
cd baggo/backend
NODE_ENV=production node seed_admin.js
```

---

## ✅ Deployment Checklist

### **Before Deployment**
- [ ] Update `BASE_URL`, `BACKEND_URL`, `FRONTEND_URL` to production URLs
- [ ] Generate new `JWT_SECRET` and `ADMIN_SECRET_KEY`
- [ ] Verify MongoDB connection string is correct
- [ ] Confirm Stripe keys are in live mode (`sk_live_...`)
- [ ] Confirm Paystack keys are in live mode (`sk_live_...`)
- [ ] Set up Cloudinary (optional but recommended)
- [ ] Test all API endpoints locally
- [ ] Verify admin login works

### **After Deployment**
- [ ] Run `node seed_admin.js` to create admin
- [ ] Test admin login at `/admin/`
- [ ] Test user registration
- [ ] Test trip posting with pricing validation
- [ ] Test package sending
- [ ] Test Stripe Connect onboarding
- [ ] Test payment processing
- [ ] Verify email sending (OTP, notifications)
- [ ] Check error logs
- [ ] Set up monitoring (PM2/New Relic/Sentry)

### **Security**
- [ ] Never commit `.env` to git
- [ ] Use strong, unique secrets
- [ ] Enable HTTPS only
- [ ] Set up CORS properly
- [ ] Rate limit API endpoints
- [ ] Regular security audits

---

## 📊 Application Settings

These are managed in the database via `settingSheme.js`:

```javascript
{
  autoVerification: false,
  commissionPercentage: 15,
  supportedAfricanCurrencies: ['NGN', 'GHS', 'KES', 'UGX', 'TZS', 'ZAR', 'RWF']
}
```

**Pricing Rules** (enforced in `AddaTripController.js`):
- Maximum: **$15 USD** per kg (international)
- Maximum: **₦6000 NGN** per kg (Nigeria/African routes)
- African currencies auto-convert to NGN equivalent
- Admin commission: **15%** of all transactions

---

## 🔗 Important URLs

**Development**:
- Frontend: http://localhost:5173/
- Backend: http://localhost:3000/
- Admin: http://localhost:5173/admin/

**Production**:
- Frontend: https://sendwithbago.com/
- Backend: https://api.sendwithbago.com/
- Admin: https://sendwithbago.com/admin/

**External Dashboards**:
- MongoDB: https://cloud.mongodb.com/
- Stripe: https://dashboard.stripe.com/
- Paystack: https://dashboard.paystack.com/
- Resend: https://resend.com/
- Cloudinary: https://console.cloudinary.com/
- Didit KYC: https://didit.me/dashboard
- Google Cloud: https://console.cloud.google.com/

---

## 📞 Support

For backend issues:
1. Check logs: `pm2 logs bago-api`
2. Restart service: `pm2 restart bago-api`
3. Check environment: verify all required vars are set
4. Database connection: test MongoDB connectivity
5. API health check: `curl https://api.sendwithbago.com/health`

---

**Last Updated**: March 9, 2026
**Backend Version**: 1.0.0
**Node Version**: 18.x or higher
