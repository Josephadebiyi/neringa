# Google Auth Testing Guide

## ✅ Web App is Running Locally

Your web app is now hosted at: **http://localhost:5174/**

---

## ⚠️ Important: Google Auth Won't Work on Localhost

### Why?
Google Cloud Console only has these domains authorized:
- Your production Hostinger domain
- NOT localhost

### Solution: Test on Hostinger Instead

---

## 🎯 How to Test Google Auth

### Option 1: Test on Hostinger (Recommended)

1. **Upload the Latest Build**
   - Upload files from: `/Users/j/Desktop/CLAUDE/BAGO/neringa/BAGO_WEBAPP/dist/`
   - To your Hostinger `public_html` folder

2. **Add Domain to Google Cloud Console**
   - Go to: https://console.cloud.google.com/apis/credentials
   - Find: `207312508850-kgpk9uramqhjkhjeqds4bfdkotm1iqo0.apps.googleusercontent.com`
   - Click Edit
   - Add your domain to both:
     - Authorized JavaScript origins
     - Authorized redirect URIs

3. **Use the Test Page**
   - Visit: `https://yourdomain.com/google-quick-test.html`
   - Click "Sign in with Google"
   - See if it works

### Option 2: Add Localhost to Google Cloud Console

If you want to test locally:

1. **Go to Google Cloud Console**
   - https://console.cloud.google.com/apis/credentials

2. **Edit OAuth Client ID**
   - Find: `207312508850-kgpk9uramqhjkhjeqds4bfdkotm1iqo0.apps.googleusercontent.com`
   - Click Edit

3. **Add Localhost**

   **Authorized JavaScript origins:**
   ```
   http://localhost:5174
   ```

   **Authorized redirect URIs:**
   ```
   http://localhost:5174
   http://localhost:5174/login
   http://localhost:5174/signup
   ```

4. **Save and Wait**
   - Click SAVE
   - Wait 10 minutes for changes to propagate

5. **Test Locally**
   - Go to: http://localhost:5174/
   - Click "Sign in with Google"
   - Should work now

---

## 🔍 Quick Test Steps

### Test the Simple Test Page

I created a test page for you. To use it locally:

1. **Copy the test file**
   ```bash
   cp /Users/j/Desktop/CLAUDE/BAGO/neringa/BAGO_WEBAPP/dist/google-quick-test.html /Users/j/Desktop/CLAUDE/BAGO/neringa/BAGO_WEBAPP/public/
   ```

2. **Visit it**
   - http://localhost:5174/google-quick-test.html

3. **Click "Sign in with Google"**
   - If you added localhost to Google Cloud Console → Should work
   - If not → Will show error "Domain not authorized"

---

## 📋 Current Status

### Web App ✅
- Running at: http://localhost:5174/
- Latest code loaded
- All fixes applied

### Google Auth ⚠️
- **Will work on:** Your Hostinger domain (after adding to Google Cloud)
- **Won't work on:** localhost (unless you add it to Google Cloud)

### iOS App 🔨
- Crash fixes applied
- Need to rebuild in Terminal
- Will need manual testing

---

## 🚀 Recommended Testing Flow

### 1. Test on Localhost (Development)
```bash
# Already running at http://localhost:5174/
# Add localhost to Google Cloud Console
# Test Google Sign-In
```

### 2. Build for Production
```bash
cd /Users/j/Desktop/CLAUDE/BAGO/neringa/BAGO_WEBAPP
npm run build
# Uploads contents of dist/ folder to Hostinger
```

### 3. Test on Hostinger (Production)
```
# Add your domain to Google Cloud Console
# Visit: https://yourdomain.com/google-quick-test.html
# Test Google Sign-In
```

---

## 🔧 What to Add to Google Cloud Console

### For Localhost Testing:
```
Authorized JavaScript origins:
  http://localhost:5174

Authorized redirect URIs:
  http://localhost:5174
  http://localhost:5174/login
  http://localhost:5174/signup
```

### For Hostinger Production:
```
Authorized JavaScript origins:
  https://yourdomain.com
  https://www.yourdomain.com

Authorized redirect URIs:
  https://yourdomain.com
  https://yourdomain.com/login
  https://yourdomain.com/signup
  https://www.yourdomain.com
  https://www.yourdomain.com/login
  https://www.yourdomain.com/signup
```

Replace `yourdomain.com` with your actual domain.

---

## 📊 Testing Checklist

- [ ] Web app running locally at http://localhost:5174/
- [ ] Added localhost to Google Cloud Console (if testing locally)
- [ ] OR uploaded to Hostinger (if testing production)
- [ ] Added production domain to Google Cloud Console
- [ ] Waited 10 minutes after Google Cloud changes
- [ ] Visited test page: `/google-quick-test.html`
- [ ] Clicked "Sign in with Google"
- [ ] Google Auth works ✅

---

## 🆘 Troubleshooting

### Error: "Domain not authorized"
**Fix:** Add the domain to Google Cloud Console

### Error: "Popup blocked"
**Fix:** Allow popups in browser settings

### Error: "Cannot reach backend"
**Fix:** Check backend URL in your app

### Google popup doesn't appear
**Fix:**
1. Check browser console for errors (F12)
2. Make sure domain is added to Google Cloud
3. Wait 10 minutes after adding domain

---

## 📞 Current URLs

**Local Development:**
- Web App: http://localhost:5174/
- Test Page: http://localhost:5174/google-quick-test.html (after copying file)

**Production (Hostinger):**
- Web App: https://yourdomain.com/
- Test Page: https://yourdomain.com/google-quick-test.html

**Google Cloud Console:**
- https://console.cloud.google.com/apis/credentials
- Client ID: `207312508850-kgpk9uramqhjkhjeqds4bfdkotm1iqo0.apps.googleusercontent.com`

---

**Web app is running! Add your domain to Google Cloud Console to test Google Auth.** 🚀
