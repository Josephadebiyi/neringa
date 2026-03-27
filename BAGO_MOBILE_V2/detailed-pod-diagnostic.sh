#!/bin/bash

# Detailed diagnostic for Podfile.lock issue

PROJECT_PATH="/Users/j/Desktop/CLAUDE/BAGO/neringa/BAGO_MOBILE_V2"
IOS_PATH="$PROJECT_PATH/ios"

echo "🔍 Detailed Pod Installation Diagnostic"
echo "======================================="
echo ""

# Check current directory permissions
echo "1️⃣ Directory Permissions:"
ls -la "$IOS_PATH" | grep -E "Podfile|Pods" || echo "  No Podfile or Pods directory found"
echo ""

# Check if Podfile exists
echo "2️⃣ Podfile Status:"
if [ -f "$IOS_PATH/Podfile" ]; then
  echo "  ✓ Podfile exists"
  echo "  Location: $IOS_PATH/Podfile"
  echo "  Size: $(stat -f%z $IOS_PATH/Podfile 2>/dev/null || stat -c%s $IOS_PATH/Podfile) bytes"
else
  echo "  ✗ Podfile NOT found"
fi
echo ""

# Search for Podfile.lock everywhere
echo "3️⃣ Searching for Podfile.lock:"
LOCKFILE_LOCATIONS=$(find "$PROJECT_PATH" -name "Podfile.lock" -type f 2>/dev/null)
if [ -z "$LOCKFILE_LOCATIONS" ]; then
  echo "  ✗ Podfile.lock not found anywhere in project"
else
  echo "  Found at:"
  echo "$LOCKFILE_LOCATIONS" | sed 's/^/    /'
fi
echo ""

# Check Pods directory
echo "4️⃣ Pods Directory Status:"
if [ -d "$IOS_PATH/Pods" ]; then
  echo "  ✓ Pods directory exists"
  echo "  Contents: $(ls -1 $IOS_PATH/Pods | head -5)"
else
  echo "  ✗ Pods directory NOT found"
fi
echo ""

# Try running pod install with maximum verbosity
echo "5️⃣ Running 'pod install --verbose' (this may take a moment)..."
echo ""
cd "$IOS_PATH"

# Run and capture output
POD_OUTPUT=$(pod install --verbose 2>&1)
POD_EXIT_CODE=$?

echo "Exit code: $POD_EXIT_CODE"
echo ""

# Check if lock file was created NOW
if [ -f "$IOS_PATH/Podfile.lock" ]; then
  echo "✓ SUCCESS: Podfile.lock now exists!"
  echo "  Size: $(stat -f%z $IOS_PATH/Podfile.lock 2>/dev/null || stat -c%s $IOS_PATH/Podfile.lock) bytes"
  echo ""
  echo "Continuing with build..."
  cd "$PROJECT_PATH"
  npm run build:ios
else
  echo "✗ Podfile.lock was still NOT created"
  echo ""
  echo "Pod install output (last 80 lines):"
  echo "$POD_OUTPUT" | tail -80
  echo ""
  echo "Looking for errors..."
  echo "$POD_OUTPUT" | grep -i -E "error|failed|fatal" | head -20
fi
