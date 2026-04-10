# 🚀 Bago Platform - Quick Start Guide

Get up and running with Bago in under 5 minutes!

## ⚡ TL;DR (Too Long; Didn't Read)

```bash
# 1. Clone and install
git clone <your-repo-url>
cd neringa
npm install

# 2. Set up environment
cp .env.example BAGO_BACKEND/.env
# Edit BAGO_BACKEND/.env with your credentials

# 3. Start everything
./start.sh
```

That's it! 🎉

---

## 📝 Detailed Steps

### Step 1: Prerequisites

Make sure you have installed:
- ✅ **Node.js** v18+ ([Download](https://nodejs.org/))
- ✅ **MongoDB** ([Download](https://www.mongodb.com/try/download/community) or use MongoDB Atlas)
- ✅ **Git** ([Download](https://git-scm.com/))

Check versions:
```bash
node --version  # Should be v18.0.0 or higher
npm --version   # Should be v9.0.0 or higher
```

### Step 2: Clone Repository

```bash
git clone <your-repo-url>
cd neringa
```

### Step 3: Install Dependencies

**Option A: Install Everything at Once** (Recommended)
```bash
npm install
npm run install:all
```

**Option B: Install Individually**
```bash
npm install                    # Root dependencies
npm run install:backend        # Backend only
npm run install:webapp         # Web app only
npm run install:admin          # Admin panel only
npm run install:mobile         # Mobile app only
```

### Step 4: Configure Environment

1. **Copy environment template:**
   ```bash
   cp .env.example BAGO_BACKEND/.env
   ```

2. **Edit `.env` file:**
   ```bash
   nano BAGO_BACKEND/.env
   # or use your preferred editor
   ```

3. **Minimum required variables:**
   ```env
   MONGODB_URI=mongodb://localhost:27017/bago
   JWT_SECRET=your_random_secret_key_here
   ```

4. **Optional but recommended:**
   ```env
   STRIPE_SECRET_KEY=sk_test_...
   PAYSTACK_SECRET=sk_test_...
   RESEND_API_KEY=re_...
   CLOUDINARY_CLOUD_NAME=...
   ```

### Step 5: Start the Application

**Option 1: Quick Start (Recommended)**
```bash
./start.sh
```

**Option 2: Using npm**
```bash
npm run dev
```

**Option 3: Individual Services**
```bash
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Web App
npm run dev:webapp

# Terminal 3 - Admin Panel
npm run dev:admin
```

**Option 4: Docker**
```bash
npm run docker:up
```

### Step 6: Access the Application

Open your browser to:

- 🌐 **Web App**: http://localhost:5173
- 📊 **Admin Panel**: http://localhost:5174
- 🔌 **API Server**: http://localhost:3000
- 📱 **Mobile**: Scan QR in Expo (if running mobile)

---

## 🎯 Next Steps

### For Development

1. **Create an admin account:**
   ```bash
   cd BAGO_BACKEND
   node createAdmin.js
   ```

2. **Test API endpoint:**
   ```bash
   curl http://localhost:3000/health
   ```

3. **Access admin panel:**
   - Go to http://localhost:5174
   - Login with admin credentials

### For Production

1. **Build for production:**
   ```bash
   npm run build
   ```

2. **Deploy to cloud:**
   - See [Deployment Guide](./README.md#deployment)

---

## 🛑 Stop Services

**Stop all services:**
```bash
./stop.sh
```

**Or manually:**
```bash
# Kill all node processes
pkill -f node

# Or kill specific ports
lsof -ti:3000 | xargs kill -9
lsof -ti:5173 | xargs kill -9
lsof -ti:5174 | xargs kill -9
```

---

## 🔧 Troubleshooting

### Port Already in Use

```bash
# Check what's using the port
lsof -i :3000

# Kill the process
lsof -ti:3000 | xargs kill -9
```

### MongoDB Connection Failed

```bash
# Check if MongoDB is running
mongosh

# Start MongoDB (macOS)
brew services start mongodb-community

# Start MongoDB (Linux)
sudo systemctl start mongod

# Or use MongoDB Atlas (cloud)
# Update MONGODB_URI in .env
```

### Dependencies Not Installing

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Cloudinary/Stripe Not Working

These are **optional** for local development. The app will work without them:
- Images will use local storage (without Cloudinary)
- Payments will be disabled (without Stripe/Paystack)

---

## 📚 More Information

- 📖 **Full Documentation**: [README.md](./README.md)
- 🐛 **Report Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- 💬 **Get Help**: support@sendwithbago.com

---

## ✅ Checklist

Use this checklist to ensure everything is set up:

- [ ] Node.js v18+ installed
- [ ] MongoDB running (local or Atlas)
- [ ] Repository cloned
- [ ] Dependencies installed (`npm run install:all`)
- [ ] `.env` file configured in BAGO_BACKEND
- [ ] Services started successfully
- [ ] Can access http://localhost:5173
- [ ] Backend health check passes: http://localhost:3000/health

---

**Need help?** Join our community or email us at dev@sendwithbago.com

Happy coding! 🚀
