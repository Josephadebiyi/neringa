#!/bin/bash

# iOS Build Script for Bago App
# This script starts an EAS build for iOS with production profile

echo "🚀 Starting iOS Production Build for Bago"
echo "========================================"
echo ""

# Navigate to project directory
cd /Users/j/Desktop/CLAUDE/BAGO/neringa/BAGO_MOBILE

echo "📁 Current directory: $(pwd)"
echo ""

# Show current configuration
echo "📋 Build Configuration:"
echo "  Platform: iOS"
echo "  Profile: production"
echo "  Auto-increment: enabled"
echo ""

# Start the build
echo "🔨 Starting EAS build..."
echo ""
echo "⚠️  You will need to enter your Apple credentials when prompted:"
echo "   Apple ID: taiwojos2@gmail.com"
echo "   Password: Tayelolu@1"
echo "   2FA Code: (from your iPhone)"
echo ""
echo "Press Enter to continue..."
read

# Run the build command
npx eas-cli build --platform ios --profile production

echo ""
echo "✅ Build process completed!"
echo ""
echo "📱 Next steps:"
echo "  1. Check build status at: https://expo.dev"
echo "  2. Once complete, submit with: npx eas-cli submit --platform ios --latest"
echo ""
