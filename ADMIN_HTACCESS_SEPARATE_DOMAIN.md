# 🌐 Admin Panel .htaccess for Separate Domain

## For Hosting Admin on Different Domain

If your setup is:
- **Web App**: `https://yourdomain.com`
- **Admin Panel**: `https://admin.yourdomain.com` (or `https://different-domain.com`)

Here's the `.htaccess` configuration you need:

---

## 📁 .htaccess File

Create this file in the root directory where you upload the admin panel:

```apache
<IfModule mod_rewrite.c>
  # Enable Rewrite Engine
  RewriteEngine On

  # Set the base directory to root
  RewriteBase /

  # Handle React Router - redirect all requests to index.html
  # unless the request is for an actual file or directory
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME} !-l
  RewriteRule ^ index.html [L]
</IfModule>

# Security Headers
<IfModule mod_headers.c>
  # Prevent clickjacking
  Header always set X-Frame-Options "SAMEORIGIN"

  # XSS Protection
  Header always set X-XSS-Protection "1; mode=block"

  # Prevent MIME type sniffing
  Header always set X-Content-Type-Options "nosniff"

  # Referrer Policy
  Header always set Referrer-Policy "strict-origin-when-cross-origin"

  # CORS - Allow your main domain to access the admin API
  # Replace with your actual web app domain
  Header always set Access-Control-Allow-Origin "https://yourdomain.com"
  Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
  Header always set Access-Control-Allow-Headers "Content-Type, Authorization"
  Header always set Access-Control-Allow-Credentials "true"
</IfModule>

# Compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html
  AddOutputFilterByType DEFLATE text/css
  AddOutputFilterByType DEFLATE text/javascript
  AddOutputFilterByType DEFLATE text/xml
  AddOutputFilterByType DEFLATE text/plain
  AddOutputFilterByType DEFLATE application/xml
  AddOutputFilterByType DEFLATE application/xhtml+xml
  AddOutputFilterByType DEFLATE application/rss+xml
  AddOutputFilterByType DEFLATE application/javascript
  AddOutputFilterByType DEFLATE application/x-javascript
  AddOutputFilterByType DEFLATE application/json
</IfModule>

# Browser Caching
<IfModule mod_expires.c>
  ExpiresActive On

  # Images
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType image/x-icon "access plus 1 year"

  # CSS and JavaScript
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"

  # HTML (short cache for dynamic content)
  ExpiresByType text/html "access plus 0 seconds"

  # Fonts
  ExpiresByType font/woff2 "access plus 1 year"
  ExpiresByType font/woff "access plus 1 year"
  ExpiresByType font/ttf "access plus 1 year"
</IfModule>

# Force HTTPS
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteCond %{HTTPS} off
  RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
</IfModule>

# Prevent directory listing
Options -Indexes

# Custom Error Pages (optional)
ErrorDocument 404 /index.html
ErrorDocument 403 /index.html
ErrorDocument 500 /index.html
</IfModule>
```

---

## 📋 What This Does

### **1. React Router Support**
```apache
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.html [L]
```
- Redirects all non-file requests to `index.html`
- Allows React Router to handle navigation
- Works for routes like `/dashboard`, `/users`, `/trips`

### **2. CORS Headers**
```apache
Header always set Access-Control-Allow-Origin "https://yourdomain.com"
```
- **IMPORTANT**: Replace `https://yourdomain.com` with your actual web app domain
- Allows your web app to communicate with the admin API
- Required if admin and web app share the same backend

### **3. Security Headers**
- **X-Frame-Options**: Prevents clickjacking attacks
- **X-XSS-Protection**: Enables browser XSS protection
- **X-Content-Type-Options**: Prevents MIME type sniffing
- **Referrer-Policy**: Controls referrer information

### **4. Performance**
- **Compression**: Reduces file sizes (gzip)
- **Browser Caching**: Speeds up repeat visits
- **Force HTTPS**: Redirects HTTP to HTTPS automatically

---

## 🚀 How to Use

### **Step 1: Upload Files**

Upload the admin panel files to your separate domain's root directory:

```
/public_html/                  (on separate domain server)
├── index.html
├── .htaccess                  ← Create this file
├── assets/
│   ├── index-xxxxx.js
│   └── index-xxxxx.css
└── vite.svg
```

### **Step 2: Create .htaccess**

1. Create a new file named `.htaccess` (note the dot at the beginning)
2. Copy the configuration above
3. **Replace** `https://yourdomain.com` with your actual web app domain
4. Upload to the root directory

### **Step 3: Verify**

Test these URLs to ensure it works:

```
✅ https://admin.yourdomain.com
✅ https://admin.yourdomain.com/dashboard
✅ https://admin.yourdomain.com/users
✅ https://admin.yourdomain.com/trips
```

All should load the admin panel correctly.

---

## 🔧 Customization Options

### **If Using Multiple Domains for CORS**:

Replace the single CORS line with:

```apache
<IfModule mod_headers.c>
  # Allow multiple origins
  SetEnvIf Origin "^https://(yourdomain\.com|anotherdomain\.com)$" ORIGIN_ALLOWED=$0
  Header always set Access-Control-Allow-Origin %{ORIGIN_ALLOWED}e env=ORIGIN_ALLOWED
  Header always set Access-Control-Allow-Credentials "true"
</IfModule>
```

### **If You Don't Need CORS** (admin uses its own backend):

Remove the CORS section entirely:

```apache
# Remove these lines:
Header always set Access-Control-Allow-Origin "https://yourdomain.com"
Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
Header always set Access-Control-Allow-Headers "Content-Type, Authorization"
Header always set Access-Control-Allow-Credentials "true"
```

### **If You Want to Redirect Old Subdomain**:

If you previously had admin at `https://yourdomain.com/admin` and want to redirect:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteCond %{HTTP_HOST} ^yourdomain\.com$ [NC]
  RewriteCond %{REQUEST_URI} ^/admin
  RewriteRule ^admin(.*)$ https://admin.yourdomain.com$1 [R=301,L]
</IfModule>
```

---

## ⚠️ Important Notes

### **1. Domain Configuration**

Make sure your domain DNS is properly configured:
- **A Record** or **CNAME** pointing to your server
- **SSL Certificate** installed for HTTPS

### **2. Backend API URL**

Update your admin panel's `.env` or config file:

```env
VITE_API_URL=https://api.yourdomain.com/api
```

Or if using the same backend as web app:

```env
VITE_API_URL=https://neringa.onrender.com/api
```

### **3. Build Configuration**

If you haven't built the admin panel yet, update the API URL before building:

```bash
cd ADMIN_NEW
nano .env  # or use your editor
# Update VITE_API_URL to your backend URL
npm run build
```

Then upload the `dist/` contents to your separate domain.

---

## 📝 Quick Checklist

Before uploading:

- [ ] Created `.htaccess` file
- [ ] Updated CORS origin to your web app domain (or removed if not needed)
- [ ] Built admin panel with correct API URL
- [ ] SSL certificate installed on admin domain
- [ ] DNS configured for admin domain

After uploading:

- [ ] Verify homepage loads: `https://admin.yourdomain.com`
- [ ] Test navigation works: `/dashboard`, `/users`, etc.
- [ ] Check HTTPS redirect works
- [ ] Test admin login functionality
- [ ] Verify API calls work (check browser console)

---

## 🎯 Example Setup

**Scenario**:
- Main web app: `https://sendwithbago.com`
- Admin panel: `https://admin.sendwithbago.com`
- Backend API: `https://neringa.onrender.com/api`

**Admin .htaccess**:
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule ^ index.html [L]
</IfModule>

<IfModule mod_headers.c>
  Header always set Access-Control-Allow-Origin "https://sendwithbago.com"
  Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
  Header always set Access-Control-Allow-Headers "Content-Type, Authorization"
  Header always set Access-Control-Allow-Credentials "true"
</IfModule>

# ... rest of configuration
```

**Admin .env** (before building):
```env
VITE_API_URL=https://neringa.onrender.com/api
```

---

## 🚀 Ready to Use!

Copy the `.htaccess` content above, customize the CORS origin, and upload with your admin panel files!

**Need help with a specific configuration?** Let me know your domain setup!
