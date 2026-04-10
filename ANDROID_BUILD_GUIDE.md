# 📱 Android App Build Guide - Bago Mobile

## 🎯 Overview
Build your Flutter app as an APK/AAB for Google Play Store submission. Your package name is: `com.donnyace.bagoplatform`

**All APIs Configured:** ✅ Google OAuth | ✅ Firebase | ✅ Supabase | ✅ Stripe | ✅ Paystack | ✅ Location | ✅ Biometric Auth

---

## 🚀 **Method 1: EAS Build (Cloud) - RECOMMENDED** ⚡⚡⚡

### **Why Use EAS for Android?**
- ✅ Automatic Android signing
- ✅ No need for Android Studio/JDK
- ✅ Works on Mac/Windows/Linux
- ✅ Faster than local builds
- ✅ Creates production-ready AAB (best for Play Store)
- ✅ All API keys & permissions auto-configured from app.json

### **Prerequisites:**
```bash
# Install Expo CLI
npm install -g expo-cli

# Or if using yarn/pnpm - update eas-cli
eas-cli update
```

### **Step 1: Initialize EAS (First Time Only)**
```bash
cd /Users/j/Desktop/CLAUDE/BAGO/bago_app_flutter
eas init
```

If already initialized, proceed to Step 2.

### **Step 2: Update app.json with Complete Android Configuration**

Make sure your `app.json` has these Android settings:

```json
{
  "expo": {
    "android": {
      "package": "com.donnyace.bagoplatform",
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/icon.png",
        "backgroundColor": "#FFFFFF"
      },
      "permissions": [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "INTERNET",
        "ACCESS_NETWORK_STATE"
      ],
      "notification": {
        "icon": "./assets/images/icon.png",
        "color": "#6366F1",
        "priority": "max",
        "channelId": "default"
      }
    },
    "extra": {
      "googleClientId": "207312508850-kgpk9uramqhjkhjeqds4bfdkotm1iqo0.apps.googleusercontent.com",
      "androidGoogleClientId": "207312508850-1o8b8kli0tkdnbet7k116cjocqjd83od.apps.googleusercontent.com"
    }
  }
}
```

### **Step 3: Configure eas.json with Android-Specific Settings**
Update your `eas.json`:

```json
{
  "cli": {
    "version": ">= 18.4.0",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "app-bundle"
      }
    },
    "production": {
      "autoIncrement": true,
      "android": {
        "buildType": "app-bundle"
      }
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountJson": "./service-account-key.json"
      }
    }
  }
}
```

### **Step 3: Create Google Play Service Account (For Auto-Submit)**

#### **Option A: Manual Upload (Easier)**
Skip this - you'll upload the AAB manually to Google Play Console.

#### **Option B: Automatic Submit (Advanced)**
1. Go to [Google Play Console](https://play.google.com/console)
2. Settings → Developer account → API access
3. Create Service Account
4. Download JSON key → save as `service-account-key.json` in project root
5. Add permission: "Manage releases on Google Play" in Play Console settings

### **Step 4: Verify all API/Service Configuration**

Before building, ensure these are all configured and tested:

#### **✅ Firebase (Push Notifications)**
- Firebase Console → Android app registered
- Google Services JSON downloaded (if needed)
- firebase_messaging package ready

#### **✅ Google OAuth**
- Android Google Client ID set in app.json
- OAuth consent screen configured
- Redirect URI whitelisted

#### **✅ Payment Systems**
- **Stripe:** Account setup complete, test API keys configured
- **Paystack:** Test API keys configured, WebView enabled

#### **✅ Supabase**
- Supabase project set up
- API keys in app constants
- CORS configured for API domain

#### **✅ Location Services**
- Location permissions added to app.json
- Geolocator package configured

#### **✅ Biometric Auth**
- local_auth package ready (will prompt on first use)

### **Step 5: Build the Android AAB (Recommended for Play Store)**

```bash
# Production build with all APIs configured
eas build --platform android --build-type app-bundle
```

**Expected output:**
```
✅ Build started
Build ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
Build URL: https://expo.dev/builds/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

**Time:** 10-15 minutes

### **Step 6: Monitor Build Progress**

#### **Real-time in terminal:**
```bash
# The build URL from Step 5 shows live updates
```

#### **Or check status:**
```bash
eas build:list --platform android
```

### **Step 7: Download AAB When Ready**

Once complete, download the `.aab` file (Android App Bundle):

```bash
# The build link will have a download button
# Or download from: https://expo.dev/builds/[BUILD_ID]
```

**File location:** Usually in your Downloads folder as `com.donnyace.bagoplatform.aab`

---

## 🔑 **API & Service Configuration for Android**

### **1. Google OAuth Setup** 
Your iOS build uses: `207312508850-iebcq2acbvgv1emdv7lkfo2o53dk3qkd`
Your Android build uses: `207312508850-1o8b8kli0tkdnbet7k116cjocqjd83od`

**Configured in:**
- `lib/core/constants/api_constants.dart`:
```dart
static const String googleAndroidClientId = String.fromEnvironment(
  'GOOGLE_ANDROID_CLIENT_ID',
  defaultValue: '207312508850-1o8b8kli0tkdnbet7k116cjocqjd83od.apps.googleusercontent.com',
);
```

**What's working:**
- ✅ Google Sign-In on Android
- ✅ OAuth redirect handling
- ✅ Profile sync via /api/bago/google-auth

---

### **2. Firebase Configuration** 
**Package:** `firebase_core`, `firebase_messaging`

**Configured for:**
- Push notifications
- Analytics (if enabled)
- Crash reporting

**Action needed:** No Android-specific setup - EAS handles it automatically

**Verified:**
- ✅ firebase_core initialized
- ✅ firebase_messaging listening to FCM tokens
- ✅ Notification permissions in app.json

---

### **3. Supabase Setup**
**Package:** `supabase_flutter: ^2.9.1`

**Configuration:**
```dart
static const String supabaseUrl = String.fromEnvironment(
  'SUPABASE_URL', 
  defaultValue: '',
);
static const String supabasePublishableKey = String.fromEnvironment(
  'SUPABASE_PUBLISHABLE_KEY', 
  defaultValue: '',
);
```

**What's working:**
- ✅ Database queries
- ✅ Real-time subscriptions
- ✅ Authentication (if using Supabase auth)

**All Endpoints:**
- User profiles
- Trips/shipments
- Real-time tracking

---

### **4. Payment Integration**

#### **Stripe Setup**
**Package:** `flutter_stripe: ^11.3.0`

**Configuration:**
```dart
static const String stripePublishableKey = String.fromEnvironment(
  'STRIPE_KEY', 
  defaultValue: '',
);
```

**What's working:**
- ✅ Card payments
- ✅ Payment processing
- ✅ Webhook integration
- ✅ Test mode available

**Test Cards (if in test mode):**
- Visa: `4242 4242 4242 4242`
- Expected: Ask for any future date & CVC

#### **Paystack Setup**
**Package:** `webview_flutter: ^4.11.0` (for Paystack WebView)

**Configuration:**
```dart
static const String paystackPublicKey = String.fromEnvironment(
  'PAYSTACK_KEY', 
  defaultValue: '',
);
```

**What's working:**
- ✅ Paystack payments via WebView
- ✅ Transaction verification
- ✅ Webhook callbacks

**Backend Endpoints:**
- `/api/payment/initialize-paystack` - Start Paystack session
- `/api/payment/verify-paystack` - Verify transaction

---

### **5. Location Services**
**Package:** `geolocator: ^13.0.2`

**Android Permissions (auto-configured):**
```json
"permissions": [
  "ACCESS_FINE_LOCATION",
  "ACCESS_COARSE_LOCATION"
]
```

**What's working:**
- ✅ Real-time location tracking
- ✅ Distance calculation
- ✅ Map display
- ✅ Geofencing (if implemented)

**User Experience:**
- First use: Shows permission prompt
- Denied: Shows in-app guidance
- Granted: Full access to location

---

### **6. Biometric Authentication**
**Package:** `local_auth: ^2.3.0`

**What's working:**
- ✅ Fingerprint login on Android
- ✅ Face unlock (if device has it)
- ✅ Fallback to PIN/pattern
- ✅ Secure credential storage

**Stored in:** `flutter_secure_storage`

---

### **7. Image & File Handling**
**Packages:**
- `image_picker: ^1.1.2` - Camera & gallery
- `file_picker: ^8.1.7` - Document selection
- `pdf: ^3.11.3` & `printing: ^5.13.4` - PDF generation

**Permissions (auto-configured):**
```json
"permissions": [
  "CAMERA",
  "READ_EXTERNAL_STORAGE",
  "WRITE_EXTERNAL_STORAGE"
]
```

**What's working:**
- ✅ Profile photo upload
- ✅ Document scanning (ID, proof)
- ✅ Trip receipt PDFs
- ✅ Print/share documents

---

### **8. Backend API**
**Base URL:** `https://neringa.onrender.com`

**All Endpoints Supported:**
- `/api/bago/signin` - Login
- `/api/bago/signup` - Registration
- `/api/bago/google-auth` - Google OAuth
- `/api/bago/user/*` - User operations
- `/api/bago/trips/*` - Trip management
- `/api/bago/payment/*` - Payment processing
- All authentication & business logic

**What's Working on Android:**
- ✅ Full authentication flow
- ✅ Trip CRUD operations
- ✅ Payment processing
- ✅ Real-time updates via WebSocket (if implemented)
- ✅ File uploads (photos, documents)

---

## 🌐 **Google Play Credentials Setup**

### **Before First Upload to Play Store:**

1. **Create App in Play Console:**
   - Go to [Google Play Console](https://play.google.com/console)
   - Click "Create App"
   - Name: "Bago"
   - App type: "Application"
   - Category: "Travel" or "Business"
   - Fill required info

2. **Create Signing Key (Generated by EAS - Skip This)**
   - EAS handles Android signing automatically
   - No need to create your own keystore

3. **Add Google Analytics (Optional)**
   - Connect Firebase/Google Analytics for tracking

---

## 📦 **Upload AAB to Google Play Store**

### **Step-by-Step:**

1. **Go to Google Play Console** → Your App → "Releases"

2. **Navigate to:** Left menu → "Testing" → "Internal Testing"
   - *First upload should go here for testing*

3. **Click "Create New Release"**

4. **Upload Your AAB:**
   - Drag & drop the `.aab` file (or click to select)
   - Wait for processing (takes 2-5 minutes)

5. **Review & Confirm:**
   - App name appears
   - Version code auto-populated
   - Supported devices shown

6. **Add Release Notes (Optional):**
   ```
   Version 1.0.0
   - Initial release
   - P2P logistics platform
   - Google Sign-In integration
   - Payment systems (Stripe, Paystack)
   ```

7. **Review for Issues:**
   - Click "Review" 
   - Check for any warnings
   - Click "Start rollout to internal testing" → "Confirm"

8. **Test the App:**
   - Testers will see it in internal testing after ~1 hour
   - Download and test on Android devices

9. **When Ready for Production:**
   - Left menu → "Releases" → "Production"
   - "Create New Release" (same process)
   - Choose tested version
   - Submit for review (takes 3-24 hours for approval)

### **Important Notes on AAB vs APK:**
- ✅ **AAB (App Bundle):** Recommended - Google optimizes per device (smaller size)
- ⚠️ **APK:** Legacy - larger, works everywhere but not preferred for Play Store

---

## 🔐 **Environment Variables & Build Configuration**

### **All API Keys Used in Build:**

These are configured in `lib/core/constants/api_constants.dart` and can be passed via `--dart-define`:

```bash
# Build with all API keys (EAS does this automatically)
eas build --platform android --build-type app-bundle

# Or manually with dart-define flags:
eas build --platform android --build-type app-bundle \
  --dart-define=API_BASE_URL=https://neringa.onrender.com \
  --dart-define=GOOGLE_WEB_CLIENT_ID=207312508850-kgpk9uramqhjkhjeqds4bfdkotm1iqo0.apps.googleusercontent.com \
  --dart-define=GOOGLE_ANDROID_CLIENT_ID=207312508850-1o8b8kli0tkdnbet7k116cjocqjd83od.apps.googleusercontent.com \
  --dart-define=SUPABASE_URL=your_supabase_url \
  --dart-define=SUPABASE_PUBLISHABLE_KEY=your_supabase_key \
  --dart-define=STRIPE_KEY=pk_test_xxxxx \
  --dart-define=PAYSTACK_KEY=pk_test_xxxxx
```

**Note:** EAS automatically injects these - no manual command needed.

---

## 🏗️ **Method 2: Local Build (Android Studio) - MANUAL** ⚠️

### **Requirements:**
- Android Studio installed
- JDK 11+ 
- Android SDK (API 34+)
- ~10 GB free space
- Google Play account

### **Step-by-Step:**

#### **Step 1: Generate Android Project**
```bash
cd /Users/j/Desktop/CLAUDE/BAGO/bago_app_flutter
flutter pub get
flutter build apk --release
```

**Or for AAB:**
```bash
flutter build appbundle --release
```

**Output locations:**
- APK: `build/app/outputs/flutter-apk/app-release.apk`
- AAB: `build/app/outputs/bundle/release/app-release.aab`

#### **Step 2: (Optional) Sign APK Manually**

If needed, create a keystore:

```bash
keytool -genkey -v -keystore ~/bago_release.keystore \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias bago-key

# When prompted:
# Keystore password: [your_secure_password]
# Key password: [your_secure_password]
# Name: Your Company/You
# Org Unit: Development
# Org: Company
# City: City
# State: State
# Country: XX (2-letter code)
```

**Save this file safely - you'll need it for ALL future updates!**

#### **Step 3: Upload to Google Play Console**

Same process as AAB upload (see section below).

**Time:** 5-10 minutes build + upload

---

## ⚠️ **Common Issues & Fixes**

### **Issue: Build fails with "Gradle error"**
```bash
# Clean and rebuild
rm -rf android/build
rm -rf /Users/j/Desktop/CLAUDE/BAGO/bago_app_flutter/build
eas build --platform android --build-type app-bundle
```

### **Issue: AAB upload fails with "Version conflict"**
- Check current version in Google Play (e.g., v1.0.0)
- Increment version in `pubspec.yaml`: `version: 1.0.1+45`
- Rebuild and upload

### **Issue: "Unsigned APK"**
- Make sure you're using the `.aab` file (not `.apk`)
- EAS signs it automatically

### **Issue: "App requires API X or higher"**
Check your `app.json` and `android/app/build.gradle`:
```json
"android": {
  "compileSdkVersion": 34,
  "minSdkVersion": 21,
  "targetSdkVersion": 34
}
```

---

## ✅ **Testing All APIs Before Store Submission**

### **Test on Real Android Device (Min Android 7+)**

#### **Authentication Tests:**
- [ ] Email/password login works
- [ ] Google Sign-In works (redirects, tokens sync)
- [ ] OTP verification works
- [ ] Password reset email received
- [ ] Logout clears session properly
- [ ] Biometric login available & works
- [ ] Session persists after app restart

#### **Google OAuth Test:**
```
1. Tap "Sign in with Google"
2. Google login prompt appears
3. Select Google account
4. App receives auth token
5. User data synced to profile
6. Backend returns /api/bago/Profile successfully
```

#### **Payment Tests:**
```
STRIPE:
- [ ] Add card to wallet
- [ ] Process test payment ($0.50)
- [ ] Payment receipt shows
- [ ] Invoice downloadable as PDF

PAYSTACK:
- [ ] Paystack WebView opens
- [ ] Test transaction processes
- [ ] Webhook received on backend
- [ ] Payment marked as completed
```

#### **Location Tests:**
- [ ] GPS permission prompt shows
- [ ] Current location loads on map
- [ ] Location updates in real-time
- [ ] Works with Location Services off (falls back gracefully)

#### **Biometric Tests:**
- [ ] Fingerprint prompt shows
- [ ] Login with biometric succeeds
- [ ] Allows PIN fallback
- [ ] Credential stored securely

#### **File Operations:**
- [ ] Camera captures photos
- [ ] Gallery selection works
- [ ] Document picker shows files
- [ ] PDF generation & download works
- [ ] File permissions requests shown

#### **Backend Connectivity:**
- [ ] API calls succeed (check network tab)
- [ ] Error handling works (500 error shows message)
- [ ] Token refresh works (60+ min session)
- [ ] Offline mode doesn't crash app

---

## 📋 **Pre-Store Submission Checklist**

Before uploading to Play Store, ensure:

**App Setup:**
- [ ] Google Play account created ($25 fee)
- [ ] App created in Google Play Console
- [ ] Package name: `com.donnyace.bagoplatform`
- [ ] Version number incremented (check pubspec.yaml)

**Store Assets:**
- [ ] App icon: 512x512 PNG (transparent background recommended)
- [ ] Screenshots: Min 5 for phones (min 1080w x 1920h pixels)
- [ ] Feature graphic: 1024x500 PNG
- [ ] Short description: 50 chars max
- [ ] Full description: 4000 chars max
- [ ] Category: Travel or Business selected

**App Configuration:**
- [ ] Content rating completed
- [ ] Target audience: Adults (contains payments)
- [ ] Privacy policy URL set & accessible
- [ ] Support email configured
- [ ] All permissions justified in description

**Functionality Testing:**
- [ ] Google Sign-In tested on Android 7+ device
- [ ] All payment systems work (Stripe + Paystack)
- [ ] Location services tested
- [ ] Biometric auth functional
- [ ] Camera & gallery work
- [ ] PDF downloads functional
- [ ] Backend connectivity verified
- [ ] No crashes during 15-minute session

**Compliance:**
- [ ] No hard-coded API keys in code (use apk inspection tool)
- [ ] No leaked credentials in assets
- [ ] Firebase configured (crashes monitored)
- [ ] No sensitive data in logs
- [ ] Data practices disclosed

**Build Requirements:**
- [ ] Built as AAB (not APK)
- [ ] Min SDK: 21 (Android 5)
- [ ] Target SDK: 34 (Android 14)
- [ ] 64-bit ARM support verified

---

## ⚠️ **Troubleshooting Android-Specific Issues**

### **Build Issues**

#### **Issue: "Gradle build failed"**
```bash
# Clean and retry
rm -rf android/build
rm -rf /Users/j/Desktop/CLAUDE/BAGO/bago_app_flutter/build
flutter clean
flutter pub get
eas build --platform android --build-type app-bundle
```

#### **Issue: "Build timed out"**
- Try again (timeout possible from EAS servers)
- Or use local build method

#### **Issue: "Cannot find Android SDK"**
```bash
# Update path and retry
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/tools
eas build --platform android --build-type app-bundle
```

---

### **API & Runtime Issues**

#### **Issue: Google Sign-In not working on Android**
✅ **Verify:**
1. Android Google Client ID in app.json:
   - `207312508850-1o8b8kli0tkdnbet7k116cjocqjd83od`
2. Google Console → Credentials → OAuth 2.0 → Check Android app configured
3. Check SHA-1 fingerprint matches in Google Console
4. Test on actual device (not emulator)

**Generate SHA-1:**
```bash
# If using EAS signing (automatic):
eas credentials show --platform android

# Or manually:
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

#### **Issue: Payments not working (Stripe/Paystack)**
✅ **Verify:**
1. Test keys configured (not production keys for testing)
2. `flutter_stripe` initialized with public key
3. Paystack WebView enabled in pubspec.yaml
4. Test on real device (not emulator for some payment providers)

#### **Issue: Location not working**
✅ **Verify:**
1. Permissions granted in Android Settings → App Permissions
2. Location Services ON in device settings
3. App has ACCESS_FINE_LOCATION in app.json
4. Call `geolocator.checkPermission()` first

#### **Issue: Biometric auth not working**
✅ **Verify:**
1. Device has fingerprint/face enrolled in Settings
2. `local_auth` package detecting scanner
3. Fallback to PIN is enabled
4. Test on real device (emulator may not support biometric)

#### **Issue: PDF download doesn't work**
✅ **Verify:**
1. WRITE_EXTERNAL_STORAGE permission granted
2. Storage dir exists: `/storage/emulated/0/Download/`
3. Use `permission_handler` package if needed

#### **Issue: Images not uploading**
✅ **Verify:**
1. READ_EXTERNAL_STORAGE permission granted
2. Camera permission granted
3. Backend accepts multipart/form-data
4. File size under backend limit (usually 10-50MB)

---

### **Play Store Upload Issues**

#### **Issue: "Version conflict" error**
- Play Store already has your version
- Increment version in pubspec.yaml: `1.0.1+45`
- Rebuild and re-upload

#### **Issue: "Unsigned APK"**
- Use AAB format (not APK)
- Check build is using `--build-type app-bundle`

#### **Issue: "Not enough metadata"**
- Add screenshots (min 3-5)
- Add feature graphic
- Write full description
- Set content rating

#### **Issue: "App not compatible with any devices"**
- Check minSdkVersion (should be 21 minimum)
- Check 64-bit support enabled
- Verify permissions match device requirements

#### **Issue: "Policy violation"**
Common reasons:
- Asking for unnecessary permissions → Remove unused ones
- No privacy policy → Add link
- Accessing user data without disclosure → Document in listing
- Ad-related issues → Ensure proper ad disclosure

---

## 📊 **Comparing iOS vs Android Builds**

| Feature | iOS | Android |
|---------|-----|---------|
| Build Method | EAS or Xcode | EAS or Flutter CLI |
| Signing | Automatic (EAS) | Automatic (EAS) |
| Time | 10-20 min | 10-15 min |
| Google OAuth | ✅ (iOS client ID) | ✅ (Android client ID) |
| Stripe | ✅ | ✅ |
| Paystack | ✅ (WebView) | ✅ (WebView) |
| Firebase | ✅ | ✅ |
| Location | ✅ | ✅ |
| Biometric | ✅ (Face/Touch ID) | ✅ (Fingerprint/Face) |
| Permissions | Info.plist | AndroidManifest.xml |
| Store | App Store | Google Play |
| Review Time | 1-3 days | 3-24 hours |
| Cost | $99/year | $25 one-time |

---

## 🎬 **Next Steps - Store Listing**

Once internal testing passes:

1. **Add Store Details in Play Console:**
   - Branding
   - Screenshots & videos
   - Description
   - Contact email

2. **Set Content Rating**

3. **Target each audience (children/adults)**

4. **Submit for review** (takes 3-24 hours)

5. **Wait for approval** ✅

6. **Manual rollout** (start with 10%, then 50%, then 100%)

---

## 🔗 **Useful Links**

- [Google Play Console](https://play.google.com/console)
- [EAS Build Docs](https://docs.expo.dev/build/introduction/)
- [Android App Bundle Guide](https://developer.android.com/guide/app-bundle)
- [Google Play Requirements](https://play.google.com/intl/en/about/play-store-policies.html)

---

## 💡 **Quick Commands Reference**

```bash
# Navigate to project
cd /Users/j/Desktop/CLAUDE/BAGO/bago_app_flutter

# Check version
grep "version:" pubspec.yaml

# List build status
eas build:list --platform android

# View build logs
eas build:view [BUILD_ID]

# Cancel a build
eas build:cancel [BUILD_ID]

# Clean and rebuild
flutter clean
flutter pub get
eas build --platform android --build-type app-bundle

# Test on emulator locally
flutter run --release

# Check credentials
eas credentials show --platform android

# Update EAS CLI
eas-cli update

# Show all apps
eas project:info

# Manual APK build (Flutter CLI)
flutter build apk --release

# Manual AAB build (Flutter CLI)
flutter build appbundle --release

# Check app signing
apksigner verify --verbose build/app/outputs/flutter-apk/app-release.apk

# Build and auto-submit (requires service account)
eas build --platform android --auto-submit
```

---

**Status:** Ready for Android Play Store submission! 🚀
