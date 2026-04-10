# How to Run Your iOS Build (Step by Step)

## The Issue
EAS CLI needs interactive keyboard input that the automated system cannot provide. You need to run this in your own Terminal.

## Quick Steps

### 1. Open Terminal
- Press `Cmd + Space`
- Type "Terminal"
- Press Enter

### 2. Navigate to Project
Copy and paste this command:
```bash
cd /Users/j/Desktop/CLAUDE/BAGO/neringa/BAGO_MOBILE
```

### 3. Run the Build
Copy and paste this command:
```bash
npx eas-cli build --platform ios --profile production
```

### 4. When Prompted
You'll see: **"Do you want to log in to your Apple account?"**

**Press:** `n` (then Enter)

### 5. Wait for Build
- Build will upload to Expo's servers
- You'll see a URL like: `https://expo.dev/accounts/donnyace/projects/bolt-expo-nativewind/builds/...`
- Build takes 10-20 minutes
- You'll get an email when complete

---

## Expected Output

You should see something like:
```
✔ Using remote iOS credentials (Expo server)
✔ Incremented buildNumber from 9 to 10
✔ Uploaded project files to EAS
✔ Build started

Build URL: https://expo.dev/...
```

---

## After Build Completes

### Option 1: Auto-Submit to TestFlight
```bash
npx eas-cli submit --platform ios --latest
```

### Option 2: Download IPA Manually
1. Go to the build URL from the output
2. Click "Download" button
3. Upload manually to App Store Connect

---

## Troubleshooting

### "Do you want to log in to your Apple account?"
- **Answer:** `n` (no)
- You're already authenticated with Expo

### "Error: Invalid credentials"
Run this first:
```bash
npx eas-cli login
```
- Username: `donnyace`
- Password: `Tayelolu@1`

Then try the build command again.

### "Bundle identifier mismatch"
This shouldn't happen anymore (already fixed), but if it does:
- The bundle ID is now correctly set to `com.deracali.boltexponativewind`
- Check [BAGO_MOBILE/ios/Bago.xcodeproj/project.pbxproj](BAGO_MOBILE/ios/Bago.xcodeproj/project.pbxproj)

### "Missing app icons"
This shouldn't happen anymore (already fixed), but if it does:
- Icons are at [BAGO_MOBILE/ios/Bago/Images.xcassets/AppIcon.appiconset/](BAGO_MOBILE/ios/Bago/Images.xcassets/AppIcon.appiconset/)
- Both 1024x1024 and 120x120 sizes are present

---

## What Gets Built

- **Version:** 1.0.0
- **Build Number:** 10 (auto-incremented from 9)
- **Bundle ID:** com.deracali.boltexponativewind
- **Platform:** iOS (iPhone + iPad)
- **Configuration:** Release (production)

---

## Why This Build Will Work

✅ Bundle identifier is correct (fixed)
✅ App icons are present (fixed)
✅ Version/build number follows Apple's requirements (fixed)
✅ Session persistence is working (logout issue fixed)

---

## Time Estimate

- Running the command: 1 minute
- Upload to EAS: 2-5 minutes
- Build on EAS servers: 10-20 minutes
- Submit to TestFlight: 5-10 minutes
- TestFlight processing: 10-30 minutes

**Total:** About 30-60 minutes from start to TestFlight availability

---

**Ready to build!** Just open Terminal and follow the steps above. 🚀
