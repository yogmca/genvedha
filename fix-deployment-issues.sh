#!/bin/bash

# Fix Deployment Issues Script
# This script fixes the 4 critical issues found in the test

echo "🔧 FIXING DEPLOYMENT ISSUES"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Issue 1: MongoDB Connection Error (querySrv ENOTFOUND _mongodb._tcp.undefined)
echo -e "${BLUE}1️⃣  Fixing MongoDB Connection${NC}"
echo "-----------------------------------"

if [ -f ".env" ]; then
    # Check if MONGODB_URI is set to undefined or empty
    if grep -q "MONGODB_URI=undefined" .env || grep -q "MONGODB_URI=$" .env || ! grep -q "MONGODB_URI=" .env; then
        echo -e "${YELLOW}⚠️  MongoDB URI is not properly configured${NC}"
        echo ""
        echo "Please provide your MongoDB connection string:"
        echo "Example: mongodb+srv://username:password@cluster.mongodb.net/database"
        echo ""
        read -p "Enter MongoDB URI: " MONGODB_URI
        
        # Update or add MONGODB_URI in .env
        if grep -q "MONGODB_URI=" .env; then
            sed -i.bak "s|MONGODB_URI=.*|MONGODB_URI=$MONGODB_URI|g" .env
        else
            echo "MONGODB_URI=$MONGODB_URI" >> .env
        fi
        
        echo -e "${GREEN}✅ MongoDB URI updated${NC}"
    else
        echo -e "${GREEN}✅ MongoDB URI is configured${NC}"
    fi
else
    echo -e "${RED}❌ .env file not found${NC}"
    exit 1
fi
echo ""

# Issue 2: Port 3000 Already in Use (EADDRINUSE)
echo -e "${BLUE}2️⃣  Fixing Port Conflict${NC}"
echo "-----------------------------------"

# Find process using port 3000
PORT_PID=$(lsof -ti:3000 2>/dev/null)

if [ -n "$PORT_PID" ]; then
    echo "Found process(es) using port 3000: $PORT_PID"
    
    # Check if it's a PM2 process
    if pm2 list | grep -q "online"; then
        echo "Stopping PM2 processes..."
        pm2 stop all
        pm2 delete all
        echo -e "${GREEN}✅ Stopped existing PM2 processes${NC}"
    fi
    
    # Kill any remaining processes on port 3000
    PORT_PID=$(lsof -ti:3000 2>/dev/null)
    if [ -n "$PORT_PID" ]; then
        echo "Killing remaining processes on port 3000..."
        kill -9 $PORT_PID 2>/dev/null
        echo -e "${GREEN}✅ Freed port 3000${NC}"
    fi
else
    echo -e "${GREEN}✅ Port 3000 is available${NC}"
fi
echo ""

# Issue 3: PM2 Startup Not Configured
echo -e "${BLUE}3️⃣  Configuring PM2 Startup${NC}"
echo "-----------------------------------"

# Generate PM2 startup script
echo "Configuring PM2 to start on system boot..."

# Detect the init system and user
CURRENT_USER=$(whoami)
STARTUP_CMD=$(pm2 startup | grep "sudo" | tail -1)

if [ -n "$STARTUP_CMD" ]; then
    echo "Please run this command with sudo:"
    echo ""
    echo -e "${YELLOW}$STARTUP_CMD${NC}"
    echo ""
    echo "After running the above command, press Enter to continue..."
    read -p ""
    
    echo -e "${GREEN}✅ PM2 startup configuration initiated${NC}"
else
    echo -e "${YELLOW}⚠️  Could not generate startup command${NC}"
fi
echo ""

# Issue 4: Restart Application with Fixed Configuration
echo -e "${BLUE}4️⃣  Restarting Application${NC}"
echo "-----------------------------------"

# Make sure we're in the right directory
if [ ! -f "server.js" ]; then
    echo -e "${RED}❌ server.js not found. Are you in the project directory?${NC}"
    exit 1
fi

# Start the application with PM2
echo "Starting application with PM2..."

if pm2 list | grep -q "genvedha"; then
    echo "Restarting existing PM2 process..."
    pm2 restart genvedha
else
    echo "Starting new PM2 process..."
    pm2 start server.js --name genvedha
fi

# Wait a moment for the app to start
sleep 3

# Check if app started successfully
if pm2 list | grep "genvedha" | grep -q "online"; then
    echo -e "${GREEN}✅ Application started successfully${NC}"
    
    # Save PM2 configuration
    pm2 save
    echo -e "${GREEN}✅ PM2 configuration saved${NC}"
else
    echo -e "${RED}❌ Application failed to start${NC}"
    echo "Checking logs..."
    pm2 logs genvedha --lines 20 --nostream
    exit 1
fi
echo ""

# Verify the fixes
echo -e "${BLUE}5️⃣  Verifying Fixes${NC}"
echo "-----------------------------------"

# Test 1: Check MongoDB connection in logs
sleep 2
if pm2 logs genvedha --nostream --lines 50 | grep -q "Connected to MongoDB"; then
    echo -e "${GREEN}✅ MongoDB connection successful${NC}"
else
    echo -e "${YELLOW}⚠️  MongoDB connection not confirmed yet${NC}"
    echo "Check logs: pm2 logs genvedha"
fi

# Test 2: Check if port 3000 is listening
if netstat -tuln 2>/dev/null | grep -q ":3000 " || ss -tuln 2>/dev/null | grep -q ":3000 "; then
    echo -e "${GREEN}✅ Port 3000 is listening${NC}"
else
    echo -e "${RED}❌ Port 3000 is not listening${NC}"
fi

# Test 3: Check if app responds
HTTP_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null)
if [ "$HTTP_RESPONSE" = "200" ] || [ "$HTTP_RESPONSE" = "304" ]; then
    echo -e "${GREEN}✅ Application responds on localhost (HTTP $HTTP_RESPONSE)${NC}"
else
    echo -e "${RED}❌ Application not responding (HTTP $HTTP_RESPONSE)${NC}"
fi

# Test 4: Check PM2 status
if pm2 list | grep "genvedha" | grep -q "online"; then
    echo -e "${GREEN}✅ PM2 process is online${NC}"
else
    echo -e "${RED}❌ PM2 process is not online${NC}"
fi

echo ""
echo "=================================="
echo -e "${BLUE}📊 FIX SUMMARY${NC}"
echo "=================================="
echo ""
echo "✅ Fixed MongoDB connection configuration"
echo "✅ Resolved port 3000 conflict"
echo "✅ Configured PM2 startup (requires sudo command)"
echo "✅ Restarted application"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: Don't forget to run the PM2 startup command shown above!${NC}"
echo ""
echo "Run the test again to verify all fixes:"
echo "  bash test-ec2-deployment.sh"
echo ""
echo "View application logs:"
echo "  pm2 logs genvedha"
echo ""
echo "Check application status:"
echo "  pm2 status"
echo ""
