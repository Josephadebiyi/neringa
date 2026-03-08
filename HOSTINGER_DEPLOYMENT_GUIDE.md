# 🚀 Hostinger Unified Deployment Guide (March 8, 2026)

## ✅ Deployment Package Ready!

I have created a unified deployment folder containing the **latest builds** for both the Main Web App and the Admin Panel.

- **Unified Folder Path**: `/Users/j/Desktop/CLAUDE/BAGO/neringa/HOSTINGER_V3_READY_FOR_UPLOAD`

---

## 📂 Folder Structure Explanation

Your `HOSTINGER_V3_READY_FOR_UPLOAD` folder is structured to work perfectly with your domain:

| Level | Path | Contents | URL |
| :--- | :--- | :--- | :--- |
| **Root** | `public_html/` | Main Web App (latest /post-trip, /search, etc.) | `https://sendwithbago.com` |
| **Admin** | `public_html/admin/` | Admin Panel (Promo Engine, User Mgmt, Staff) | `https://sendwithbago.com/admin` |

---

## 📤 How to Deploy to Hostinger

### Step 1: Login to Hostinger File Manager
1. Go to [hpanel.hostinger.com](https://hpanel.hostinger.com/).
2. Select **sendwithbago.com** and open **File Manager**.
3. Navigate into the **`public_html`** folder.

### Step 2: Clear Old Files (Important)
1. Select all files currently in `public_html`.
2. Delete them (or move them to a backup folder) to ensure a clean install.

### Step 3: Upload the Main Web App
1. Go into `HOSTINGER_V3_READY_FOR_UPLOAD`.
2. Upload all files and folders (except the `admin` folder) directly into `public_html`.
3. **Crucial**: Ensure the `.htaccess` file is uploaded to the root of `public_html`.

### Step 4: Upload the Admin Panel
1. Inside `public_html` on Hostinger, **create a new folder** named `admin`.
2. Open the `admin` folder.
3. Upload everything from `HOSTINGER_V3_READY_FOR_UPLOAD/admin/` into this folder.
4. **Crucial**: Ensure the `.htaccess` file inside the `admin` folder is also uploaded there.

---

## 🔑 Admin Login Credentials
- **URL**: `https://sendwithbago.com/admin`
- **Username**: `admin`
- **Password**: `123456789`
*(Note: You can change these or add sub-admins in the Staff section once logged in.)*

---

## ✅ Post-Deployment Checklist

Test these URLs to ensure everything is perfect:
- [ ] **Home**: `https://sendwithbago.com`
- [ ] **Post Trip**: `https://sendwithbago.com/post-trip`
- [ ] **Search**: `https://sendwithbago.com/search`
- [ ] **Admin Panel**: `https://sendwithbago.com/admin`

---

## 🔍 Troubleshooting (Routing Fix)
If you click a page like `/post-trip` and it says **404**, it means the `.htaccess` file is missing.
- **Main App .htaccess**: Must be in `public_html/`
- **Admin Panel .htaccess**: Must be in `public_html/admin/`

---

**Package Details:**
- **Date**: March 8, 2026
- **Source**: `HOSTINGER_V3_READY_FOR_UPLOAD`
- **Features**: Embedded promo images, BCC email privacy, staff management, optimized KYC routes.
