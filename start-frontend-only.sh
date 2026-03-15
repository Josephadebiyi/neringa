#!/bin/bash

# Start Frontend Only (WebApp + Admin)
echo "🚀 Starting Frontend Services..."
concurrently -n "WEBAPP,ADMIN" -c "bgMagenta.bold,bgGreen.bold" \
  "cd BAGO_WEBAPP && npm run dev" \
  "cd ADMIN_NEW && npm run dev"
