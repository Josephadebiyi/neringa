# 📱 iOS App Build Guide - Bago Mobile

## 🚀 Building the iOS IPA File

There are **two ways** to build the iOS app:

---

## Method 1: EAS Build (Cloud) - CURRENTLY RUNNING ⚡

### **Status:**
✅ Build started in background
⏳ EAS is building your IPA file on their servers

### **Advantages:**
- ✅ No need for Mac or Xcode
- ✅ Builds in the cloud
- ✅ Automatic provisioning
- ✅ Works from any OS

### **Time:**
- Usually takes 10-20 minutes

### **Check Build Status:**
```bash
cd BAGO_MOBILE
npx eas-cli build:list
```

### **Download When Ready:**
The IPA file will be available at the URL shown when build completes.

---

## Method 2: Local Build (Xcode) - FASTER ⚡⚡⚡

### **Requirements:**
- macOS computer
- Xcode installed
- Apple Developer account

### **Steps:**

#### **Step 1: Install Xcode**
```bash
# If not already installed:
xcode-select --install
```

#### **Step 2: Generate iOS Project**
```bash
cd BAGO_MOBILE
npx expo prebuild --platform ios
```

#### **Step 3: Open in Xcode**
```bash
open ios/BoltExpoNativewind.xcworkspace
```

#### **Step 4: Configure Signing**
1. In Xcode, select the project in left sidebar
2. Go to "Signing & Capabilities"
3. Select your Team
4. Xcode will auto-generate provisioning profile

#### **Step 5: Build IPA**
1. In Xcode menu: **Product** → **Archive**
2. When archive completes, window opens
3. Click **Distribute App**
4. Choose **Ad Hoc** (for testing) or **App Store** (for submission)
5. Follow prompts
6. **Export** the IPA file

**Time**: 5-10 minutes ⚡

---

## Method 3: Expo Development Build (For Testing Only)

### **Fastest way to test on device:**

```bash
cd BAGO_MOBILE

# For iOS Simulator (Mac only):
npx expo start --ios

# For physical device:
# 1. Install Expo Go from App Store
# 2. Run: npx expo start
# 3. Scan QR code with camera
```

This doesn't create an IPA but lets you test immediately.

---

## 📦 What Happens After Build

### **EAS Build Output:**
When the EAS build completes, you'll get:
- ✅ Download URL for IPA file
- ✅ Build ID for tracking
- ✅ Build logs

### **IPA File:**
The `.ipa` file is your iOS app package.

### **Install Methods:**

#### **1. TestFlight (Recommended for Testing)**
```bash
# Upload to TestFlight
npx eas-cli submit --platform ios --profile production

# Then:
# - Go to App Store Connect
# - Select your app
# - Go to TestFlight tab
# - Invite testers
```

#### **2. Direct Install (Ad Hoc)**
- Email IPA to testers
- Install via Apple Configurator
- Or use services like Diawi/TestApp.io

#### **3. App Store**
- Submit via App Store Connect
- Wait for Apple review (1-3 days)
- App goes live

---

## 🔧 Build Profiles Explained

### **Preview (Currently Building)**
```json
{
  "distribution": "internal",
  "ios": {
    "simulator": false,
    "buildConfiguration": "Release"
  }
}
```
- ✅ For testing on real devices
- ✅ Ad Hoc distribution
- ✅ No App Store submission

### **Production**
```json
{
  "ios": {
    "simulator": false,
    "buildConfiguration": "Release",
    "image": "latest"
  },
  "autoIncrement": true
}
```
- ✅ For App Store submission
- ✅ Auto-increments build number
- ✅ Production-ready

---

## 📋 Build Checklist

Before building, make sure:

- [ ] App name is correct: "Bago" ✅
- [ ] Bundle ID set: `com.deracali.boltexponativewind` ✅
- [ ] Version number updated: `1.0.0` ✅
- [ ] Build number incremented: `9` ✅
- [ ] Icon added: `./assets/images/icon.png` ✅
- [ ] Splash screen added: `./assets/images/splash.png` ✅
- [ ] Permissions configured ✅
- [ ] Backend URL correct ✅

All checked! ✅

---

## 🐛 Troubleshooting

### **EAS Build Fails**

**Check logs:**
```bash
npx eas-cli build:list
npx eas-cli build:view [BUILD_ID]
```

**Common issues:**
1. **Missing credentials** → Run `npx eas-cli credentials`
2. **Build timeout** → Use local build instead
3. **Dependency errors** → Check package.json

### **Xcode Build Fails**

**Common issues:**
1. **Signing error** → Check Apple Developer account
2. **Pod install fails** → Run `cd ios && pod install`
3. **Module not found** → Run `npm install`

### **"Unable to install" on device**

**Cause**: Provisioning profile doesn't include device

**Fix**:
1. Add device UDID to Apple Developer portal
2. Regenerate provisioning profile
3. Rebuild

---

## 📱 Installing on Your Device

### **Option 1: Via Cable (Mac)**
```bash
# After exporting IPA from Xcode:
# 1. Connect iPhone to Mac
# 2. Open Xcode → Window → Devices and Simulators
# 3. Drag IPA file to device
```

### **Option 2: Via Diawi (Wireless)**
```bash
# 1. Go to https://www.diawi.com
# 2. Upload IPA file
# 3. Share link with testers
# 4. Open link on iPhone
# 5. Install app
```

### **Option 3: Via TestFlight**
```bash
# Best for team testing
# 1. Upload to TestFlight
# 2. Invite testers via email
# 3. They install TestFlight app
# 4. They get your app
```

---

## 🔐 Apple Developer Requirements

To distribute your app, you need:

### **Free Account** (Limited):
- ✅ Test on your own device
- ✅ 7-day code signing
- ❌ TestFlight
- ❌ App Store

### **Paid Account** ($99/year):
- ✅ Test on any device
- ✅ 1-year code signing
- ✅ TestFlight (100 testers)
- ✅ App Store submission

**Sign up**: https://developer.apple.com/programs/

---

## 📊 Build Times Comparison

| Method | Time | Requirements | Best For |
|--------|------|--------------|----------|
| **EAS Build** | 10-20 min | None | Quick builds, any OS |
| **Xcode Local** | 5-10 min | Mac + Xcode | Fastest, full control |
| **Expo Go** | 1 min | None | Quick testing only |

---

## 🎯 Current Build Status

**Build Method**: EAS Cloud Build (Production profile)
**Platform**: iOS
**Status**: ✅ **COMPLETED**
**Profile**: production (App Store ready)
**Build ID**: 366ed816-6a6d-46de-90ea-df005be139cd
**Completed**: March 10, 2026 at 8:21 PM

### **📦 Download Your IPA:**
```
https://expo.dev/artifacts/eas/7HRw94Tybh7LQ7Ure2nP36.ipa
```

### **📊 View Build Details:**
```
https://expo.dev/accounts/donnyace/projects/bolt-expo-nativewind/builds/366ed816-6a6d-46de-90ea-df005be139cd
```

**Build Information:**
- Version: 1.0.0
- Build Number: 8
- SDK Version: 54.0.0
- Distribution: App Store Ready

**Next Steps:**
1. Download the IPA from the link above
2. Install via TestFlight (recommended) or direct install
3. See [IOS_BUILD_COMPLETE.md](IOS_BUILD_COMPLETE.md) for detailed instructions

---

## 🚀 Next Steps After Build

### **1. Test the IPA**
- Install on test device
- Test all features
- Check for crashes

### **2. Submit to TestFlight** (Optional)
```bash
npx eas-cli submit --platform ios
```

### **3. Submit to App Store** (When ready)
- Prepare App Store listing
- Add screenshots
- Write description
- Submit for review

---

## 💡 Pro Tips

1. **Use EAS for quick builds** when you don't have Mac
2. **Use Xcode for faster iterations** during development
3. **Use TestFlight for beta testing** with your team
4. **Test on multiple devices** before App Store submission
5. **Keep build numbers incrementing** for each release

---

## 📞 Build Support

### **Check Build Logs:**
```bash
npx eas-cli build:list
npx eas-cli build:view [BUILD_ID]
```

### **Cancel Build:**
```bash
npx eas-cli build:cancel [BUILD_ID]
```

### **Start New Build:**
```bash
# Preview (for testing):
npx eas-cli build --platform ios --profile preview

# Production (for App Store):
npx eas-cli build --platform ios --profile production
```

---

## ✅ Summary

**Current Status:**
- ✅ EAS build started
- ✅ Preview profile selected
- ✅ Building for iOS
- ⏳ Estimated time: 10-20 minutes

**When build finishes:**
1. Download IPA from URL
2. Install on device
3. Test thoroughly
4. Submit to TestFlight/App Store when ready

**Your build is in progress!** Check back in 10-15 minutes. 🚀

---

*For real-time build status, run: `npx eas-cli build:list` in the BAGO_MOBILE folder*
