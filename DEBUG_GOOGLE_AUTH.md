# Debug Google Auth "googleAuthFailed" Error

## Step-by-Step Debugging

### Step 1: Open Browser Console
1. Go to your Hostinger site
2. Press **F12** (or Right-click → Inspect)
3. Click on the **Console** tab
4. Keep it open

### Step 2: Try Google Sign-In
1. Click "Sign in with Google"
2. Watch the Console for errors

### Step 3: Identify the Error Type

Look for one of these error patterns:

---

## Error Pattern 1: "redirect_uri_mismatch"

**Full Error:**
```
Error: redirect_uri_mismatch
The redirect URI in the request: https://yourdomain.com does not match...
```

**What This Means:**
Google Cloud Console doesn't have your domain authorized.

**Fix:**
1. Go to: https://console.cloud.google.com/apis/credentials
2. Find: `207312508850-kgpk9uramqhjkhjeqds4bfdkotm1iqo0.apps.googleusercontent.com`
3. Click **Edit**
4. Under **"Authorized redirect URIs"**, add the EXACT URI from the error message

**Example:**
If error shows `https://www.yourdomain.com`, add:
```
https://www.yourdomain.com
https://www.yourdomain.com/login
https://www.yourdomain.com/signup
```

---

## Error Pattern 2: "origin_mismatch"

**Full Error:**
```
Error: origin_mismatch
The JavaScript origin in the request: https://yourdomain.com does not match...
```

**What This Means:**
Your domain isn't in "Authorized JavaScript origins"

**Fix:**
1. Go to: https://console.cloud.google.com/apis/credentials
2. Find: `207312508850-kgpk9uramqhjkhjeqds4bfdkotm1iqo0.apps.googleusercontent.com`
3. Click **Edit**
4. Under **"Authorized JavaScript origins"**, add the EXACT origin from the error message

**Example:**
```
https://yourdomain.com
```

---

## Error Pattern 3: "idpiframe_initialization_failed"

**Full Error:**
```
Error: idpiframe_initialization_failed
Not a valid origin for the client...
```

**What This Means:**
Same as origin_mismatch - domain not authorized.

**Fix:**
Follow "Error Pattern 2" steps above.

---

## Error Pattern 4: "popup_blocked_by_browser"

**Full Error:**
```
Error: popup_blocked_by_browser
The popup has been blocked by the user's browser
```

**What This Means:**
Your browser is blocking the Google popup.

**Fix:**
1. Look for the popup blocker icon in address bar
2. Click it and allow popups for your site
3. Try again

---

## Error Pattern 5: Backend API Error

**Console Shows:**
```
POST https://your-backend-api.com/api/bago/google-auth 404
or
POST https://your-backend-api.com/api/bago/google-auth 500
```

**What This Means:**
The backend endpoint is failing.

**Possible Causes:**
1. Backend is down or unreachable
2. CORS issue (backend not allowing your domain)
3. Backend `/api/bago/google-auth` endpoint has a bug

**Check:**
1. What is your backend domain? Is it accessible?
2. Open Network tab in browser console
3. Click "Sign in with Google"
4. Look for the `/api/bago/google-auth` request
5. Click on it to see the response

**Common Backend Issues:**
- Backend CORS not allowing your Hostinger domain
- Backend Google OAuth logic has an error
- Backend environment variables (Google Client Secret) not set

---

## Error Pattern 6: Network Error

**Console Shows:**
```
Failed to fetch
or
Network Error
```

**What This Means:**
Can't connect to your backend API.

**Fix:**
1. Check if backend is running
2. Check if backend URL is correct in your web app
3. Check if backend allows CORS from your Hostinger domain

---

## Quick Test Script

Copy this into your browser console while on your Hostinger site:

```javascript
// Test 1: Check if Google OAuth is loaded
console.log('Google OAuth Provider:', !!window.google);

// Test 2: Check backend API
fetch('https://YOUR_BACKEND_URL/api/bago/google-auth', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ accessToken: 'test' })
})
.then(r => r.json())
.then(d => console.log('Backend Response:', d))
.catch(e => console.error('Backend Error:', e));
```

Replace `YOUR_BACKEND_URL` with your actual backend domain.

---

## Most Common Fix

**90% of the time, the issue is:**

You need to add your Hostinger domain to Google Cloud Console.

### Quick Fix:
1. Go to: https://console.cloud.google.com/apis/credentials
2. Find your OAuth Client ID
3. Add your domain to BOTH:
   - Authorized JavaScript origins
   - Authorized redirect URIs
4. Save
5. Wait 10 minutes
6. Clear browser cache
7. Try again

---

## Advanced Debugging

### Check Your Current Google Cloud Console Settings

1. Go to: https://console.cloud.google.com/apis/credentials
2. Find: `207312508850-kgpk9uramqhjkhjeqds4bfdkotm1iqo0.apps.googleusercontent.com`
3. Screenshot what you see under:
   - Authorized JavaScript origins
   - Authorized redirect URIs

### Check Network Tab

1. Open browser Console (F12)
2. Go to **Network** tab
3. Click "Sign in with Google"
4. Look for requests to:
   - `accounts.google.com` (should succeed)
   - `your-backend/api/bago/google-auth` (check status code)

---

## What Information I Need

To help you debug further, tell me:

1. **Your exact Hostinger domain** (e.g., `https://baggo.app` or `https://www.baggo.app`)
2. **What error appears in the browser Console** (exact message)
3. **Did you add the domain to Google Cloud Console?** (Yes/No)
4. **What's in your Google Cloud Console right now?**
   - Authorized JavaScript origins: ___
   - Authorized redirect URIs: ___
5. **Is your backend accessible?** (What's the backend URL?)

---

## Expected Google Cloud Console Configuration

For domain: `https://yourdomain.com`

**Authorized JavaScript origins:**
```
http://localhost:5173
https://yourdomain.com
https://www.yourdomain.com
```

**Authorized redirect URIs:**
```
http://localhost:5173
https://yourdomain.com
https://yourdomain.com/login
https://yourdomain.com/signup
https://www.yourdomain.com
https://www.yourdomain.com/login
https://www.yourdomain.com/signup
```

---

**After you check the browser console and tell me the exact error, I can give you the precise fix!**
