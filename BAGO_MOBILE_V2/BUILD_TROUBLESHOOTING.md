# iOS Build Troubleshooting Guide

## Quick Start - Try These in Order:

### ✅ Step 1: Make scripts executable
```bash
cd /Users/j/Desktop/CLAUDE/BAGO/neringa/BAGO_MOBILE_V2
chmod +x *.sh
```

### ✅ Step 2: Extract the actual error
```bash
./extract-build-errors.sh
```
This will show you the EXACT error. Copy this error and share it with me.

### ✅ Step 3: If Step 2 shows an error, try the comprehensive fix
```bash
./final-build-diagnostic.sh
```
This will:
- Check your system
- Ensure pods are set up
- Try building with detailed logging
- Tell you exactly what's wrong

### ✅ Step 4: If Step 3 fails, try alternative methods
```bash
./alternative-build-methods.sh
```
Try methods in this order:
1. **xcodebuild** (direct Xcode build)
2. **eas build --profile preview** (lower settings)
3. **eas build --simulator** (for testing)
4. **Full clean rebuild**

---

## Common Issues & Quick Fixes

### Issue: "Podfile.lock was not created"
```bash
cd /Users/j/Desktop/CLAUDE/BAGO/neringa/BAGO_MOBILE_V2/ios
pod install --repo-update
```

### Issue: "Pod dependency not found"
```bash
cd /Users/j/Desktop/CLAUDE/BAGO/neringa/BAGO_MOBILE_V2
npm install --legacy-peer-deps --force
cd ios && pod install --repo-update
```

### Issue: "React Native version mismatch"
```bash
cd /Users/j/Desktop/CLAUDE/BAGO/neringa/BAGO_MOBILE_V2
npm install --save-exact react-native@0.83.2
npm install --legacy-peer-deps
cd ios && pod install --repo-update
```

### Issue: "Xcode not found"
```bash
sudo xcode-select --install
# or reset
sudo xcode-select --reset
```

### Issue: "Swift compilation error"
```bash
cd /Users/j/Desktop/CLAUDE/BAGO/neringa/BAGO_MOBILE_V2/ios
pod deintegrate
pod install --repo-update
```

---

## Most Direct Build Methods

If EAS is not working, use Xcode directly:

```bash
# Build for physical device
xcodebuild -workspace ios/Bago.xcworkspace \
  -scheme Bago \
  -configuration Release \
  -arch arm64 \
  -derivedDataPath ios/build

# Build for simulator
xcodebuild -workspace ios/Bago.xcworkspace \
  -scheme Bago \
  -configuration Release \
  -arch x86_64 \
  -sdk iphonesimulator \
  -derivedDataPath ios/build
```

---

## What to Do If All Else Fails

1. Run this and **copy the full output**:
   ```bash
   cd /Users/j/Desktop/CLAUDE/BAGO/neringa/BAGO_MOBILE_V2/ios
   pod install --verbose 2>&1
   ```

2. Also run:
   ```bash
   npm run build:ios 2>&1 | tail -100
   ```

3. **Share BOTH outputs with me** - I need to see the actual error messages

---

## Scripts Created

- `final-build-diagnostic.sh` - Main diagnostic (run this first)
- `alternative-build-methods.sh` - Try different build approaches  
- `extract-build-errors.sh` - Extract and analyze error messages
- `force-podfile-lock.sh` - Force Podfile.lock creation
- `nuclear-reset.sh` - Complete system reset

**Run them in this order:**
1. `extract-build-errors.sh` 
2. `final-build-diagnostic.sh`
3. `alternative-build-methods.sh`

---

## Next Action

**Run this command and share the output with me:**

```bash
cd /Users/j/Desktop/CLAUDE/BAGO/neringa/BAGO_MOBILE_V2
./extract-build-errors.sh
```

This will tell me exactly what's failing and I can provide a targeted fix.
