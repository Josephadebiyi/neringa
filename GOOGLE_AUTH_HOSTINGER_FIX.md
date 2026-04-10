# Fix Google Auth on Hostinger - Step by Step Guide

## Problem
Getting "googleAuthFailed" error when users try to sign in with Google on your Hostinger-hosted web app.

## Root Cause
Your Hostinger domain is not authorized in Google Cloud Console. Google OAuth requires all domains to be explicitly whitelisted.

---

## Solution: Add Hostinger Domain to Google Cloud Console

### Step 1: Get Your Hostinger Domain
First, identify your exact domain. Examples:
- `https://yourdomain.com`
- `https://www.yourdomain.com`
- `https://bago.yourdomain.com`

**Important:** Note whether you use `www` or not - you may need to add both versions.

---

### Step 2: Access Google Cloud Console

1. Go to: https://console.cloud.google.com/apis/credentials
2. Sign in with your Google account (the one that created the project)
3. Select your project from the dropdown at the top

---

### Step 3: Edit OAuth 2.0 Client ID

1. Find the credential with Client ID: `207312508850-kgpk9uramqhjkhjeqds4bfdkotm1iqo0.apps.googleusercontent.com`
2. Click the **✏️ Edit** icon (pencil icon) on the right

---

### Step 4: Add Authorized JavaScript Origins

Under **"Authorized JavaScript origins"**, click **"+ ADD URI"** and add:

```
https://yourdomain.com
```

If you use `www`, also add:
```
https://www.yourdomain.com
```

**Example:**
```
https://baggo.app
https://www.baggo.app
```

---

### Step 5: Add Authorized Redirect URIs

Under **"Authorized redirect URIs"**, click **"+ ADD URI"** and add these:

```
https://yourdomain.com
https://yourdomain.com/login
https://yourdomain.com/signup
```

If you use `www`, also add the www versions:
```
https://www.yourdomain.com
https://www.yourdomain.com/login
https://www.yourdomain.com/signup
```

**Example:**
```
https://baggo.app
https://baggo.app/login
https://baggo.app/signup
https://www.baggo.app
https://www.baggo.app/login
https://www.baggo.app/signup
```

---

### Step 6: Save Changes

1. Scroll down and click **"SAVE"**
2. Wait 5-10 minutes for changes to propagate

---

## Step 7: Verify HTTPS is Working

Google OAuth **requires HTTPS** (not HTTP) in production.

1. Visit your Hostinger site: `https://yourdomain.com`
2. Check the browser address bar for a padlock 🔒 icon
3. If you see "Not Secure" or get redirected to HTTP:
   - Make sure SSL certificate is installed in Hostinger
   - Check that the `.htaccess` file has the HTTPS redirect (already configured)

---

## Step 8: Test Google Sign In

1. Clear your browser cache and cookies (or use Incognito mode)
2. Go to your Hostinger site
3. Click "Sign in with Google"
4. Complete the Google sign-in flow
5. You should be redirected back and logged in successfully

---

## Troubleshooting

### Still Getting "googleAuthFailed"?

**Check Browser Console:**
1. Open Developer Tools (F12 or Right-click → Inspect)
2. Go to the **Console** tab
3. Look for error messages (they often show the exact issue)

**Common Issues:**

1. **"redirect_uri_mismatch"**
   - The URI in the error message shows what Google received
   - Add that exact URI to "Authorized redirect URIs" in Step 5

2. **"origin_mismatch"**
   - The origin in the error message shows what Google received
   - Add that exact origin to "Authorized JavaScript origins" in Step 4

3. **"Cookies blocked"**
   - Some browsers block third-party cookies
   - Make sure your site uses HTTPS
   - Check browser cookie settings

4. **"Popup blocked"**
   - Browser blocked the Google sign-in popup
   - Allow popups for your domain
   - Or try a different browser

---

## Current Configuration

**Google Client ID (Web):**
```
207312508850-kgpk9uramqhjkhjeqds4bfdkotm1iqo0.apps.googleusercontent.com
```

**Currently Authorized Domains (need to add your Hostinger domain):**
- Localhost (for development)
- You need to add your production domain

---

## Need to Add Multiple Domains?

If you have multiple domains (staging, production, www vs non-www), add them all:

**Example Setup:**
- Development: `http://localhost:5173`
- Staging: `https://staging.yourdomain.com`
- Production: `https://yourdomain.com`
- Production (www): `https://www.yourdomain.com`

Add all of them to both "Authorized JavaScript origins" AND "Authorized redirect URIs".

---

## Summary Checklist

- [ ] Identified exact Hostinger domain (with or without www)
- [ ] Added domain to "Authorized JavaScript origins"
- [ ] Added domain/login and domain/signup to "Authorized redirect URIs"
- [ ] Saved changes in Google Cloud Console
- [ ] Waited 5-10 minutes for propagation
- [ ] Verified HTTPS is working (padlock icon in browser)
- [ ] Tested Google sign-in in Incognito mode
- [ ] Google sign-in works successfully ✅

---

## Additional Notes

- The Google OAuth client ID is already configured in your web app code ([BAGO_WEBAPP/src/App.jsx:27](BAGO_WEBAPP/src/App.jsx#L27))
- Your backend CORS is configured to accept all origins, so that won't block the request
- The `.htaccess` file already has HTTPS redirect configured
- No code changes are needed - just the Google Cloud Console configuration

---

**After completing these steps, Google authentication should work on your Hostinger domain!**
