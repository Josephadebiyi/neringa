#!/bin/bash

# Emergency pod fix - for stubborn CocoaPods issues

PROJECT_PATH="/Users/j/Desktop/CLAUDE/BAGO/neringa/BAGO_MOBILE_V2"
IOS_PATH="$PROJECT_PATH/ios"

echo "🆘 Emergency iOS Build Fix"
echo "=========================="
echo ""

# Kill all xcode processes
echo "1. Killing Xcode..."
killall Xcode 2>/dev/null || true
sleep 2

# Deep clean
echo "2. Deep cleaning..."
cd "$PROJECT_PATH"
rm -rf node_modules
rm -f package-lock.json
rm -rf ios/Pods
rm -f ios/Podfile.lock
rm -rf ios/.symlinks/
rm -rf ios/build/
rm -rf ~/Library/Developer/Xcode/DerivedData/*
rm -rf ~/.cocoapods/repos/trunk/*

echo "3. Resetting Xcode..."
sudo xcode-select --reset 2>/dev/null || true

echo "4. Installing npm (with legacy peer deps)..."
npm install --legacy-peer-deps --force

echo "5. Setting up CocoaPods..."
sudo gem install cocoapods -N
pod repo add-cdn trunk https://cdn.cocoapods.org/ 2>/dev/null || true

echo "6. Installing Pods..."
cd "$IOS_PATH"

# Try with specific flags
pod install --repo-update \
  --deployment \
  --clean-install \
  2>&1 | tee emergency_pod_install.log

if [ ${PIPESTATUS[0]} -eq 0 ]; then
  echo ""
  echo "✅ Success! Pods installed."
  cd "$PROJECT_PATH"
  echo ""
  echo "7. Building app..."
  npm run build:ios
else
  echo ""
  echo "❌ Pod install still failed."
  echo ""
  echo "Last 100 lines of error log:"
  tail -100 emergency_pod_install.log
fi
