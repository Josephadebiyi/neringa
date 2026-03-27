#!/bin/bash

# Comprehensive iOS Build Troubleshooting Script
# This script identifies and fixes the root cause

PROJECT_PATH="/Users/j/Desktop/CLAUDE/BAGO/neringa/BAGO_MOBILE_V2"
IOS_PATH="$PROJECT_PATH/ios"
BUILD_LOG="$PROJECT_PATH/ios_build_detailed.log"

echo "════════════════════════════════════════════"
echo "  iOS Build Troubleshooting & Diagnostic"
echo "════════════════════════════════════════════"
echo ""

# Function to log
log_step() {
  echo "[$(date '+%H:%M:%S')] $1"
}

# Step 1: System check
log_step "SYSTEM CHECK"
echo "  macOS: $(sw_vers -productVersion)"
echo "  Xcode: $(xcode-select -p 2>/dev/null || echo 'Not found')"
echo "  Ruby: $(ruby -v)"
echo "  Node: $(node -v)"
echo "  npm: $(npm -v)"
echo ""

# Step 2: Project structure check
log_step "PROJECT FILES"
echo "  Podfile: $([ -f "$IOS_PATH/Podfile" ] && echo '✓' || echo '✗')"
echo "  Podfile.lock: $([ -f "$IOS_PATH/Podfile.lock" ] && echo '✓' || echo '✗')"
echo "  Pods directory: $([ -d "$IOS_PATH/Pods" ] && echo '✓' || echo '✗')"
echo "  .xcodeproj: $([ -d "$IOS_PATH/Bago.xcodeproj" ] && echo '✓' || echo '✗')"
echo "  .xcworkspace: $([ -d "$IOS_PATH/Bago.xcworkspace" ] && echo '✓' || echo '✗')"
echo ""

# Step 3: Try building with maximum verbosity
log_step "ATTEMPTING BUILD (with verbose logging)"
echo "  This may take 5-10 minutes..."
echo ""

cd "$PROJECT_PATH"

# First ensure pods are installed
log_step "Ensuring pods are installed"
cd "$IOS_PATH"
pod install --repo-update 2>&1 | head -20

# Check if lock file exists now
if [ ! -f "$IOS_PATH/Podfile.lock" ]; then
  echo ""
  log_step "⚠️  Podfile.lock STILL not created after pod install"
  echo ""
  
  # Check Pods/Manifest.lock as fallback
  if [ -f "$IOS_PATH/Pods/Manifest.lock" ]; then
    log_step "Found Pods/Manifest.lock - using as Podfile.lock"
    cp "$IOS_PATH/Pods/Manifest.lock" "$IOS_PATH/Podfile.lock"
  else
    log_step "ERROR: Neither Podfile.lock nor Pods/Manifest.lock exists"
    echo ""
    echo "Checking pod install errors..."
    cd "$IOS_PATH"
    pod install --verbose 2>&1 | tail -100 | tee /tmp/pod_error.log
    echo ""
    echo "Full error saved to /tmp/pod_error.log"
    echo ""
    exit 1
  fi
fi

log_step "Pods configured successfully"
echo ""

# Step 4: Try build
log_step "BUILDING iOS APP"
cd "$PROJECT_PATH"

# Try with npm script first
log_step "Attempt 1: Using npm run build:ios"
npm run build:ios 2>&1 | tee "$BUILD_LOG"

if [ ${PIPESTATUS[0]} -eq 0 ]; then
  echo ""
  log_step "✅ BUILD SUCCESSFUL!"
  exit 0
else
  echo ""
  log_step "❌ npm run build:ios failed"
  echo ""
  
  # Try direct eas command
  log_step "Attempt 2: Using EAS CLI directly"
  npx eas-cli build --platform ios --profile production 2>&1 | tee -a "$BUILD_LOG"
  
  if [ ${PIPESTATUS[0]} -eq 0 ]; then
    echo ""
    log_step "✅ BUILD SUCCESSFUL!"
    exit 0
  else
    echo ""
    log_step "❌ EAS build also failed"
    echo ""
    
    # Extract key errors
    log_step "ANALYZING ERRORS"
    echo ""
    echo "Key error lines from build log:"
    grep -i "error\|fatal\|failed\|undefined" "$BUILD_LOG" | head -20
    
    echo ""
    echo "📝 Full build log saved to: $BUILD_LOG"
    echo ""
    echo "Next steps:"
    echo "1. Check the errors above"
    echo "2. Common fixes:"
    echo "   - React Native version mismatch: npm install --legacy-peer-deps"
    echo "   - Pod conflicts: cd ios && pod deintegrate && pod install --repo-update"
    echo "   - Xcode issues: sudo xcode-select --reset"
    echo "3. Try local build: xcodebuild -workspace ios/Bago.xcworkspace -scheme Bago -configuration Release"
    echo ""
  fi
fi
