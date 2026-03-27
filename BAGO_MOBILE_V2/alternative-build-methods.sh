#!/bin/bash

# Alternative iOS Build Methods
# Try these if npm run build:ios doesn't work

PROJECT_PATH="/Users/j/Desktop/CLAUDE/BAGO/neringa/BAGO_MOBILE_V2"
IOS_PATH="$PROJECT_PATH/ios"

echo "🔄 ALTERNATIVE BUILD METHODS"
echo "============================"
echo ""

cd "$PROJECT_PATH"

# Ensure Pods are set up
echo "Setting up Pods..."
cd "$IOS_PATH"
pod install --repo-update 2>&1 | grep -E "Analyzing|Downloading|Installing" || echo "Pods ready"

cd "$PROJECT_PATH"

# Method 1: xcodebuild (local)
if [ -d "$IOS_PATH/Bago.xcworkspace" ]; then
  echo ""
  echo "1️⃣ METHOD 1: Direct xcodebuild (local)"
  echo "   This builds directly with Xcode, bypassing EAS"
  echo ""
  
  read -p "Try xcodebuild? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Building with xcodebuild..."
    xcodebuild -workspace "$IOS_PATH/Bago.xcworkspace" \
                -scheme Bago \
                -configuration Release \
                -derivedDataPath "$IOS_PATH/build" \
                -arch arm64 \
                2>&1 | tail -50
    
    if [ ${PIPESTATUS[0]} -eq 0 ]; then
      echo ""
      echo "✅ xcodebuild successful!"
      echo "App should be in: $IOS_PATH/build/Build/Products/Release-iphoneos/"
      exit 0
    fi
  fi
fi

# Method 2: eas build with preview profile
echo ""
echo "2️⃣ METHOD 2: EAS Build (preview profile)"
echo "   Uses lower-level build settings"
echo ""

read -p "Try eas build --profile preview? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  npx eas-cli build --platform ios --profile preview 2>&1 | tail -50
  if [ ${PIPESTATUS[0]} -eq 0 ]; then
    echo "✅ Preview build successful!"
    exit 0
  fi
fi

# Method 3: eas build simulator
echo ""
echo "3️⃣ METHOD 3: EAS Simulator Build"
echo "   Builds for iOS simulator instead of device"
echo ""

read -p "Try eas build --platform ios --simulator? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  npx eas-cli build --platform ios --simulator 2>&1 | tail -50
  if [ ${PIPESTATUS[0]} -eq 0 ]; then
    echo "✅ Simulator build successful!"
    exit 0
  fi
fi

# Method 4: Clean and retry
echo ""
echo "4️⃣ METHOD 4: Full Clean + Rebuild"
echo ""

read -p "Full clean and rebuild from scratch? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "Cleaning..."
  killall Xcode 2>/dev/null || true
  rm -rf ~/Library/Developer/Xcode/DerivedData/Bago*
  cd "$IOS_PATH"
  pod deintegrate 2>/dev/null || true
  rm -rf Pods Podfile.lock
  
  echo "Rebuilding..."
  pod install --repo-update
  cd "$PROJECT_PATH"
  npm run build:ios
fi

echo ""
echo "📝 If all methods fail:"
echo "   1. Share the specific error message"
echo "   2. Run: pod install --verbose > pod_error.log 2>&1"
echo "   3. Check: cat pod_error.log | grep -i error"
echo "   4. Post that error message"
