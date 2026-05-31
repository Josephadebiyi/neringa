#!/bin/bash
set -e

DEVICE_ID="00008150-001E3DAE2282401C"
APP_DIR="$(dirname "$0")"

echo "=== Building Flutter iOS release ==="
cd "$APP_DIR"
flutter build ios --release 2>&1

RELEASE_APP="$APP_DIR/build/ios/Release-iphoneos/Runner.app"

if [ ! -d "$RELEASE_APP" ]; then
  # fallback: flutter sometimes places it here
  RELEASE_APP=$(find "$APP_DIR/build/ios" -name "Runner.app" -path "*iphoneos*" | grep -v simulator | head -1)
fi

if [ -z "$RELEASE_APP" ] || [ ! -d "$RELEASE_APP" ]; then
  echo "ERROR: Could not find Runner.app"
  exit 1
fi

echo "=== Installing to iPhone ($DEVICE_ID) ==="
xcrun devicectl device install app --device "$DEVICE_ID" "$RELEASE_APP"

echo "=== Launching app ==="
xcrun devicectl device process launch --device "$DEVICE_ID" com.deracali.boltexponativewind

echo "=== Done — app is running on device ==="
