# 🔧 Render.com Backend Build Fix

## ❌ Error You're Seeing

```
npm error path /opt/render/project/src/baggo/backend/package.json
npm error errno -2
npm error enoent Could not read package.json: Error: ENOENT: no such file or directory
```

## 🎯 Root Cause

Your repository structure changed from:
- ❌ OLD: `baggo/backend/`
- ✅ NEW: `BAGO_BACKEND/`

But Render.com is still configured to look in the old directory.

---

## ✅ SOLUTION (2 minutes)

### Option 1: Update Render.com Dashboard (Recommended)

1. Go to: https://dashboard.render.com/
2. Log in to your account
3. Find your backend service (should be named "neringa" or similar)
4. Click on the service
5. Go to **"Settings"** tab
6. Scroll to **"Build & Deploy"** section
7. Update these fields:

#### **Root Directory:**
Change from: `baggo/backend` or leave blank
Change to: `BAGO_BACKEND`

#### **Build Command:**
```bash
npm install
```

#### **Start Command:**
```bash
node server.js
```

8. Click **"Save Changes"**
9. Click **"Manual Deploy"** → **"Deploy latest commit"**

---

### Option 2: Create render.yaml File

Create a file at the root of your repository:

**File:** `/Users/j/Desktop/CLAUDE/BAGO/neringa/render.yaml`

```yaml
services:
  - type: web
    name: neringa-backend
    runtime: node
    plan: free
    rootDir: BAGO_BACKEND
    buildCommand: npm install
    startCommand: node server.js
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3000
      - key: MONGODB_URI
        sync: false
      - key: JWT_SECRET
        sync: false
      - key: PAYSTACK_SECRET
        sync: false
      - key: STRIPE_SECRET_KEY
        sync: false
      - key: CLOUDINARY_CLOUD_NAME
        sync: false
      - key: CLOUDINARY_API_KEY
        sync: false
      - key: CLOUDINARY_API_SECRET
        sync: false
      - key: SMTP_HOST
        sync: false
      - key: SMTP_PORT
        sync: false
      - key: SMTP_USER
        sync: false
      - key: SMTP_PASS
        sync: false
      - key: CLIENT_URL
        value: https://yourdomain.com
```

Then:
1. Commit and push this file to git
2. Render will auto-detect and use this configuration

---

## 🔍 Verify Configuration

After updating, check these in Render.com dashboard:

### ✅ Correct Settings:
- **Root Directory**: `BAGO_BACKEND`
- **Build Command**: `npm install`
- **Start Command**: `node server.js`
- **Node Version**: 20.x or latest

### ❌ Wrong Settings:
- **Root Directory**: `baggo/backend` or `backend`
- Missing root directory (will look in repo root)

---

## 📊 Environment Variables Needed

Make sure these are set in Render.com → Environment tab:

### Required:
```env
MONGODB_URI=<your_mongodb_uri>
JWT_SECRET=your-jwt-secret
PORT=3000
NODE_ENV=production
```

### Payment (Required):
```env
PAYSTACK_SECRET=<your_paystack_secret>
STRIPE_SECRET_KEY=sk_test_************************************
```

### Email (Optional but recommended):
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### File Upload (Optional):
```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### Frontend URL:
```env
CLIENT_URL=https://yourdomain.com
```

---

## 🚀 After Fixing

1. **Trigger Manual Deploy**:
   - Go to your service in Render dashboard
   - Click "Manual Deploy" → "Deploy latest commit"

2. **Watch Build Logs**:
   - You should see:
     ```
     ==> Cloning from https://github.com/Josephadebiyi/neringa...
     ==> Checking out commit in BAGO_BACKEND
     ==> Running build command 'npm install'...
     ==> Build succeeded ✓
     ==> Starting service with 'node server.js'...
     🚀 Server running on port 3000
     ✅ MongoDB Connected
     ```

3. **Test Backend**:
   ```bash
   curl https://neringa.onrender.com/api/health
   ```

   Expected response:
   ```json
   {"status":"healthy","timestamp":"2026-03-15T..."}
   ```

---

## 🐛 If Build Still Fails

### Error: "Cannot find module 'express'"

**Fix:** Make sure all dependencies are in `package.json`:

```bash
cd BAGO_BACKEND
npm install
git add package.json package-lock.json
git commit -m "Update backend dependencies"
git push
```

### Error: "Port already in use"

**Fix:** Check Start Command is:
```bash
node server.js
```

NOT:
```bash
npm start
```

### Error: "MongoDB connection failed"

**Fix:**
1. Check `MONGODB_URI` environment variable is set
2. Make sure MongoDB Atlas allows connections from `0.0.0.0/0` (all IPs)
3. Check MongoDB cluster is running

---

## 📁 Directory Structure (Current)

Your repo now has:
```
neringa/
├── BAGO_BACKEND/          ← Backend code here
│   ├── package.json       ← Render needs this
│   ├── server.js          ← Entry point
│   ├── controllers/
│   ├── models/
│   └── ...
├── BAGO_WEBAPP/           ← Web app (not deployed to Render)
├── BAGO_MOBILE/           ← Mobile app (not deployed to Render)
└── ADMIN_NEW/             ← Admin panel (not deployed to Render)
```

Render must point to `BAGO_BACKEND/` directory.

---

## 🎯 Quick Fix Checklist

- [ ] Log in to Render.com dashboard
- [ ] Find "neringa" backend service
- [ ] Go to Settings
- [ ] Set Root Directory to: `BAGO_BACKEND`
- [ ] Set Build Command to: `npm install`
- [ ] Set Start Command to: `node server.js`
- [ ] Save changes
- [ ] Click "Manual Deploy" → "Deploy latest commit"
- [ ] Wait for build to complete (~3-5 minutes)
- [ ] Test: `curl https://neringa.onrender.com/api/health`

---

## 📞 Still Having Issues?

If the build still fails, send me:
1. Screenshot of Render.com Settings tab
2. Full build log from Render
3. Any error messages

The fix is simple - just updating the root directory! 🚀
