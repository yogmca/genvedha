#!/bin/bash

# Deploy SEO Updates to Production Server
# This script deploys all SEO-related files to your EC2 server

set -e  # Exit on any error

echo "🚀 GenVedha SEO Deployment Script"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration (Update these with your server details)
SERVER_USER="ubuntu"
SERVER_IP=""  # Will be prompted if not set
KEY_FILE=""   # Optional - leave empty if using password or SSH config
PROJECT_DIR="/home/ubuntu/genvedha-website"

# Prompt for server IP if not set
if [ -z "$SERVER_IP" ]; then
    echo -e "${YELLOW}📝 Server Configuration${NC}"
    read -p "Enter your EC2 server IP address: " SERVER_IP
    echo ""
fi

# Check authentication method
echo -e "${YELLOW}🔐 Authentication Method${NC}"
echo "1. SSH Key file (.pem)"
echo "2. Password authentication"
echo "3. SSH config (already configured)"
read -p "Select method (1/2/3): " AUTH_METHOD
echo ""

SSH_OPTS=""
SCP_OPTS=""

if [ "$AUTH_METHOD" = "1" ]; then
    read -p "Enter path to your SSH key file: " KEY_FILE
    if [ ! -f "$KEY_FILE" ]; then
        echo -e "${RED}❌ SSH key not found: $KEY_FILE${NC}"
        exit 1
    fi
    SSH_OPTS="-i $KEY_FILE"
    SCP_OPTS="-i $KEY_FILE"
elif [ "$AUTH_METHOD" = "2" ]; then
    echo -e "${YELLOW}You will be prompted for password during deployment${NC}"
    SSH_OPTS=""
    SCP_OPTS=""
elif [ "$AUTH_METHOD" = "3" ]; then
    echo -e "${GREEN}Using SSH config${NC}"
    SSH_OPTS=""
    SCP_OPTS=""
else
    echo -e "${RED}Invalid selection${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}📋 Deployment Summary${NC}"
echo "Server: $SERVER_USER@$SERVER_IP"
echo "Project Directory: $PROJECT_DIR"
echo "Authentication: Method $AUTH_METHOD"
echo ""
read -p "Press Enter to continue or Ctrl+C to cancel..."
echo ""

echo -e "${BLUE}📦 Step 1: Preparing SEO files...${NC}"
echo "Files to deploy:"
echo "  - public/sitemap.xml"
echo "  - public/robots.txt"
echo "  - public/index.html (with SEO meta tags)"
echo "  - public/.htaccess"
echo "  - server.js (with sitemap routes)"
echo ""

echo -e "${BLUE}📤 Step 2: Uploading files to server...${NC}"

# Upload sitemap.xml
echo "Uploading sitemap.xml..."
scp $SCP_OPTS public/sitemap.xml "$SERVER_USER@$SERVER_IP:$PROJECT_DIR/public/"

# Upload robots.txt
echo "Uploading robots.txt..."
scp $SCP_OPTS public/robots.txt "$SERVER_USER@$SERVER_IP:$PROJECT_DIR/public/"

# Upload updated index.html
echo "Uploading index.html with SEO meta tags..."
scp $SCP_OPTS public/index.html "$SERVER_USER@$SERVER_IP:$PROJECT_DIR/public/"

# Upload .htaccess
echo "Uploading .htaccess..."
scp $SCP_OPTS public/.htaccess "$SERVER_USER@$SERVER_IP:$PROJECT_DIR/public/"

# Upload updated server.js
echo "Uploading server.js with sitemap routes..."
scp $SCP_OPTS server.js "$SERVER_USER@$SERVER_IP:$PROJECT_DIR/"

echo -e "${GREEN}✅ Files uploaded successfully!${NC}"
echo ""

echo -e "${BLUE}🔄 Step 3: Restarting server...${NC}"
ssh $SSH_OPTS "$SERVER_USER@$SERVER_IP" << 'ENDSSH'
    cd /home/ubuntu/genvedha-website
    
    # Check if PM2 is being used
    if command -v pm2 &> /dev/null; then
        echo "Restarting with PM2..."
        pm2 restart genvedha-server || pm2 start server.js --name genvedha-server
    else
        echo "PM2 not found. Please restart your server manually."
    fi
    
    echo "Server restarted!"
ENDSSH

echo -e "${GREEN}✅ Server restarted successfully!${NC}"
echo ""

echo -e "${BLUE}🧪 Step 4: Testing SEO endpoints...${NC}"

# Test sitemap
echo "Testing sitemap.xml..."
SITEMAP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://$SERVER_IP:3000/sitemap.xml")
if [ "$SITEMAP_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ Sitemap accessible (HTTP $SITEMAP_STATUS)${NC}"
else
    echo -e "${RED}❌ Sitemap not accessible (HTTP $SITEMAP_STATUS)${NC}"
fi

# Test robots.txt
echo "Testing robots.txt..."
ROBOTS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://$SERVER_IP:3000/robots.txt")
if [ "$ROBOTS_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ Robots.txt accessible (HTTP $ROBOTS_STATUS)${NC}"
else
    echo -e "${RED}❌ Robots.txt not accessible (HTTP $ROBOTS_STATUS)${NC}"
fi

echo ""
echo -e "${GREEN}🎉 SEO Deployment Complete!${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}📋 Next Steps:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Verify files are accessible:"
echo "   • https://genvedha.com/sitemap.xml"
echo "   • https://genvedha.com/robots.txt"
echo ""
echo "2. Set up Google Search Console:"
echo "   • Visit: https://search.google.com/search-console"
echo "   • Add property: https://genvedha.com"
echo "   • Verify ownership (see GOOGLE-SEARCH-CONSOLE-SETUP.md)"
echo "   • Submit sitemap: https://genvedha.com/sitemap.xml"
echo ""
echo "3. Request indexing:"
echo "   • Use URL Inspection tool in Search Console"
echo "   • Request indexing for: https://genvedha.com"
echo ""
echo "4. Monitor progress:"
echo "   • Check Search Console daily for first week"
echo "   • Search: site:genvedha.com (to see indexed pages)"
echo "   • Search: GenVedha (to see if brand appears)"
echo ""
echo "5. Read the guides:"
echo "   • SEO-SETUP-GUIDE.md - Complete SEO documentation"
echo "   • GOOGLE-SEARCH-CONSOLE-SETUP.md - Step-by-step verification"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${YELLOW}⏱️  Expected Timeline:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Week 1-2: Google discovers and starts indexing"
echo "  Week 3-4: Site appears in search results"
echo "  Month 2-3: Rankings improve, traffic increases"
echo ""
echo -e "${GREEN}✨ Your website is now SEO-optimized!${NC}"
echo ""
