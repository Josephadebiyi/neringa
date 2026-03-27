#!/bin/bash

# Force Podfile.lock creation

PROJECT_PATH="/Users/j/Desktop/CLAUDE/BAGO/neringa/BAGO_MOBILE_V2"
IOS_PATH="$PROJECT_PATH/ios"

echo "🔧 Force Podfile.lock Creation"
echo "=============================="
echo ""

cd "$IOS_PATH"

echo "Attempt 1: Standard pod install..."
if pod install; then
  if [ -f "Podfile.lock" ]; then
    echo "✓ Success! Lock file created."
  else
    echo "✗ Lock file still missing. Trying alternative..."
    
    echo ""
    echo "Attempt 2: Pod install with --no-update..."
    pod install --no-update
    
    if [ -f "Podfile.lock" ]; then
      echo "✓ Success! Lock file created with --no-update"
    else
      echo "✗ Still no lock file. Trying deintegrate + install..."
      
      echo ""
      echo "Attempt 3: Pod deintegrate then install..."
      pod deintegrate
      sleep 2
      pod install --repo-update
      
      if [ -f "Podfile.lock" ]; then
        echo "✓ Success! Lock file created after deintegrate."
      else
        echo "✗ Failed. Trying manual pod update..."
        
        echo ""
        echo "Attempt 4: Pod update then pod install..."
        pod update
        sleep 2
        pod install --no-update
        
        if [ -f "Podfile.lock" ]; then
          echo "✓ Success! Lock file created."
        else
          echo "❌ All attempts failed. Extracting Podfile.lock from Pods manifest..."
          
          # Last resort: check Pods manifest
          if [ -f "Pods/Manifest.lock" ]; then
            echo "  Found Pods/Manifest.lock, copying to Podfile.lock..."
            cp Pods/Manifest.lock Podfile.lock
            echo "✓ Podfile.lock created from manifest"
          else
            echo "❌ Pods/Manifest.lock not found either"
            exit 1
          fi
        fi
      fi
    fi
  fi
else
  echo "✗ Pod install command failed"
  exit 1
fi

# Verify
echo ""
echo "Final verification..."
if [ -f "Podfile.lock" ]; then
  echo "✓ Podfile.lock exists: $(stat -f%z Podfile.lock 2>/dev/null || stat -c%s Podfile.lock) bytes"
  
  cd "$PROJECT_PATH"
  echo ""
  echo "Building iOS app..."
  npm run build:ios
else
  echo "✗ Podfile.lock still does not exist"
  exit 1
fi
