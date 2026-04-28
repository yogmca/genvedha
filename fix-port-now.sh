#!/bin/bash

# 🔧 Emergency Port 3000 Conflict Fix
# Run this script ON YOUR EC2 SERVER

set -e

echo "🔧 Emergency Port 3000 Conflict Fix"
echo "===================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Stop all PM2 processes
echo -e "${YELLOW}🛑 Stopping all PM2 processes...${NC}"
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
echo -e "${GREEN}✅ PM2 processes stopped${NC}"
echo ""

# Step 2: Kill any process on port 3000
echo -e "${YELLOW}🔍 Checking for processes on port 3000...${NC}"
PORT_PID=$(sudo lsof -t -i:3000 2>/dev/null || true)

if [ -n "$PORT_PID" ]; then
    echo -e "${YELLOW}Found process(es): $PORT_PID${NC}"
    echo -e "${YELLOW}🛑 Killing process(es)...${NC}"
    sudo kill -9 $PORT_PID 2>/dev/null || true
    sleep 2
    echo -e "${GREEN}✅ Process(es) killed${NC}"
else
    echo -e "${GREEN}✅ No process found on port 3000${NC}"
fi
echo ""

# Step 3: Verify port is free
echo -e "${YELLOW}🔍 Verifying port 3000 is free...${NC}"
if sudo lsof -i:3000 >/dev/null 2>&1; then
    echo -e "${RED}❌ Port 3000 is still in use!${NC}"
    echo "Processes using port 3000:"
    sudo lsof -i:3000
    exit 1
else
    echo -e "${GREEN}✅ Port 3000 is free${NC}"
fi
echo ""

# Step 4: Navigate to project directory
echo -e "${YELLOW}📁 Navigating to project directory...${NC}"
if [ -d "/root/genvedha-website" ]; then
    cd /root/genvedha-website
    echo -e "${GREEN}✅ In /root/genvedha-website${NC}"
elif [ -d "$HOME/genvedha-website" ]; then
    cd "$HOME/genvedha-website"
    echo -e "${GREEN}✅ In $HOME/genvedha-website${NC}"
else
    echo -e "${RED}❌ Project directory not found!${NC}"
    exit 1
fi
echo ""

# Step 5: Pull latest changes
echo -e "${YELLOW}📥 Pulling latest changes...${NC}"
git pull origin production || {
    echo -e "${YELLOW}⚠️  Git pull failed, continuing anyway...${NC}"
}
echo ""

# Step 6: Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm install
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Step 7: Build application
echo -e "${YELLOW}🔨 Building application...${NC}"
npm run build
echo -e "${GREEN}✅ Build complete${NC}"
echo ""

# Step 8: Start with PM2
echo -e "${YELLOW}🚀 Starting application with PM2...${NC}"
pm2 start server.js --name genvedha
echo -e "${GREEN}✅ Application started${NC}"
echo ""

# Step 9: Save PM2 configuration
echo -e "${YELLOW}💾 Saving PM2 configuration...${NC}"
pm2 save
pm2 startup || true
echo -e "${GREEN}✅ PM2 configuration saved${NC}"
echo ""

# Step 10: Check status
echo -e "${YELLOW}📊 Application Status:${NC}"
echo ""
pm2 status
echo ""

# Step 11: Show recent logs
echo -e "${YELLOW}📋 Recent Logs:${NC}"
echo ""
pm2 logs genvedha --lines 15 --nostream
echo ""

# Step 12: Test the application
echo -e "${YELLOW}🧪 Testing application...${NC}"
sleep 3
if curl -s http://localhost:3000 >/dev/null; then
    echo -e "${GREEN}✅ Application is responding on port 3000!${NC}"
else
    echo -e "${RED}⚠️  Application may not be responding yet. Check logs above.${NC}"
fi
echo ""

echo -e "${GREEN}🎉 Done!${NC}"
echo ""
echo "Next steps:"
echo "1. Check if site is accessible: http://genvedha.com"
echo "2. Monitor logs: pm2 logs genvedha"
echo "3. Check status: pm2 status"
echo ""
