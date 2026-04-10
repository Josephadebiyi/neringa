# Hostinger Web App Upload Guide - Fix Google Auth Issue

## The Problem
You uploaded the **wrong folder** to Hostinger. You need to upload the **`dist/`** folder, not the **`static/`** folder.

---

## Solution: Upload the Correct Build

### ✅ What to Upload
**File Ready:** [BAGO_WEBAPP/HOSTINGER_UPLOAD.zip](BAGO_WEBAPP/HOSTINGER_UPLOAD.zip)

This ZIP contains:
- Latest production build (built just now)
- Correct `.htaccess` file for React Router
- Google OAuth Client ID configured
- All optimized assets

---

## Step-by-Step Upload Instructions

### Method 1: Upload ZIP (Recommended)

1. **Go to Hostinger File Manager**
   - Log in to Hostinger
   - Go to hPanel
   - Click **File Manager**

2. **Navigate to public_html**
   - Find your domain's root directory (usually `public_html`)
   - **IMPORTANT:** Delete all existing files first (backup if needed)

3. **Upload the ZIP**
   - Click **Upload** button
   - Select `HOSTINGER_UPLOAD.zip` from your computer
   - Wait for upload to complete

4. **Extract the ZIP**
   - Right-click on `HOSTINGER_UPLOAD.zip`
   - Click **Extract**
   - Select "Extract here"

5. **Move Files to Root**
   - You'll see a `dist/` folder
   - Move **everything inside `dist/`** to the root `public_html` directory
   - Delete the empty `dist/` folder and the ZIP file

6. **Verify `.htaccess` Exists**
   - Make sure `.htaccess` file is in the root `public_html` directory
   - If you can't see it, enable "Show Hidden Files" in File Manager settings

---

### Method 2: Upload Individual Files

If you prefer not to use ZIP:

1. **Go to Local Folder**
   - Navigate to: `/Users/j/Desktop/CLAUDE/BAGO/neringa/BAGO_WEBAPP/dist/`

2. **Upload ALL Files**
   - Including the `.htaccess` file (it's hidden, enable "Show Hidden Files" in Finder)
   - To show hidden files on Mac: Press `Cmd + Shift + .` in Finder

3. **Upload Structure Should Look Like:**
   ```
   public_html/
   ├── .htaccess          ← IMPORTANT!
   ├── index.html
   ├── assets/
   │   ├── index-CtkqWwb5.js
   │   ├── index-BLxTckmN.css
   │   └── ... (images)
   ├── bago_logo.png
   ├── hero.png
   └── ... (other files)
   ```

---

## After Upload: Fix Google Auth

### 1. Verify Domain in Google Cloud Console

Go to: https://console.cloud.google.com/apis/credentials

Find Client ID: `207312508850-kgpk9uramqhjkhjeqds4bfdkotm1iqo0.apps.googleusercontent.com`

### 2. Add Your Hostinger Domain

Click **Edit** and add:

**Authorized JavaScript origins:**
```
https://yourdomain.com
https://www.yourdomain.com
```

**Authorized redirect URIs:**
```
https://yourdomain.com
https://yourdomain.com/login
https://yourdomain.com/signup
https://www.yourdomain.com
https://www.yourdomain.com/login
https://www.yourdomain.com/signup
```

Replace `yourdomain.com` with your actual Hostinger domain.

### 3. Save and Wait
- Click **Save**
- Wait 5-10 minutes for changes to propagate

---

## Testing Your Deployment

### 1. Test Basic Loading
- Go to: `https://yourdomain.com`
- You should see your Bago homepage
- Check browser console (F12) for any errors

### 2. Test React Router
- Click on different pages (About, How It Works, etc.)
- Press **F5** (refresh) on any page
- **Expected:** Page should reload correctly, not show 404

### 3. Test Google Sign-In
- Go to: `https://yourdomain.com/login`
- Click "Sign in with Google"
- **Expected:** Google popup should open without errors
- **Expected:** After signing in, you should be redirected to dashboard

---

## Common Issues & Fixes

### Issue 1: "404 Not Found" When Refreshing Pages
**Cause:** `.htaccess` file is missing or not working

**Fix:**
1. Make sure `.htaccess` is in the root directory
2. Check that Apache `mod_rewrite` is enabled (usually enabled on Hostinger)
3. Try uploading the `.htaccess` again

### Issue 2: Google Auth Still Fails
**Cause:** Domain not added to Google Cloud Console yet

**Fix:**
1. Double-check you added the exact domain from the error message
2. Wait the full 10 minutes
3. Clear browser cache and try again
4. Try in Incognito mode

### Issue 3: Mixed Content Errors (HTTP vs HTTPS)
**Cause:** Some resources loading over HTTP instead of HTTPS

**Fix:**
1. `.htaccess` already has HTTPS redirect
2. Make sure your backend API also uses HTTPS
3. Check browser console for specific mixed content warnings

### Issue 4: "Access Denied" or Blank Page
**Cause:** File permissions issue

**Fix:**
1. Set directory permissions to `755`
2. Set file permissions to `644`
3. In Hostinger File Manager: Right-click → Change Permissions

---

## What's Different in This Build

### ✅ Includes `.htaccess`
- React Router support (refreshing pages works)
- HTTPS redirect
- Proper fallback configuration

### ✅ Latest Code
- Built from latest source code
- All recent fixes included
- Optimized for production

### ✅ Google OAuth Configured
- Client ID: `207312508850-kgpk9uramqhjkhjeqds4bfdkotm1iqo0.apps.googleusercontent.com`
- Ready to work once domain is added to Google Cloud Console

---

## Folder Comparison

| Folder | Status | Has .htaccess | Build Date | Use for Upload? |
|--------|--------|---------------|------------|-----------------|
| **dist/** | ✅ Current | ✅ Yes | Mar 15, 2026 | **YES - Use this!** |
| static/ | ❌ Old | ❌ No | Mar 7, 2026 | NO - Don't use |
| HOSTINGER_DEPLOYMENT/ | ❌ Archive | Unknown | Older | NO - Archive |

**Always upload from `dist/` folder!**

---

## Backend API Configuration

Your web app connects to backend at the domain configured in `src/api.js`.

### If Backend is Separate
Make sure your backend:
1. Has CORS enabled for your Hostinger domain
2. Uses HTTPS (required for Google OAuth)
3. Is accessible from your web app

### Current Backend
Based on the code, your backend should be configured in the environment variables or API config file.

---

## Checklist

- [ ] Deleted old files from Hostinger `public_html`
- [ ] Uploaded all files from `dist/` folder (or extracted ZIP)
- [ ] Verified `.htaccess` exists in root directory
- [ ] Added Hostinger domain to Google Cloud Console
- [ ] Waited 10 minutes for Google OAuth propagation
- [ ] Tested homepage loads correctly
- [ ] Tested React Router (refresh on different pages)
- [ ] Tested Google Sign-In works
- [ ] Cleared browser cache / tested in Incognito
- [ ] All pages load correctly ✅

---

## Files Location Summary

**Production Build (Upload This):**
```
/Users/j/Desktop/CLAUDE/BAGO/neringa/BAGO_WEBAPP/dist/
```

**ZIP File (Alternative Upload Method):**
```
/Users/j/Desktop/CLAUDE/BAGO/neringa/BAGO_WEBAPP/HOSTINGER_UPLOAD.zip
```

**Don't Upload This:**
```
/Users/j/Desktop/CLAUDE/BAGO/neringa/BAGO_WEBAPP/static/  ← OLD BUILD!
```

---

## After Successful Upload

Once everything is working:
1. Test all main features (sign up, sign in, post trip, send package)
2. Check mobile responsiveness
3. Test on different browsers (Chrome, Safari, Firefox)
4. Monitor browser console for any errors
5. Test Google Sign-In from different devices

---

**Your web app is now ready to deploy!** 🚀

Just upload the `dist/` folder contents to Hostinger and add your domain to Google Cloud Console.
