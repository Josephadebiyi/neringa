#!/bin/bash

# Bago Platform - Development Environment Startup Script
# This script starts all services for local development

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "${CYAN}======================================${NC}"
    echo -e "${CYAN}  BAGO Platform - Development Mode${NC}"
    echo -e "${CYAN}======================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

check_dependencies() {
    print_info "Checking dependencies..."

    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi
    print_success "Node.js $(node -v) found"

    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
    print_success "npm $(npm -v) found"

    # Check if concurrently is installed
    if ! npm list -g concurrently &> /dev/null && ! npm list concurrently &> /dev/null; then
        print_warning "concurrently not found. Installing..."
        npm install
    fi
}

check_ports() {
    print_info "Checking if ports are available..."

    PORTS=(3000 5173 5174)
    PORT_NAMES=("Backend API" "Web App" "Admin Panel")

    for i in "${!PORTS[@]}"; do
        PORT=${PORTS[$i]}
        NAME=${PORT_NAMES[$i]}

        if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null ; then
            print_warning "Port $PORT ($NAME) is already in use"
            read -p "Kill process on port $PORT? (y/n) " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                lsof -ti:$PORT | xargs kill -9 2>/dev/null || true
                print_success "Killed process on port $PORT"
            else
                print_error "Cannot start $NAME - port $PORT is in use"
                exit 1
            fi
        else
            print_success "Port $PORT ($NAME) is available"
        fi
    done
}

install_dependencies() {
    if [ "$1" == "--skip-install" ]; then
        print_info "Skipping dependency installation"
        return
    fi

    print_info "Checking if dependencies need to be installed..."

    # Check backend
    if [ ! -d "BAGO_BACKEND/node_modules" ]; then
        print_warning "Backend dependencies not found. Installing..."
        cd BAGO_BACKEND && npm install && cd ..
        print_success "Backend dependencies installed"
    fi

    # Check webapp
    if [ ! -d "BAGO_WEBAPP/node_modules" ]; then
        print_warning "WebApp dependencies not found. Installing..."
        cd BAGO_WEBAPP && npm install && cd ..
        print_success "WebApp dependencies installed"
    fi

    # Check admin
    if [ ! -d "ADMIN_NEW/node_modules" ]; then
        print_warning "Admin dependencies not found. Installing..."
        cd ADMIN_NEW && npm install && cd ..
        print_success "Admin dependencies installed"
    fi
}

start_services() {
    print_info "Starting all services..."
    echo ""
    echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${MAGENTA}  Services will start in 3 seconds...${NC}"
    echo -e "${MAGENTA}  Press Ctrl+C to stop all services${NC}"
    echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    sleep 3

    # Start all services using npm script
    npm run dev
}

print_urls() {
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✓ All services started successfully!${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${BLUE}📱 Backend API:    ${NC}http://localhost:3000"
    echo -e "${MAGENTA}🌐 Web App:        ${NC}http://localhost:5173"
    echo -e "${GREEN}⚙️  Admin Panel:    ${NC}http://localhost:5174"
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Main execution
main() {
    clear
    print_header
    echo ""

    check_dependencies
    check_ports
    install_dependencies "$@"

    # Print URLs before starting (they'll be visible before logs start)
    print_urls

    start_services
}

# Run main function with all arguments
main "$@"
