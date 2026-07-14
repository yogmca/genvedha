#!/bin/bash

# Deploy AI E-commerce Service Page to EC2 Server
# This script pulls latest changes, builds, and restarts the server

set -e  # Exit on any error

echo "🚀 Starting deployment to EC2 server..."
echo "================================================"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Navigate to project directory
cd /home/ubuntu/genvedha-website || {
    echo -e "${RED}❌ Failed to navigate to project directory${NC}"
    exit 1
}

echo -e "${YELLOW}📂 Current directory: $(pwd)${NC}"

# Check current branch
CURRENT_BRANCH=$(git branch --show-current)
echo -e "${YELLOW}📍 Current branch: $CURRENT_BRANCH${NC}"

# Stash any local changes
echo -e "${YELLOW}💾 Stashing local changes...${NC}"
git stash

# Pull latest changes from production branch
echo -e "${YELLOW}⬇️  Pulling latest changes from production branch...${NC}"
git checkout production
git pull origin production

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Successfully pulled latest changes${NC}"
else
    echo -e "${RED}❌ Failed to pull changes${NC}"
    exit 1
fi

# Install dependencies (if package.json changed)
echo -e "${YELLOW}📦 Installing/updating dependencies...${NC}"
npm install

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Dependencies installed${NC}"
else
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    exit 1
fi

# Build the React application
echo -e "${YELLOW}🔨 Building React application...${NC}"
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build completed successfully${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

# Stop the running server
echo -e "${YELLOW}🛑 Stopping current server...${NC}"
pkill -f "node.*server.js" || echo "No server process found"
sleep 2

# Start the server using PM2 (recommended for production)
if command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}🔄 Starting server with PM2...${NC}"
    pm2 delete genvedha-website || true
    pm2 start server.js --name genvedha-website
    pm2 save
    echo -e "${GREEN}✅ Server started with PM2${NC}"
else
    # Fallback to nohup if PM2 is not installed
    echo -e "${YELLOW}🔄 Starting server with nohup...${NC}"
    nohup node server.js > server.log 2>&1 &
    echo -e "${GREEN}✅ Server started with nohup${NC}"
fi

# Wait a moment for server to start
sleep 3

# Check if server is running
if pgrep -f "node.*server.js" > /dev/null; then
    echo -e "${GREEN}✅ Server is running${NC}"
    
    # Test the server
    echo -e "${YELLOW}🧪 Testing server response...${NC}"
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200"; then
        echo -e "${GREEN}✅ Server is responding correctly${NC}"
    else
        echo -e "${YELLOW}⚠️  Server started but may not be responding yet${NC}"
    fi
else
    echo -e "${RED}❌ Server failed to start${NC}"
    exit 1
fi

echo ""
echo "================================================"
echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo ""
echo "📊 Deployment Summary:"
echo "  - Branch: production"
echo "  - Build: ✅ Success"
echo "  - Server: ✅ Running"
echo ""
echo "🌐 Your website should now be live at:"
echo "  - https://genvedha.com"
echo "  - New page: https://genvedha.com/ai-ecommerce-solution"
echo ""
echo "📝 To check server logs:"
echo "  - PM2: pm2 logs genvedha-website"
echo "  - Nohup: tail -f server.log"
echo ""
echo "================================================"
