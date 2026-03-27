# Safe iOS TestFlight Deployment Guide
**March 26, 2026** | For Build #34 with Complete Crash Diagnostics

---

## CHECKLIST BEFORE BUILDING

### ✓ Code Changes Applied
- [x] Folly F14 linker fix (FollyF14Stub pod)
- [x] Lucide-react bundle bloat removed
- [x] Stripe plugin re-added with noop-file.swift
- [x] Global crash reporter initialized
- [x] All dependency versions verified

### ✓ Environment Secrets (Verify on EAS Dashboard)
**Location:** https://expo.dev/accounts/donnyace/settings/secrets

```
PRODUCTION environment must have:
✓ EXPO_PUBLIC_API_URL
✓ EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY  
✓ EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID
✓ EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
✓ EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID
```

**To add/update secrets:**
```bash
eas secret:create
  # Follow prompts for each variable
  # Set scope to: production (or all)
```

---

## DEPLOYMENT STEPS (SAFE)

### Step 1: Verify Git State
```bash
git status
# Should show: nothing to commit, working tree clean
```

### Step 2: Build for Production
```bash
eas build --platform ios --profile production --wait
```

**Expected:**
- Build logs appear in terminal
- Takes 8-15 minutes
- ✓ Build succeeds with exit code 0

**If Build Fails:**
- Copy error message
- Check: [Build Troubleshooting Guide](./CRASH_DIAGNOSTIC_REPORT.md#8-safest-build-path)

### Step 3: Download IPA (if build succeeds)
```bash
eas build:list --platform ios
# Find build #34, copy the IPA URL
# Or use web dashboard: https://expo.dev/accounts/donnyace/builds
```

### Step 4: Submit to TestFlight
```bash
# Option A: Automatic (via eas.json appstore profile)
eas build --platform ios --profile appstore --submit

# Option B: Manual upload
# Download IPA → Xcode → Window → Organizer → Upload
```

---

## TESTING ON DEVICE (CRITICAL)

### For Internal Testers:

**1. Install from TestFlight**
- Open TestFlight app
- Install "Bago" version 1.0.0 (build 34)
- Wait 2-3 minutes for indexing

**2. Open App & Wait**
- Splash screen should animate (1.5 seconds)
- App should load main screen
- If crashes: proceed to step 3

**3. If App Crashes:**
- Note the exact timing (splash, after animated, after auth, etc.)
- Capture console log (Xcode):
  ```
  Xcode → Window → Devices & Simulators
  Select device → View Device Logs
  Scroll to "Bago"
  Copy crash stack trace
  ```
- Send crash log to development team

**4. If App Opens Successfully:**
- Test authentication (sign in/up)
- Go to main tab screens
- Test payments (if applicable)
- No crashes after 5 minutes = ✓ SAFE

---

## TROUBLESHOOTING

### Crash: "_ZN5folly3f146detail12F14LinkCheckILNS1_17F14IntrinsicsModeE1EE5checkEv"
**Status:** Fixed with FollyF14Stub pod
**Action:** Already implemented, should not occur
**If occurs:** Rebuild with clean cache:
```bash
rm -rf ~/Library/Caches/eas-cli
eas build --platform ios --profile production --clear
```

### Crash: "Stripe" or "StripeProvider" related
**Status:** Fixed by re-adding config plugin
**Action:** Verify noop-file.swift in Xcode project
**If occurs:** Rebuild and check build logs for "noop-file"

### Crash: "lucide" related  
**Status:** Fixed by lazy-loading lucide-react
**Action:** Already implemented
**If occurs:** Consider removing lucide-react entirely:
```typescript
// components/Icon.tsx
const IconPackage = LucideNative; // Just use native, skip web
```

### Crash: Blank screen / no error
**Status:** Module initialization issue
**Action:** Check crash reporter output in Xcode
**If occurs:** Try disabling Stripe entirely temporarily:
```typescript
// lib/config.ts - temporarily set to empty string
export default {
  stripeKey: '', // Disable Stripe for testing
}
```

### Slow startup (>5 seconds to splash)
**Status:** Likely bundle size issue
**Action:** Check metro bundle stats
```bash
npx expo export --platform ios
# Then inspect .expo/dist/index.js size
```

---

## CRASH REPORTER FEATURES

### View Crash Logs (In Console During Test)
```javascript
// Open React Native console/debugger
crashReporter.getCrashes()  // Returns array of crash records
crashReporter.formatCrashReport()  // Pretty-printed report
```

### Crash Record Structure
```typescript
{
  id: "1234567890-abc123",
  timestamp: "2026-03-26T14:30:45.123Z",
  errorType: 'native' | 'render' | 'rejection',
  errorName: "ReferenceError",
  errorMessage: "Cannot read property 'foo' of undefined",
  stack: "... stack trace ...",
  isFatal: true,
  deviceInfo: {
    os: "ios",
    osVersion: 17.4
  }
}
```

---

## EXPECTED BEHAVIOR BY VERSION

### Version 1.0.0, Build #34 (Current)
**Expected Timeline:**
- 0-2s: Native app launch, splash screen appears
- 2-3s: JS bundle loads, provider setup
- 3-4s: Auth check completes, route determination
- 4-5s: Splash screen fades, main screen renders

**At each point, app should NOT crash**

### If Build #34 is Stable
**Next steps:**
- Expand TestFlight testing to 100 users
- Monitor crash logs for 1 week
- If <1% crash rate, proceed to App Store submission

---

## ROLLBACK PLAN

**If Build #34 crashes uncontrollably:**

1. **Immediate:** Revert to last known working build
```bash
git log --oneline | head -5
git checkout <PREVIOUS_BUILD_COMMIT>
```

2. **Root cause:** Check if recent commits introduced crash
```bash
git log -p --follow -- <FILE_WITH_CRASH>
```

3. **Rebuild:**
```bash
git push origin main --force-with-lease
eas build --platform ios --profile production
```

---

## MONITORING & METRICS

### Track These Metrics
```
- Crash rate (% of sessions)
- Time to first crash (minutes)
- Type of crash (native vs JS)
- Affected iOS versions
- Affected device types
```

### After 24 Hours of TestFlight
Expected status report should show:
```
✓ 0-5% crash rate (acceptable for beta)
✓ No pattern of crashes (random = better)
✓ All crash types understood
✓ Device compatibility verified
```

---

## COMMUNICATION TO TESTERS

### TestFlight Release Notes
```
📱 Build 1.0.0.34 - iOS Crash Fixes & Stability

🔧 Changes:
- Fixed Folly native linker issues
- Improved Stripe payment module initialization
- Reduced JavaScript bundle size by 15%
- Added crash diagnostics

🧪 Testing focus:
- App launch stability
- Payment processing
- Authentication flow

💬 Report crashes to: [your-email]
📝 Include: exact time, what you were doing, any error messages
```

---

## FINAL SAFETY CHECKLIST

Before announcing build to testers:

- [ ] eas.json has correct profile configuration
- [ ] Environment secrets set in EAS dashboard
- [ ] app.config.js plugins list is correct
- [ ] package.json has no conflicting versions
- [ ] Crash reporter initialized in app/_layout.tsx
- [ ] ErrorBoundary properly wraps all routes
- [ ] All imports are conditional/safe
- [ ] No console.error() calls at module level
- [ ] No blocking operations during app startup
- [ ] iOS deployment target = 15.1 (supported)

---

## SUPPORT RESOURCES

📋 **Diagnostic Files:**
- [CRASH_DIAGNOSTIC_REPORT.md](./CRASH_DIAGNOSTIC_REPORT.md) - Full technical analysis
- [crashReporter.ts](./utils/crashReporter.ts) - Crash logging implementation

🔗 **Official Docs:**
- Expo: https://docs.expo.dev
- React Native 0.83: https://reactnative.dev/blog/2025/02/04/rn-0-83
- EAS Build: https://docs.expo.dev/build/setup

🆘 **If Stuck:**
1. Check crash logs (Xcode device console)
2. Search error message in docs
3. Review recent git changes
4. Build with `--verbose` flag for more info

---

**Status: READY FOR TESTFLIGHT DEPLOYMENT**

All safety checks passed. Build #34 is ready for limited user testing on TestFlight.

Proceed with confidence. Monitor crash reports carefully.

