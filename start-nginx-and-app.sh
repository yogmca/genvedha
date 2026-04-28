#!/bin/bash

# Start Nginx and Application
# Run this before attempting SSL setup

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Starting Nginx and Application${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run with sudo${NC}"
    exit 1
fi

# 1. Start Nginx
echo -e "${YELLOW}1. Starting Nginx...${NC}"
systemctl start nginx
systemctl enable nginx

if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✓ Nginx is running${NC}"
else
    echo -e "${RED}✗ Nginx failed to start${NC}"
    echo "Checking Nginx configuration..."
    nginx -t
    exit 1
fi

# 2. Check port 80
echo ""
echo -e "${YELLOW}2. Checking port 80...${NC}"
if netstat -tlnp | grep -q ":80 "; then
    echo -e "${GREEN}✓ Port 80 is listening${NC}"
    netstat -tlnp | grep ":80 "
else
    echo -e "${RED}✗ Port 80 is not listening${NC}"
    exit 1
fi

# 3. Start Node.js application
echo ""
echo -e "${YELLOW}3. Starting Node.js application...${NC}"

# Find the project directory
if [ -d "/home/ubuntu/genvedha-website" ]; then
    PROJECT_DIR="/home/ubuntu/genvedha-website"
elif [ -d "/home/ec2-user/genvedha-website" ]; then
    PROJECT_DIR="/home/ec2-user/genvedha-website"
else
    PROJECT_DIR="$PWD"
fi

cd "$PROJECT_DIR"

# Start with PM2 if available
if command -v pm2 &> /dev/null; then
    # Stop any existing instance
    pm2 stop genvedha 2>/dev/null || true
    pm2 delete genvedha 2>/dev/null || true
    
    # Start fresh
    pm2 start server.js --name genvedha
    pm2 save
    
    echo -e "${GREEN}✓ Application started with PM2${NC}"
    pm2 status
else
    echo -e "${YELLOW}⚠ PM2 not found. Install with: npm install -g pm2${NC}"
    echo "Starting application in background..."
    nohup node server.js > /tmp/genvedha.log 2>&1 &
    echo -e "${GREEN}✓ Application started (PID: $!)${NC}"
fi

# 4. Check application port
echo ""
echo -e "${YELLOW}4. Checking application port 3000...${NC}"
sleep 2
if netstat -tlnp | grep -q ":3000 "; then
    echo -e "${GREEN}✓ Application is listening on port 3000${NC}"
    netstat -tlnp | grep ":3000 "
else
    echo -e "${YELLOW}⚠ Application may not be running on port 3000${NC}"
fi

# 5. Test local connectivity
echo ""
echo -e "${YELLOW}5. Testing local connectivity...${NC}"

# Test Nginx
if curl -s -o /dev/null -w "%{http_code}" http://localhost | grep -q "200\|502\|404"; then
    echo -e "${GREEN}✓ Nginx is responding${NC}"
else
    echo -e "${YELLOW}⚠ Nginx may not be responding correctly${NC}"
fi

# Test application
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200\|404"; then
    echo -e "${GREEN}✓ Application is responding${NC}"
else
    echo -e "${YELLOW}⚠ Application may not be responding${NC}"
fi

# 6. Check DNS
echo ""
echo -e "${YELLOW}6. Checking DNS configuration...${NC}"
SERVER_IP=$(curl -s ifconfig.me || curl -s icanhazip.com)
DNS_IP=$(dig +short genvedha.com | tail -1)

echo "Server IP: $SERVER_IP"
echo "DNS points to: $DNS_IP"

if [ "$SERVER_IP" = "$DNS_IP" ]; then
    echo -e "${GREEN}✓ DNS correctly points to this server${NC}"
else
    echo -e "${RED}✗ DNS MISMATCH!${NC}"
    echo -e "${RED}   Update DNS in GoDaddy to point to: $SERVER_IP${NC}"
    echo -e "${YELLOW}   See: CRITICAL-DNS-FIX.md${NC}"
fi

# Summary
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Status Summary${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

NGINX_STATUS=$(systemctl is-active nginx)
if [ "$NGINX_STATUS" = "active" ]; then
    echo -e "Nginx: ${GREEN}✓ Running${NC}"
else
    echo -e "Nginx: ${RED}✗ Not running${NC}"
fi

if netstat -tlnp | grep -q ":3000 "; then
    echo -e "Application: ${GREEN}✓ Running${NC}"
else
    echo -e "Application: ${YELLOW}⚠ Not detected${NC}"
fi

if [ "$SERVER_IP" = "$DNS_IP" ]; then
    echo -e "DNS: ${GREEN}✓ Correct${NC}"
else
    echo -e "DNS: ${RED}✗ Needs update${NC}"
fi

echo ""
echo -e "${YELLOW}Next Steps:${NC}"
if [ "$SERVER_IP" != "$DNS_IP" ]; then
    echo "1. Update DNS in GoDaddy to point to: $SERVER_IP"
    echo "2. Wait 10 minutes for DNS propagation"
    echo "3. Verify: dig genvedha.com +short"
    echo "4. Then run: sudo ./fix-ssl-aggressive.sh"
else
    echo "1. Run: sudo ./fix-ssl-aggressive.sh"
fi
