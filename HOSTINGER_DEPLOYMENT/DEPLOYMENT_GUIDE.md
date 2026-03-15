# 🚀 Hostinger Deployment Guide - Bago Platform

## ✅ Files Ready for Upload!

All build files are prepared in the `HOSTINGER_DEPLOYMENT` folder:
- ✅ **webapp/** - Main web application
- ✅ **admin/** - Admin panel
- ✅ **.htaccess** - Apache configuration for routing

---

## 📁 Folder Structure

```
HOSTINGER_DEPLOYMENT/
├── webapp/           ← Upload to public_html/
│   ├── index.html
│   ├── assets/
│   └── .htaccess
│
├── admin/            ← Upload to public_html/admin/
│   ├── index.html
│   ├── assets/
│   └── .htaccess
│
└── DEPLOYMENT_GUIDE.md  ← This file
```

---

## 🔧 Step-by-Step Deployment

### **Step 1: Access Hostinger File Manager**

1. Log in to your **Hostinger control panel**
2. Go to **Files** → **File Manager**
3. Navigate to **public_html** folder

### **Step 2: Upload Web App (Main Site)**

1. **Delete** existing files in `public_html` (if any):
   - Select all files
   - Click **Delete**

2. **Upload** the contents of `HOSTINGER_DEPLOYMENT/webapp/`:
   - Click **Upload** button
   - Select ALL files from `webapp` folder:
     - `index.html`
     - `assets/` folder
     - `.htaccess`
   - Wait for upload to complete

3. **Verify** files:
   ```
   public_html/
   ├── index.html
   ├── assets/
   │   ├── index-XXXXX.css
   │   └── index-XXXXX.js
   └── .htaccess
   ```

### **Step 3: Upload Admin Panel**

1. **Create** `admin` folder in `public_html`:
   - Click **New Folder**
   - Name: `admin`

2. **Open** the `admin` folder

3. **Upload** the contents of `HOSTINGER_DEPLOYMENT/admin/`:
   - Click **Upload**
   - Select ALL files from `admin` folder:
     - `index.html`
     - `assets/` folder
     - `.htaccess`
   - Wait for upload to complete

4. **Verify** files:
   ```
   public_html/admin/
   ├── index.html
   ├── assets/
   │   ├── index-XXXXX.css
   │   └── index-XXXXX.js
   └── .htaccess
   ```

---

## 🌐 Access Your Sites

After deployment:

| Application | URL | Purpose |
|-------------|-----|---------|
| **Web App** | https://yourdomain.com | Main user-facing site |
| **Admin Panel** | https://yourdomain.com/admin | Admin dashboard |

---

## ⚙️ Important Configuration

### **Backend API URL**

Both apps are configured to use:
```
API URL: https://neringa.onrender.com/api
```

If your backend is hosted elsewhere, you need to rebuild with the correct URL:

```bash
# For Web App:
cd BAGO_WEBAPP
# Edit .env file:
VITE_API_URL=https://your-backend-url.com/api
npm run build

# For Admin Panel:
cd ADMIN_NEW
# Edit .env file:
VITE_API_URL=https://your-backend-url.com/api
npm run build
```

Then re-upload the new `dist` folders.

---

## 🔍 Testing After Deployment

### **Test 1: Web App**
1. Visit: https://yourdomain.com
2. Check: Home page loads
3. Test: Navigation works (About, Search, etc.)
4. Verify: No 404 errors when refreshing pages

### **Test 2: Admin Panel**
1. Visit: https://yourdomain.com/admin
2. Login with credentials:
   - Username: `admin`
   - Password: `123456789`
3. Check: Dashboard loads
4. Test: All admin features work

### **Test 3: API Connection**
1. Open browser console (F12)
2. Check for errors
3. Verify: API calls go to `https://neringa.onrender.com/api`

---

## 🐛 Troubleshooting

### **Issue: 404 Error on Page Refresh**

**Cause**: `.htaccess` not uploaded or not working

**Fix**:
1. Make sure `.htaccess` is in both `public_html/` and `public_html/admin/`
2. Check if Apache `mod_rewrite` is enabled (usually is on Hostinger)
3. Clear browser cache and try again

### **Issue: "Failed to load resource" errors**

**Cause**: Files not uploaded correctly

**Fix**:
1. Verify all `assets/` files are uploaded
2. Check file permissions (should be 644 for files, 755 for folders)
3. Re-upload if needed

### **Issue: "Cannot connect to server" / API errors**

**Cause**: Backend API not responding

**Fix**:
1. Check if backend is running: https://neringa.onrender.com/health
2. Check browser console for CORS errors
3. Verify VITE_API_URL is correct in build

### **Issue: Admin login not working**

**Cause**: Wrong API URL or backend issue

**Fix**:
1. Check browser console for error messages
2. Try logging in at: https://neringa.onrender.com (backend direct)
3. Verify admin credentials: `admin / 123456789`

### **Issue: Blank white page**

**Cause**: JavaScript error or wrong base path

**Fix**:
1. Open browser console (F12)
2. Look for red errors
3. Check if index.html is in root folder
4. Clear cache and refresh

---

## 📊 File Sizes

Current build sizes:

### Web App:
- Total: ~925 KB
- CSS: ~116 KB (gzipped: 36 KB)
- JS: ~809 KB (gzipped: 234 KB)

### Admin Panel:
- Total: ~796 KB
- CSS: ~61 KB (gzipped: 11 KB)
- JS: ~735 KB (gzipped: 201 KB)

These are good sizes and will load quickly with gzip compression enabled.

---

## 🔐 Security Features

The `.htaccess` file includes:

✅ **React Router support** - Proper URL routing
✅ **GZIP compression** - Faster load times
✅ **Browser caching** - Better performance
✅ **Security headers**:
- Clickjacking protection
- MIME type sniffing prevention
- XSS protection
- Referrer policy

---

## 🎯 Post-Deployment Checklist

After uploading, verify:

- [ ] Web app loads at https://yourdomain.com
- [ ] Admin panel loads at https://yourdomain.com/admin
- [ ] Navigation works (no 404s)
- [ ] Admin login works
- [ ] API calls succeed (check browser console)
- [ ] Images/assets load correctly
- [ ] Mobile responsive design works
- [ ] HTTPS is enabled (Hostinger provides free SSL)

---

## 🔄 Future Updates

When you make changes:

1. **Make changes** to source code (BAGO_WEBAPP or ADMIN_NEW)
2. **Rebuild**:
   ```bash
   cd BAGO_WEBAPP
   npm run build
   # OR
   cd ADMIN_NEW
   npm run build
   ```
3. **Upload** only the changed files from `dist/` folder
4. **Clear cache** on browser to see changes

---

## 📱 Mobile App Note

The mobile app (BAGO_MOBILE) is NOT included in this deployment.

Mobile apps are distributed through:
- **iOS**: Apple App Store (requires Xcode build)
- **Android**: Google Play Store (requires Android Studio build)

For mobile app deployment, you'll need to:
1. Build `.ipa` file (iOS)
2. Build `.apk` or `.aab` file (Android)
3. Submit to respective app stores

---

## 💡 Performance Tips

### **Enable Hostinger CDN** (if available):
1. Go to Hostinger dashboard
2. Enable CDN for faster global delivery

### **Optimize Images**:
- Compress images before uploading
- Use WebP format when possible
- Lazy load images

### **Monitor Performance**:
- Use Google PageSpeed Insights
- Check https://yourdomain.com with Lighthouse
- Aim for 90+ performance score

---

## 🆘 Need Help?

### **Common Commands for Rebuilding:**

```bash
# Rebuild Web App
cd BAGO_WEBAPP
npm run build
# Files will be in: dist/

# Rebuild Admin Panel
cd ADMIN_NEW
npm run build
# Files will be in: dist/

# Both files are production-optimized and minified
```

### **Quick Re-deployment:**

```bash
# From project root:
cd BAGO_WEBAPP && npm run build
cd ../ADMIN_NEW && npm run build

# Then upload new dist/ folders to Hostinger
```

---

## ✅ Summary

**You're ready to deploy!** 🎉

1. **Upload `webapp/`** to `public_html/`
2. **Upload `admin/`** to `public_html/admin/`
3. **Visit your domain** to see it live!

The builds are:
- ✅ Production-optimized
- ✅ Minified for performance
- ✅ Configured for https://neringa.onrender.com backend
- ✅ Ready for React Router
- ✅ Secured with proper headers

**Good luck with your deployment!** 🚀
