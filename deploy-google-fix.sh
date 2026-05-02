#!/bin/bash

# Deploy Google Indexing Fix to EC2 Server
# This script updates the application-development.html file with Google verification meta tag

echo "🚀 Deploying Google Indexing Fix to EC2 Server..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're on the server or local
if [ -f "/home/ubuntu/genvedha-website/server.js" ]; then
    echo -e "${BLUE}Running on EC2 server...${NC}"
    cd /home/ubuntu/genvedha-website
else
    echo -e "${YELLOW}This script should be run on your EC2 server${NC}"
    echo ""
    echo "To deploy, SSH into your server and run:"
    echo "  ssh -i your-key.pem ubuntu@your-server-ip"
    echo "  cd ~/genvedha-website"
    echo "  git pull origin main"
    echo "  pm2 restart genvedha-website"
    echo ""
    exit 1
fi

echo -e "${BLUE}Step 1: Checking current directory...${NC}"
pwd

echo ""
echo -e "${BLUE}Step 2: Pulling latest changes from Git...${NC}"
git pull origin main

echo ""
echo -e "${BLUE}Step 3: Verifying files are updated...${NC}"
if grep -q "google-site-verification" public/application-development.html; then
    echo -e "${GREEN}✅ Google verification tag found in application-development.html${NC}"
else
    echo -e "${YELLOW}⚠️  Google verification tag not found. Manual update may be needed.${NC}"
fi

echo ""
echo -e "${BLUE}Step 4: Restarting PM2 application...${NC}"
pm2 restart genvedha-website

echo ""
echo -e "${BLUE}Step 5: Checking PM2 status...${NC}"
pm2 list

echo ""
echo -e "${BLUE}Step 6: Testing endpoints...${NC}"
echo "Testing sitemap.xml..."
curl -s http://localhost:3000/sitemap.xml | head -5

echo ""
echo "Testing application-development.html..."
curl -s http://localhost:3000/application-development.html | grep -i "google-site-verification"

echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Verify https://genvedha.com/application-development.html loads correctly"
echo "2. Go to Google Search Console"
echo "3. Submit your sitemap"
echo "4. Request indexing"
echo ""
