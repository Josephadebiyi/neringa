#!/bin/bash

# Diagnostic script to identify pod install issues

PROJECT_PATH="/Users/j/Desktop/CLAUDE/BAGO/neringa/BAGO_MOBILE_V2"
IOS_PATH="$PROJECT_PATH/ios"

echo "📋 iOS Build Diagnostic Report"
echo "================================"
echo ""

echo "1️⃣ System Information:"
echo "  macOS Version: $(sw_vers -productVersion)"
echo "  Ruby Version: $(ruby -v)"
echo "  CocoaPods Version: $(pod --version)"
echo "  Xcode Version: $(xcode-select --version 2>/dev/null || echo 'Not found')"
echo ""

echo "2️⃣ Project Files:"
echo "  Podfile exists: $([ -f "$IOS_PATH/Podfile" ] && echo 'Yes' || echo 'No')"
echo "  Podfile.lock exists: $([ -f "$IOS_PATH/Podfile.lock" ] && echo 'Yes' || echo 'No')"
echo "  Podfile.properties.json exists: $([ -f "$IOS_PATH/Podfile.properties.json" ] && echo 'Yes' || echo 'No')"
echo ""

echo "3️⃣ Pod Configuration:"
if [ -f "$IOS_PATH/Podfile.properties.json" ]; then
  echo "  Podfile.properties.json contents:"
  cat "$IOS_PATH/Podfile.properties.json" | sed 's/^/    /'
else
  echo "  Podfile.properties.json not found"
fi
echo ""

echo "4️⃣ Checking for common issues:"

# Check for pod repo issues
echo "  Checking pod repos..."
pod repo list 2>&1 | head -20

echo ""
echo "5️⃣ Running diagnostic pod install..."
cd "$IOS_PATH"
pod install --verbose --no-ansi 2>&1 | tail -100

echo ""
echo "📊 Diagnostic complete. Check output above for errors."
