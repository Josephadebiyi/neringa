#!/bin/bash

# Bago Platform - Stop All Services Script

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Stopping all Bago services...${NC}"

# Kill processes on specific ports
PORTS=(3000 5173 5174)
PORT_NAMES=("Backend API" "Web App" "Admin Panel")

for i in "${!PORTS[@]}"; do
    PORT=${PORTS[$i]}
    NAME=${PORT_NAMES[$i]}

    if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null ; then
        echo -e "${YELLOW}Stopping $NAME (port $PORT)...${NC}"
        lsof -ti:$PORT | xargs kill -9 2>/dev/null || true
        echo -e "${GREEN}✓ $NAME stopped${NC}"
    else
        echo -e "${GREEN}✓ $NAME already stopped${NC}"
    fi
done

echo ""
echo -e "${GREEN}All services stopped successfully!${NC}"
