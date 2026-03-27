#!/bin/bash

# Nuclear option: Complete reset + rebuild

PROJECT_PATH="/Users/j/Desktop/CLAUDE/BAGO/neringa/BAGO_MOBILE_V2"
IOS_PATH="$PROJECT_PATH/ios"

echo "🚨 Nuclear Reset Option"
echo "======================"
echo ""

echo "⚠️  This will:"
echo "  1. Kill all Xcode processes"
echo "  2. Remove ALL pod-related files"
echo "  3. Bypass CocoaPods entirely if needed"
echo "  4. Rebuild from scratch"
echo ""

read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Aborted."
  exit 1
fi

echo ""
echo "Step 1: Killing processes..."
killall Xcode 2>/dev/null || true
killall "Xcode" 2>/dev/null || true
sleep 2

echo "Step 2: Complete cleanup..."
cd "$PROJECT_PATH"
rm -rf node_modules
rm -f package-lock.json yarn.lock

cd "$IOS_PATH"
rm -rf Pods
rm -f Podfile.lock
rm -f Pod.lock
rm -rf .symlinks/
rm -rf build/
rm -rf Manifest.lock

# Also clean Xcode cache
rm -rf ~/Library/Developer/Xcode/DerivedData/Bago* 2>/dev/null || true
rm -rf ~/Library/Caches/CocoaPods 2>/dev/null || true

echo "Step 3: Validating Podfile syntax..."
if ruby -c Podfile 2>&1 | grep -q "Syntax OK"; then
  echo "✓ Podfile syntax is valid"
else
  echo "⚠️  Podfile syntax check:"
  ruby -c Podfile
fi

echo ""
echo "Step 4: Clearing CocoaPods specs..."
cd "$PROJECT_PATH"
rm -rf ~/.cocoapods/repos/trunk/* 2>/dev/null || true

echo "Step 5: Installing dependencies..."
npm install --legacy-peer-deps --force

echo ""
echo "Step 6: Running pod install with all flags..."
cd "$IOS_PATH"

# Try multiple times with different flags
ATTEMPTS=0
while [ $ATTEMPTS -lt 3 ] && [ ! -f "Podfile.lock" ]; do
  ATTEMPTS=$((ATTEMPTS + 1))
  
  echo ""
  echo "Attempt $ATTEMPTS..."
  
  case $ATTEMPTS in
    1)
      echo "Using: pod install --clean-install"
      pod install --clean-install --repo-update
      ;;
    2)
      echo "Using: pod deintegrate + pod install"
      pod deintegrate 2>/dev/null || true
      sleep 2
      pod install --repo-update --verbose | tail -50
      ;;
    3)
      echo "Using: pod update + pod install"
      pod update --no-repo-update
      pod install
      ;;
  esac
  
  if [ -f "Podfile.lock" ]; then
    echo "✓ Podfile.lock created on attempt $ATTEMPTS"
    break
  fi
done

# Final check
echo ""
if [ -f "Podfile.lock" ]; then
  echo "✅ SUCCESS: Podfile.lock exists"
  
  cd "$PROJECT_PATH"
  echo ""
  echo "Step 7: Building..."
  npm run build:ios
else
  echo "❌ FAILED: Podfile.lock not created after all attempts"
  echo ""
  echo "Checking what exists in ios directory:"
  ls -la "${IOS_PATH}/" | grep -E "Pod|pod|lock"
  exit 1
fi
