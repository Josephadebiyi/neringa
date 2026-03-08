# 🏢 Admin Panel Deployment Guide

## ✅ Step 1: Build the Admin Panel
I've already prepared the latest version for you.
- **Project Folder**: `baggo/boggoAdmin`
- **Build Output**: `baggo/boggoAdmin/dist` (Updated with latest hierarchy)

---

## ☁️ Step 2: Deployment to Hostinger (Recommended)

To host your admin panel at **`https://sendwithbago.com/admin`**:

1.  **Login to Hostinger File Manager**
2.  Go to `public_html/`
3.  **Create a new folder** named `admin`
4.  **Upload the contents** of `baggo/boggoAdmin/dist/` into this new `admin` folder.
5.  **Important**: Ensure you have an `.htaccess` file inside the `admin` folder with the following content (to handle React routing):

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /admin/
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME} !-l
  RewriteRule . /admin/index.html [L]
</IfModule>
```

---

## 🔑 Login & Dashboard Access

- **Login URL**: `https://sendwithbago.com/admin`
- **Success Behavior**: Once you enter the correct credentials, the application will automatically synchronize permissions and redirect you to the **Main Dashboard**.
- **Credentials**:
  - **Username**: `admin`
  - **Password**: `123456789`

---

## 🔍 Hosting Summary

| Component | Live URL | Hosting Platform |
| :--- | :--- | :--- |
| **Main Web App** | [sendwithbago.com](https://sendwithbago.com) | Hostinger |
| **Admin Panel** | [sendwithbago.com/admin](https://sendwithbago.com/admin) | Hostinger |
| **API Backend** | [neringa.onrender.com](https://neringa.onrender.com) | Render |

---
**Current Status**: 
- All routes are pointing to the live production backend.
- The Admin Panel is fully synchronized with the hierarchical staff system.
- Login redirection has been tested to open the Dashboard immediately upon success.
