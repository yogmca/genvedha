#!/bin/bash

# Emergency Fix Script for GenVedha.com
# Run this on your EC2 instance

set -e

echo "🚨 Emergency Fix for GenVedha.com"
echo "=================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root for some commands
if [ "$EUID" -eq 0 ]; then 
    SUDO=""
else 
    SUDO="sudo"
fi

echo "Step 1: Checking application status..."
echo "--------------------------------------"

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo -e "${RED}❌ PM2 is not installed${NC}"
    echo "Installing PM2..."
    npm install -g pm2
fi

# Check PM2 status
echo "Current PM2 processes:"
pm2 status

# Check if genvedha-website is running
if pm2 list | grep -q "genvedha-website"; then
    echo -e "${GREEN}✅ GenVedha app found in PM2${NC}"
    
    # Check if it's online
    if pm2 list | grep "genvedha-website" | grep -q "online"; then
        echo -e "${GREEN}✅ App is online${NC}"
    else
        echo -e "${YELLOW}⚠️  App is not online, restarting...${NC}"
        pm2 restart genvedha-website
    fi
else
    echo -e "${RED}❌ GenVedha app not found in PM2${NC}"
    echo "Starting application..."
    
    # Find the project directory
    if [ -d ~/genvedha-website ]; then
        cd ~/genvedha-website
        pm2 start server.js --name genvedha-website
        pm2 save
        echo -e "${GREEN}✅ Application started${NC}"
    else
        echo -e "${RED}❌ Project directory not found at ~/genvedha-website${NC}"
        exit 1
    fi
fi

echo ""
echo "Step 2: Checking port 3000..."
echo "-------------------------------"

# Check if port 3000 is listening
if $SUDO netstat -tlnp 2>/dev/null | grep -q ":3000"; then
    echo -e "${GREEN}✅ Port 3000 is listening${NC}"
    $SUDO netstat -tlnp | grep ":3000"
else
    echo -e "${RED}❌ Port 3000 is NOT listening${NC}"
    echo "This means the application is not running properly."
    echo "Checking PM2 logs..."
    pm2 logs genvedha-website --lines 50 --nostream
fi

echo ""
echo "Step 3: Testing local connection..."
echo "------------------------------------"

# Test localhost:3000
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200"; then
    echo -e "${GREEN}✅ Application responds on localhost:3000${NC}"
else
    echo -e "${RED}❌ Application not responding on localhost:3000${NC}"
    echo "Checking logs for errors..."
    pm2 logs genvedha-website --lines 30 --nostream
fi

echo ""
echo "Step 4: Checking Nginx status..."
echo "---------------------------------"

# Check if Nginx is installed
if command -v nginx &> /dev/null; then
    echo -e "${GREEN}✅ Nginx is installed${NC}"
    
    # Check Nginx status
    if $SUDO systemctl is-active --quiet nginx; then
        echo -e "${GREEN}✅ Nginx is running${NC}"
    else
        echo -e "${YELLOW}⚠️  Nginx is not running, starting...${NC}"
        $SUDO systemctl start nginx
        $SUDO systemctl enable nginx
    fi
    
    # Test Nginx configuration
    echo "Testing Nginx configuration..."
    if $SUDO nginx -t 2>&1; then
        echo -e "${GREEN}✅ Nginx configuration is valid${NC}"
    else
        echo -e "${RED}❌ Nginx configuration has errors${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Nginx is not installed${NC}"
    echo "Nginx is needed for HTTPS. Install it with:"
    echo "  sudo apt update && sudo apt install -y nginx"
fi

echo ""
echo "Step 5: Checking SSL certificates..."
echo "-------------------------------------"

# Check if certbot is installed
if command -v certbot &> /dev/null; then
    echo -e "${GREEN}✅ Certbot is installed${NC}"
    
    # List certificates
    echo "Current SSL certificates:"
    $SUDO certbot certificates 2>&1 || echo "No certificates found"
else
    echo -e "${YELLOW}⚠️  Certbot is not installed${NC}"
fi

echo ""
echo "Step 6: Checking firewall..."
echo "-----------------------------"

# Check UFW status
if command -v ufw &> /dev/null; then
    UFW_STATUS=$($SUDO ufw status 2>&1)
    if echo "$UFW_STATUS" | grep -q "Status: active"; then
        echo -e "${YELLOW}⚠️  UFW firewall is active${NC}"
        echo "$UFW_STATUS"
        echo ""
        echo "Ensure these ports are allowed:"
        echo "  - 22 (SSH)"
        echo "  - 80 (HTTP)"
        echo "  - 443 (HTTPS)"
        echo "  - 3000 (Node.js)"
    else
        echo -e "${GREEN}✅ UFW firewall is inactive${NC}"
    fi
fi

echo ""
echo "Step 7: Quick fixes..."
echo "----------------------"

# Restart PM2 app
echo "Restarting application..."
pm2 restart genvedha-website 2>&1 || pm2 start server.js --name genvedha-website

# Save PM2 configuration
pm2 save

# Setup PM2 startup
echo "Setting up PM2 auto-startup..."
pm2 startup 2>&1 | grep -v "sudo" | bash || true

echo ""
echo "Step 8: Final verification..."
echo "------------------------------"

sleep 3

# Test localhost again
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Application is responding (HTTP $HTTP_CODE)${NC}"
else
    echo -e "${RED}❌ Application returned HTTP $HTTP_CODE${NC}"
fi

# Show PM2 status
echo ""
echo "Current PM2 Status:"
pm2 status

echo ""
echo "Recent logs:"
pm2 logs genvedha-website --lines 20 --nostream

echo ""
echo "=================================="
echo "🎯 Summary"
echo "=================================="
echo ""
echo "Test URLs:"
echo "  - Direct IP: http://$(curl -s ifconfig.me):3000"
echo "  - With Nginx: http://$(curl -s ifconfig.me)"
echo "  - Domain: https://genvedha.com"
echo ""
echo "Next steps:"
echo "1. Test direct IP access: http://$(curl -s ifconfig.me):3000"
echo "2. If that works, the issue is with Nginx/SSL"
echo "3. If not, check PM2 logs: pm2 logs genvedha-website"
echo ""
echo "To view live logs: pm2 logs genvedha-website"
echo "To restart app: pm2 restart genvedha-website"
echo ""
