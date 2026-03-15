# 🌐 Build iOS App via Expo Dashboard (Web Interface)

## ✅ Easier Method - No Terminal Commands Needed!

Since the command-line build is failing, you can build directly through the **Expo website** using a simple web interface.

---

## 🚀 Step-by-Step Instructions

### **Step 1: Go to Expo Dashboard**

Open your browser and go to:
```
https://expo.dev/accounts/donnyace/projects/bolt-expo-nativewind/builds
```

Or navigate manually:
1. Go to https://expo.dev
2. Log in to your account
3. Click "Projects"
4. Click "bolt-expo-nativewind"
5. Click "Builds" tab

---

### **Step 2: Click "Create a Build"**

Look for the **"Create a build"** or **"New Build"** button (usually in the top right).

---

### **Step 3: Configure Build Settings**

You'll see a form with these options:

#### **Platform**:
- Select: **iOS**

#### **Build Profile**:
- Select: **production**

#### **Build Type**:
- Select: **app-store** (or "archive" for .ipa file)

#### **Version Settings**:
The web interface will show:
- **App version**: 1.0.0
- **Build number**: Will auto-increment to 5+ (or you can manually set to 26+)

Make sure build number is **higher than 8** (the one that failed to upload).

---

### **Step 4: Provide Apple Credentials**

The dashboard will ask for Apple Developer credentials:

#### **Option A: Log in with Apple ID**
- Click **"Log in with Apple"**
- Enter Apple ID: `taiwojos2@gmail.com`
- Enter Password: `Tayelolu@1`
- Enter 2FA code from your iPhone

#### **Option B: Use Managed Credentials**
If Expo already has your credentials stored:
- Select **"Use existing credentials"**
- Click **"Build"**

---

### **Step 5: Start the Build**

Click the **"Build"** button at the bottom of the form.

You'll see:
```
✔ Build queued
Build ID: xxxxx-xxxxx-xxxxx
```

---

### **Step 6: Monitor Build Progress**

The page will show build progress:
```
⏳ Queued → 🔨 Building → ✅ Finished
```

This takes approximately **10-15 minutes**.

You can:
- Watch the live logs
- Leave the page and come back later
- Get notified by email when build completes

---

### **Step 7: Download or Submit**

When build completes:

#### **Download IPA**:
- Click **"Download"** button
- Saves `.ipa` file to your computer

#### **Submit to App Store Connect**:
- Click **"Submit to App Store Connect"**
- Enter your Apple credentials if needed
- Expo will upload the build to TestFlight

---

## 🎯 Alternative: Start Build via Command (Without Waiting)

If the web interface isn't working, you can queue a build from terminal and monitor it on the web:

```bash
cd /Users/j/Desktop/CLAUDE/BAGO/neringa/BAGO_MOBILE

# This will start the build and give you a URL
npx eas-cli build --platform ios --profile production --no-wait
```

This command will:
1. ✅ Queue the build on Expo servers
2. ✅ Give you a URL to monitor progress
3. ✅ NOT wait for interactive input
4. ✅ Let you complete the build setup on the web

---

## 📱 Using GitHub Actions (Advanced)

You can also set up automated builds using GitHub Actions:

### **Setup**:

1. **Go to your GitHub repository**

2. **Add secrets** (Settings → Secrets → Actions):
   ```
   EXPO_TOKEN=your_expo_token
   APPLE_ID=taiwojos2@gmail.com
   APPLE_PASSWORD=Tayelolu@1
   ```

3. **Create workflow file** (`.github/workflows/build-ios.yml`):
   ```yaml
   name: Build iOS
   on: [push]
   jobs:
     build:
       runs-on: macos-latest
       steps:
         - uses: actions/checkout@v3
         - uses: actions/setup-node@v3
         - run: npm install -g eas-cli
         - run: eas build --platform ios --profile production --non-interactive
           env:
             EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
   ```

4. **Push to GitHub** - build starts automatically!

---

## 🔧 Troubleshooting Web Dashboard

### **Issue 1: Can't Find "Create Build" Button**

**Solution**:
- Make sure you're logged in
- Navigate to: Projects → bolt-expo-nativewind → Builds
- Look for "+ New Build" or "Create a build" button

### **Issue 2: "No Apple Developer Account Found"**

**Solution**:
1. Go to https://developer.apple.com
2. Log in with: `taiwojos2@gmail.com`
3. Ensure you have an active membership ($99/year)
4. Accept any pending agreements

### **Issue 3: Build Fails with "Provisioning Profile Error"**

**Solution**:
- Let Expo manage certificates (select "Expo managed")
- Don't upload your own certificates/profiles
- Expo will generate everything automatically

### **Issue 4: "Bundle ID Already Exists"**

**Solution**:
The bundle ID `com.deracali.boltexponativewind` might already be registered.

Either:
- Use the existing one (if it's yours)
- Or change to a new one in `app.json`:
  ```json
  {
    "expo": {
      "ios": {
        "bundleIdentifier": "com.deracali.bago"
      }
    }
  }
  ```

---

## 📊 Build Number Management

Since you had build #8 fail to upload, here's what to do:

### **Option 1: Auto-increment (Recommended)**
Let Expo handle it - it will use build #26+ automatically

### **Option 2: Manual Override**
In the web dashboard, manually set build number to: **26** or higher

### **Option 3: Edit app.json**
Before building, edit:
```json
{
  "expo": {
    "ios": {
      "buildNumber": "26"
    }
  }
}
```

Then commit and push, or build from dashboard.

---

## ✅ Quick Links

### **Your Project Dashboard**:
```
https://expo.dev/accounts/donnyace/projects/bolt-expo-nativewind
```

### **Builds Page**:
```
https://expo.dev/accounts/donnyace/projects/bolt-expo-nativewind/builds
```

### **Create New Build**:
```
https://expo.dev/accounts/donnyace/projects/bolt-expo-nativewind/builds/new
```

### **Apple Developer Portal**:
```
https://developer.apple.com
```

### **App Store Connect**:
```
https://appstoreconnect.apple.com
```

---

## 🎯 Recommended Approach

**Use the Web Dashboard** - it's the easiest way:

1. ✅ Go to: https://expo.dev/accounts/donnyace/projects/bolt-expo-nativewind/builds
2. ✅ Click "Create a build"
3. ✅ Select iOS + Production
4. ✅ Log in with Apple ID when prompted
5. ✅ Click "Build"
6. ✅ Wait 10-15 minutes
7. ✅ Click "Submit to App Store Connect"

**No terminal commands, no failed prompts, everything in the browser!**

---

## 📧 Email Notifications

Expo will email you when:
- ✅ Build starts
- ✅ Build completes
- ❌ Build fails (with error logs)

Check your email inbox for build status updates.

---

## 🎊 Success Indicators

### **Build Queued**:
```
Status: Queued
Platform: iOS
Profile: production
Build #: 26
```

### **Build Running**:
```
Status: In Progress
Estimated time: 12 minutes
```

### **Build Complete**:
```
Status: ✅ Finished
Build #: 26
Version: 1.0.0
Download: [Download IPA button]
Submit: [Submit to App Store button]
```

---

## 📝 Summary

**Problem**: Terminal build fails due to interactive prompts
**Solution**: Use Expo web dashboard instead
**URL**: https://expo.dev/accounts/donnyace/projects/bolt-expo-nativewind/builds/new

**Steps**:
1. Click link above
2. Select iOS + Production
3. Enter Apple credentials
4. Click Build
5. Wait ~15 minutes
6. Submit to App Store Connect

**Much easier than terminal!** 🎉

---

## 💡 Pro Tip

Once you've successfully built via the web dashboard **once**, Expo will save your credentials. Future builds can be triggered from terminal with `--non-interactive` flag and will work automatically!

---

**Go to the web dashboard now and start your build!** 🚀

https://expo.dev/accounts/donnyace/projects/bolt-expo-nativewind/builds
