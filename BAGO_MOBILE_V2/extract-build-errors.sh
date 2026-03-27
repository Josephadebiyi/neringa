#!/bin/bash

# Extract and fix specific build errors

PROJECT_PATH="/Users/j/Desktop/CLAUDE/BAGO/neringa/BAGO_MOBILE_V2"
IOS_PATH="$PROJECT_PATH/ios"

echo "🔎 ERROR EXTRACTION & TARGETED FIXES"
echo "===================================="
echo ""

cd "$PROJECT_PATH"

# Run build and capture all output
echo "Running build to capture errors..."
BUILD_OUTPUT=$(npm run build:ios 2>&1 || true)

echo ""
echo "════ LOOKING FOR ERRORS ════"
echo ""

# Check for specific error patterns
if echo "$BUILD_OUTPUT" | grep -qi "podfile"; then
  echo "❌ Issue: Podfile error detected"
  echo "Fix:"
  echo "  cd $IOS_PATH"
  echo "  ruby -c Podfile"
  echo ""
fi

if echo "$BUILD_OUTPUT" | grep -qi "pod.*not found\|missing pod"; then
  echo "❌ Issue: Missing Pod dependency"
  echo "Fix:"
  echo "  cd $IOS_PATH"
  echo "  pod install --repo-update --verbose"
  echo ""
fi

if echo "$BUILD_OUTPUT" | grep -qi "rncore\|react.native"; then
  echo "❌ Issue: React Native version mismatch"
  echo "Fix:"
  echo "  npm install --legacy-peer-deps --force"
  echo "  cd $IOS_PATH && pod install --repo-update"
  echo ""
fi

if echo "$BUILD_OUTPUT" | grep -qi "xcode.*version\|deployment.target"; then
  echo "❌ Issue: Xcode deployment target mismatch"
  echo "Fix:"
  echo "  sudo xcode-select --reset"
  echo "  npm install"
  echo "  cd $IOS_PATH && pod install --repo-update"
  echo ""
fi

if echo "$BUILD_OUTPUT" | grep -qi "swift\|bridging"; then
  echo "❌ Issue: Swift compilation issue"
  echo "Fix:"
  echo "  cd $IOS_PATH"
  echo "  pod deintegrate"
  echo "  pod install --repo-update"
  echo ""
fi

# Show actual errors
echo "════ ACTUAL ERROR MESSAGES ════"
echo ""
echo "$BUILD_OUTPUT" | grep -i "error" | head -10

echo ""
echo "════ DIAGNOSTIC INFO ════"
echo ""
echo "Pods directory: $([ -d "$IOS_PATH/Pods" ] && echo 'EXISTS' || echo 'MISSING')"
echo "Podfile.lock: $([ -f "$IOS_PATH/Podfile.lock" ] && echo 'EXISTS' || echo 'MISSING')"
echo "Manifest.lock: $([ -f "$IOS_PATH/Pods/Manifest.lock" ] && echo 'EXISTS' || echo 'MISSING')"

# Save full log
if [ ! -z "$BUILD_OUTPUT" ]; then
  echo "$BUILD_OUTPUT" > /tmp/ios_build_error.log
  echo ""
  echo "📝 Full build log saved to: /tmp/ios_build_error.log"
fi

echo ""
echo "💡 RECOMMENDED NEXT STEP:"
echo ""
echo "Run this and send the full error:"
echo "  cd $IOS_PATH"
echo "  pod install --verbose 2>&1 | tee /tmp/pod_verbose.log"
echo "  cat /tmp/pod_verbose.log | grep -i error"
