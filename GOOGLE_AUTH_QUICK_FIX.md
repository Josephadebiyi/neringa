# Google Auth Quick Fix - Step by Step

## 🔧 Immediate Action Required

### Step 1: Upload Test Page
I created a diagnostic tool for you. Upload this file to Hostinger:

**File:** `/Users/j/Desktop/CLAUDE/BAGO/neringa/BAGO_WEBAPP/dist/test-google-auth.html`

**Upload to:** Your Hostinger `public_html` directory

### Step 2: Visit Test Page
Go to: `https://yourdomain.com/test-google-auth.html`

(Replace `yourdomain.com` with your actual domain)

### Step 3: Run Tests
1. Test 1 will auto-run (checks if Google library loads)
2. Click "Sign in with Google" button
3. **Watch for the exact error message**
4. Enter your backend URL and click "Test Backend"

### Step 4: Tell Me the Error
The test page will show you the **exact error**. Common ones:

---

## 🔍 Expected Errors and Fixes

### Error: "idpiframe_initialization_failed"

**This means:** Your domain is NOT in Google Cloud Console yet.

**Fix:**
1. Go to: https://console.cloud.google.com/apis/credentials
2. Click on: `207312508850-kgpk9uramqhjkhjeqds4bfdkotm1iqo0.apps.googleusercontent.com`
3. Under **"Authorized JavaScript origins"**, click "ADD URI"
4. Add your domain EXACTLY as shown in the test page (e.g., `https://yourdomain.com`)
5. Click **Save**
6. Wait 10 minutes
7. Test again

---

### Error: "popup_failed_to_open" or "popup_blocked_by_browser"

**This means:** Browser is blocking the popup.

**Fix:**
1. Look for popup blocker icon in address bar
2. Allow popups for your domain
3. Try again

---

### Error: "Backend is unreachable" or CORS error

**This means:** Your backend isn't accessible or doesn't allow your domain.

**Fix:**
1. Make sure backend is running
2. Check backend CORS settings allow your Hostinger domain
3. Make sure backend URL is correct (https, not http)

---

## 📋 Quick Checklist

Before using the test page, check:

- [ ] I uploaded the correct `dist/` folder to Hostinger
- [ ] I can see my website at https://yourdomain.com
- [ ] I uploaded `test-google-auth.html` to Hostinger
- [ ] I can access https://yourdomain.com/test-google-auth.html
- [ ] I know my backend URL

---

## 🎯 Most Likely Solution

**90% chance the issue is:**

Your domain is NOT in Google Cloud Console yet.

### Quick Fix (5 minutes):

1. Go to: https://console.cloud.google.com/apis/credentials
2. Sign in with the account that created the project
3. Find: `207312508850-kgpk9uramqhjkhjeqds4bfdkotm1iqo0.apps.googleusercontent.com`
4. Click the **pencil icon (Edit)**
5. Scroll to **"Authorized JavaScript origins"**
6. Click **"+ ADD URI"**
7. Enter: `https://yourdomain.com` (your actual domain)
8. If you use www, also add: `https://www.yourdomain.com`
9. Scroll to **"Authorized redirect URIs"**
10. Click **"+ ADD URI"** and add:
    - `https://yourdomain.com`
    - `https://yourdomain.com/login`
    - `https://yourdomain.com/signup`
11. Click **SAVE** at the bottom
12. Wait 10 minutes for Google to propagate changes
13. Clear browser cache (or use Incognito mode)
14. Test again

---

## 🆘 After Running Test Page

Send me:

1. **Screenshot of the test page results**
2. **The exact error message** from Test 2
3. **Your Hostinger domain** (e.g., baggo.app)
4. **Your backend URL**
5. **Did you add domain to Google Cloud Console?** (Yes/No)

Then I can give you the exact fix!

---

## 📞 Contact Info

**Google Cloud Console:**
- Project: Your Bago project
- Client ID: `207312508850-kgpk9uramqhjkhjeqds4bfdkotm1iqo0.apps.googleusercontent.com`

**Backend Endpoint:**
- Route: `/api/bago/google-auth`
- Method: POST
- Expects: `{ idToken: "..." }` or `{ accessToken: "..." }`

---

**Upload test-google-auth.html now and visit it to see the exact error!**
