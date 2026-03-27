#!/bin/bash

# iOS Build Fix Script for BAGO Mobile V2
# This script fixes common CocoaPods installation issues

set -e

PROJECT_PATH="/Users/j/Desktop/CLAUDE/BAGO/neringa/BAGO_MOBILE_V2"
IOS_PATH="$PROJECT_PATH/ios"

echo "====================="
echo "🚀 iOS Build Fix Script"
echo "====================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
  echo -e "${GREEN}✓${NC} $1"
}

print_error() {
  echo -e "${RED}✗${NC} $1"
}

print_warning() {
  echo -e "${YELLOW}⚠${NC} $1"
}

# Step 1: Check if we're in the right directory
if [ ! -d "$IOS_PATH" ]; then
  print_error "iOS directory not found at $IOS_PATH"
  exit 1
fi

print_status "Found iOS directory"

# Step 2: Clean up
echo ""
echo "Step 1: Cleaning up old files..."
cd "$PROJECT_PATH"
rm -rf ios/Pods
rm -f ios/Podfile.lock
rm -rf ios/.symlinks/
rm -rf ~/Library/Developer/Xcode/DerivedData/Bago*
print_status "Cleaned up pod files and Xcode cache"

# Step 3: Update CocoaPods
echo ""
echo "Step 2: Updating CocoaPods..."
sudo gem update cocoapods 2>/dev/null || true
print_status "CocoaPods updated"

# Step 4: Clear pod cache
echo ""
echo "Step 3: Clearing Pod cache..."
rm -rf ~/.cocoapods/repos/trunk/*
pod setup 2>/dev/null || pod repo update 2>/dev/null || true
print_status "Pod repos updated"

# Step 5: NPM cleanup
echo ""
echo "Step 4: Installing npm dependencies..."
npm ci --legacy-peer-deps || npm install --legacy-peer-deps
print_status "NPM dependencies installed"

# Step 6: Pod install with verbose output
echo ""
echo "Step 5: Installing Pods (this may take a few minutes)..."
cd "$IOS_PATH"

echo ""
print_warning "Running: pod install --repo-update"
if pod install --repo-update --verbose 2>&1 | tee pod_install.log; then
  print_status "Pods installed successfully"
else
  print_error "Pod install failed. See pod_install.log for details"
  echo ""
  echo "Last 50 lines of pod_install.log:"
  tail -50 pod_install.log
  exit 1
fi

# Step 7: Verify Podfile.lock
echo ""
echo "Step 6: Verifying installation..."
if [ -f "Podfile.lock" ]; then
  print_status "Podfile.lock created successfully"
else
  print_error "Podfile.lock was not created"
  exit 1
fi

cd "$PROJECT_PATH"

# Step 8: Try building
echo ""
echo "Step 7: Building iOS app..."
print_warning "Running: npm run build:ios"
npm run build:ios

print_status "Build completed successfully!"
echo ""
echo "====================="
echo "✅ All done!"
echo "====================="
