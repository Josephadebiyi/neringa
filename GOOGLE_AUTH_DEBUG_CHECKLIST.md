# 🔍 Google Auth Failed - Debug Checklist

## Issue
You've uploaded the dist files to Hostinger, but still getting "googleAuthFailed" error.

---

## ✅ What's Correct (Already Verified)

1. **Google Client ID is embedded** in your compiled JavaScript
   - Location: `dist/assets/index-CtkqWwb5.js`
   - Value: `207312508850-kgpk9uramqhjkhjeqds4bfdkotm1iqo0.apps.googleusercontent.com`

2. **Backend API URL is correct**
   - Points to: `https://neringa.onrender.com`
   - Endpoint: `/api/bago/google-auth`

3. **CORS is enabled** on backend
   - Setting: `origin: true` (accepts all domains)

---

## 🚨 Most Likely Cause

### **Your Hostinger domain is NOT authorized in Google Cloud Console**

Google OAuth requires you to whitelist your production domain.

---

## 🛠️ SOLUTION (5 minutes)

### Step 1: Find Your Exact Hostinger Domain

What is your exact domain? For example:
- `https://yourdomain.com`
- `https://www.yourdomain.com`
- `https://bago.yourdomain.com`

**Important:** Note if it's `www` or non-www.

---

### Step 2: Add Domain to Google Cloud Console

1. Go to: https://console.cloud.google.com/apis/credentials

2. Log in with the Google account that owns this project

3. Find and click on:
   ```
   Client ID: 207312508850-kgpk9uramqhjkhjeqds4bfdkotm1iqo0.apps.googleusercontent.com
   ```

4. Scroll to **"Authorized JavaScript origins"**

5. Click **"+ ADD URI"**

6. Add BOTH:
   ```
   https://yourdomain.com
   https://www.yourdomain.com
   ```
   (Replace with your actual domain)

7. Scroll to **"Authorized redirect URIs"**

8. Click **"+ ADD URI"**

9. Add ALL of these:
   ```
   https://yourdomain.com
   https://www.yourdomain.com
   https://yourdomain.com/login
   https://www.yourdomain.com/login
   https://yourdomain.com/signup
   https://www.yourdomain.com/signup
   ```

10. Click **"SAVE"** at the bottom

11. **WAIT 5-10 MINUTES** for changes to propagate

---

### Step 3: Clear Browser Cache

1. Open your browser
2. Press `Ctrl+Shift+Delete` (or `Cmd+Shift+Delete` on Mac)
3. Select "Cached images and files"
4. Click "Clear data"

OR just use **Incognito/Private mode**

---

### Step 4: Test Again

1. Go to your Hostinger site
2. Click "Sign in with Google"
3. **Expected:** Google popup should appear and work

---

## 🔍 HOW TO DEBUG IF STILL FAILING

### Check Browser Console (F12)

1. Open your site
2. Press **F12** to open DevTools
3. Go to **Console** tab
4. Click "Sign in with Google"
5. Look for errors

### Common Errors and Fixes:

#### Error 1: `redirect_uri_mismatch`
```
Error: redirect_uri_mismatch
The redirect URI in the request: https://yoursite.com does not match
```

**Fix:** The exact domain shown in the error needs to be added to Google Cloud Console.

---

#### Error 2: `origin_mismatch`
```
Error: origin_mismatch
```

**Fix:** Add your domain to "Authorized JavaScript origins"

---

#### Error 3: `idpiframe_initialization_failed`
```
Error: Cookies are not enabled in current environment
```

**Fix:**
- Enable cookies in browser
- Make sure site is served over HTTPS (not HTTP)

---

#### Error 4: Network request failed
```
POST https://neringa.onrender.com/api/bago/google-auth net::ERR_CONNECTION_REFUSED
```

**Fix:** Backend is down or not accessible. Check:
```bash
curl https://neringa.onrender.com/api/health
```

---

#### Error 5: CORS error
```
Access to fetch at 'https://neringa.onrender.com/api/bago/google-auth'
from origin 'https://yourdomain.com' has been blocked by CORS policy
```

**Fix:** Backend CORS should already allow all origins. If you see this:
1. Check if backend is running
2. Verify backend .env has correct settings

---

## 🧪 TEST BACKEND DIRECTLY

Test if your backend Google auth endpoint works:

```bash
curl -X POST https://neringa.onrender.com/api/bago/google-auth \
  -H "Content-Type: application/json" \
  -d '{"accessToken":"test_token"}'
```

**Expected response:**
```json
{
  "success": false,
  "message": "Invalid Google token"
}
```

If you get this error, it means the endpoint is working - it's just rejecting the test token (which is correct).

**Bad responses:**
- `404 Not Found` - Endpoint doesn't exist
- `500 Internal Server Error` - Backend crashed
- `Connection refused` - Backend is down

---

## 📸 WHAT TO CHECK IN BROWSER DEVTOOLS

### Network Tab
1. Open DevTools (F12)
2. Go to **Network** tab
3. Click "Sign in with Google"
4. Look for request to: `https://neringa.onrender.com/api/bago/google-auth`

**What to check:**
- Status Code: Should be `200 OK`
- Response body: Should have `{"success": true, "token": "...", "user": {...}}`

**If you see:**
- `401 Unauthorized` - Invalid Google token
- `400 Bad Request` - Missing or malformed request
- `500 Internal Server Error` - Backend error (check backend logs)
- `404 Not Found` - Wrong endpoint URL

---

## 🎯 SUMMARY

**Most likely issue:** Your Hostinger domain is not whitelisted in Google Cloud Console.

**Quick fix:**
1. Add your domain to Google Cloud Console (both www and non-www)
2. Wait 10 minutes
3. Clear browser cache
4. Try again

---

## 📞 NEXT STEPS IF STILL FAILING

If after following all steps above you still see "googleAuthFailed":

**Send me:**
1. Your exact Hostinger domain (e.g., `https://example.com`)
2. Screenshot of browser Console (F12 → Console tab)
3. Screenshot of Network tab showing the failed request
4. Error message you see

With this info, I can identify the exact issue!

---

## 🔑 .htaccess File (Correct Version)

Make sure your .htaccess file is exactly this:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # 1. Force HTTPS
  RewriteCond %{HTTPS} off
  RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

  # 2. SPA Routing - Handle Refreshes (login, dashboard, etc)
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME} !-l
  RewriteRule . /index.html [L]
</IfModule>

# Robust Fallback for refreshing sub-pages
FallbackResource /index.html
```

This file is already in your `dist/.htaccess` and should be uploaded to Hostinger.

---

**99% sure the issue is domain whitelisting in Google Cloud Console!** ✅
