#!/bin/bash

echo "🚀 Building Bago iOS App - Version 1.0.1 (Build 30)"
echo "=================================================="
echo ""
echo "When prompted about Apple account:"
echo "  → Press 'n' (no) - credentials are already stored"
echo ""
echo "Starting build in 3 seconds..."
sleep 3

cd /Users/j/Desktop/CLAUDE/BAGO/neringa/BAGO_MOBILE
npx eas-cli build --platform ios --profile production
