# Security Guide for API Keys and Secrets

## ✅ Current Security Status

✅ **Good News:** Your `.gitignore` is properly configured to exclude `.env` files
✅ **Good News:** No `.env` files have been committed to git history
✅ **Good News:** Your secrets are safe in version control

## 🔒 API Key Security Best Practices

### 1. Never Share API Keys Publicly
- ❌ **DO NOT** share keys in chat, email, or messaging apps
- ❌ **DO NOT** commit keys to GitHub, even in private repos
- ❌ **DO NOT** store keys in code files
- ✅ **DO** use environment variables (`.env` files)
- ✅ **DO** use secure password managers for team sharing
- ✅ **DO** use platform-specific secret management (Render Environment Variables, AWS Secrets Manager, etc.)

### 2. Managing Your .env File

Your `.env` file contains sensitive credentials. Here's what's in it:

**Critical Secrets (NEVER share these):**
- `STRIPE_SECRET_KEY` - Payment processing
- `MONGODB_URI` - Database access (contains password)
- `RESEND_API_KEY` - Email service
- `JWT_SECRET` - Authentication security
- `ADMIN_SECRET_KEY` - Admin access
- `GOOGLE_CLIENT_SECRET` - OAuth authentication
- `DIDIT_API_KEY` - KYC verification
- `CLOUDINARY_API_SECRET` - Image storage

**Safe to Share (Public keys):**
- Stripe Publishable Key (`pk_test_` or `pk_live_`) - Used in frontend
- Google Client ID - Used in frontend
- Cloudinary Cloud Name - Public identifier

### 3. How to Safely Add Your Stripe Key

**Method 1: Direct File Edit (Recommended)**
```bash
# Open .env in your editor
nano baggo/backend/.env  # or use VS Code, vim, etc.

# Replace line 22:
STRIPE_SECRET_KEY=sk_live_YOUR_ACTUAL_KEY_HERE

# Save and exit
```

**Method 2: Using sed (Command line)**
```bash
cd baggo/backend
sed -i '' 's/STRIPE_SECRET_KEY=.*/STRIPE_SECRET_KEY=sk_live_YOUR_ACTUAL_KEY_HERE/' .env
```

After saving, your backend will auto-restart and you should see:
```
✅ Stripe initialized successfully
```

### 4. Production Environment (Render)

On Render, set environment variables through the dashboard:

1. Go to your service → **Environment** tab
2. Add variable: `STRIPE_SECRET_KEY`
3. Paste your key (starts with `sk_live_` or `sk_test_`)
4. **Important:** No quotes, no extra spaces
5. Save and Render will auto-deploy

### 5. Key Rotation (When to Change Keys)

**Rotate your keys immediately if:**
- ❌ You accidentally shared them publicly (chat, screenshot, commit)
- ❌ A team member with access left
- ❌ You suspect unauthorized access
- ❌ It's been more than 90 days (best practice)

**How to rotate Stripe keys:**
1. Go to https://dashboard.stripe.com/apikeys
2. Click "Roll" on the exposed key
3. Copy the new key
4. Update `.env` locally
5. Update Render environment variables
6. The old key stops working immediately

### 6. What Keys Are Currently Exposed

Based on the conversation history, you may have shared:
- ✅ Stripe Publishable Key (`pk_live_...`) - This is OK, it's meant to be public
- ❌ Stripe Secret Key (`sk_live_...`) - **You should rotate this immediately**

**Action Required:** Go to https://dashboard.stripe.com/apikeys and roll your secret key.

## 📋 Checklist for Securing Your App

- [x] `.env` is in `.gitignore`
- [x] No secrets in git history
- [ ] Rotate any exposed Stripe keys
- [ ] Add Stripe key to local `.env` (do this manually)
- [ ] Verify Stripe key on Render environment variables
- [ ] Use password manager for team key sharing (if applicable)

## 🚨 If You Think Keys Were Exposed

1. **Rotate all exposed keys immediately**
2. **Check access logs** on respective services (Stripe, MongoDB Atlas, etc.)
3. **Enable 2FA** on all service accounts
4. **Review recent activity** for unauthorized usage
5. **Update keys** in all environments (local, Render, team members)

## 📞 Support Resources

- Stripe Security: https://stripe.com/docs/security/guide
- MongoDB Security: https://www.mongodb.com/docs/manual/security/
- Render Secrets: https://render.com/docs/configure-environment-variables

---

**Remember:** When in doubt, rotate the key. It takes 2 minutes and prevents potentially costly security breaches.
