#!/bin/bash

# Test push notification endpoint
BACKEND_URL="https://neringa.onrender.com"
ADMIN_TOKEN="$BAGO_ADMIN_TOKEN"  # Should be set from environment

if [ -z "$ADMIN_TOKEN" ]; then
  echo "❌ Error: BAGO_ADMIN_TOKEN environment variable not set"
  echo "Please set your admin token first:"
  echo "  export BAGO_ADMIN_TOKEN='your_admin_token'"
  exit 1
fi

# Send test notification to all users with tokens
curl -X POST "$BACKEND_URL/api/bago/admin/send-notification" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "title": "Test Notification",
    "body": "This is a test push notification from Bago!"
  }' \
  -w "\n%{http_code}\n" \
  -s

echo ""
echo "✅ Test notification sent!"
