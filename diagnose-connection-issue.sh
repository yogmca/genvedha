#!/bin/bash

# Diagnose Connection Refused Issue
# This script checks all common issues preventing SSL certificate validation

echo "=========================================="
echo "SSL Connection Issue Diagnostic"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}[1/8] Checking Server IP...${NC}"
SERVER_IP=$(curl -s ifconfig.me)
echo "Your server IP: $SERVER_IP"
echo ""

echo -e "${BLUE}[2/8] Checking DNS Resolution...${NC}"
DOMAIN_IP=$(dig +short genvedha.com | tail -n1)
WWW_IP=$(dig +short www.genvedha.com | tail -n1)

echo "genvedha.com resolves to: $DOMAIN_IP"
echo "www.genvedha.com resolves to: $WWW_IP"

if [ "$DOMAIN_IP" == "$SERVER_IP" ]; then
    echo -e "${GREEN}✓ genvedha.com points to this server${NC}"
else
    echo -e "${RED}✗ genvedha.com does NOT point to this server!${NC}"
    echo -e "${YELLOW}  Fix: Update A record in GoDaddy to $SERVER_IP${NC}"
fi

if [ "$WWW_IP" == "$SERVER_IP" ]; then
    echo -e "${GREEN}✓ www.genvedha.com points to this server${NC}"
else
    echo -e "${RED}✗ www.genvedha.com does NOT point to this server!${NC}"
    echo -e "${YELLOW}  Fix: Update A record in GoDaddy to $SERVER_IP${NC}"
fi
echo ""

echo -e "${BLUE}[3/8] Checking Port 80 (HTTP)...${NC}"
PORT_80=$(sudo lsof -i:80 2>/dev/null || echo "")
if [ -z "$PORT_80" ]; then
    echo -e "${YELLOW}⚠ Port 80 is FREE (nothing listening)${NC}"
    echo "  This is OK for standalone method, but webroot won't work"
else
    echo -e "${GREEN}✓ Port 80 is in use:${NC}"
    sudo lsof -i:80
fi
echo ""

echo -e "${BLUE}[4/8] Checking Port 443 (HTTPS)...${NC}"
PORT_443=$(sudo lsof -i:443 2>/dev/null || echo "")
if [ -z "$PORT_443" ]; then
    echo -e "${YELLOW}⚠ Port 443 is FREE (nothing listening)${NC}"
else
    echo -e "${GREEN}✓ Port 443 is in use:${NC}"
    sudo lsof -i:443
fi
echo ""

echo -e "${BLUE}[5/8] Checking Firewall (UFW)...${NC}"
if command -v ufw &> /dev/null; then
    UFW_STATUS=$(sudo ufw status | head -n1)
    echo "$UFW_STATUS"
    
    if [[ "$UFW_STATUS" == *"active"* ]]; then
        echo ""
        sudo ufw status | grep -E "(80|443)"
        
        if sudo ufw status | grep -q "80.*ALLOW"; then
            echo -e "${GREEN}✓ Port 80 is allowed${NC}"
        else
            echo -e "${RED}✗ Port 80 is NOT allowed${NC}"
            echo -e "${YELLOW}  Fix: sudo ufw allow 80/tcp${NC}"
        fi
        
        if sudo ufw status | grep -q "443.*ALLOW"; then
            echo -e "${GREEN}✓ Port 443 is allowed${NC}"
        else
            echo -e "${RED}✗ Port 443 is NOT allowed${NC}"
            echo -e "${YELLOW}  Fix: sudo ufw allow 443/tcp${NC}"
        fi
    else
        echo -e "${GREEN}✓ Firewall is inactive${NC}"
    fi
else
    echo "UFW not installed"
fi
echo ""

echo -e "${BLUE}[6/8] Checking Nginx Status...${NC}"
if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✓ Nginx is running${NC}"
    
    # Check if nginx is configured for SSL
    if [ -f "/etc/nginx/sites-enabled/genvedha" ]; then
        echo -e "${GREEN}✓ Genvedha site is enabled${NC}"
    else
        echo -e "${YELLOW}⚠ Genvedha site not found in sites-enabled${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Nginx is NOT running${NC}"
fi
echo ""

echo -e "${BLUE}[7/8] Checking Existing Certificates...${NC}"
if [ -d "/etc/letsencrypt/live/genvedha.com" ]; then
    echo -e "${GREEN}✓ Certificate exists${NC}"
    sudo certbot certificates 2>/dev/null | grep -A5 "genvedha.com" || echo "Could not read certificate details"
else
    echo -e "${YELLOW}⚠ No certificate found${NC}"
fi
echo ""

echo -e "${BLUE}[8/8] Testing External Connectivity...${NC}"
echo "Testing if port 80 is reachable from outside..."

# Try to connect to port 80
timeout 5 bash -c "echo > /dev/tcp/$SERVER_IP/80" 2>/dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Port 80 is reachable from this server${NC}"
else
    echo -e "${RED}✗ Port 80 is NOT reachable${NC}"
    echo -e "${YELLOW}  This is the main issue!${NC}"
fi

# Try HTTP request
HTTP_TEST=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 http://$SERVER_IP 2>/dev/null || echo "000")
if [ "$HTTP_TEST" != "000" ]; then
    echo -e "${GREEN}✓ HTTP server responds (code: $HTTP_TEST)${NC}"
else
    echo -e "${RED}✗ HTTP server does not respond${NC}"
fi
echo ""

echo "=========================================="
echo "DIAGNOSIS SUMMARY"
echo "=========================================="
echo ""

# Determine the main issue
ISSUES=0

if [ "$DOMAIN_IP" != "$SERVER_IP" ]; then
    echo -e "${RED}❌ CRITICAL: DNS not pointing to this server${NC}"
    echo "   Action: Update A records in GoDaddy"
    echo "   genvedha.com → $SERVER_IP"
    echo "   www.genvedha.com → $SERVER_IP"
    echo ""
    ISSUES=$((ISSUES + 1))
fi

if [ -z "$PORT_80" ]; then
    echo -e "${YELLOW}⚠️  WARNING: Nothing listening on port 80${NC}"
    echo "   Action: Use standalone method (stops nginx, gets cert, restarts)"
    echo "   Run: sudo ./fix-ssl-standalone-proper.sh"
    echo ""
    ISSUES=$((ISSUES + 1))
fi

if command -v ufw &> /dev/null; then
    if [[ "$(sudo ufw status)" == *"active"* ]] && ! sudo ufw status | grep -q "80.*ALLOW"; then
        echo -e "${RED}❌ CRITICAL: Firewall blocking port 80${NC}"
        echo "   Action: sudo ufw allow 80/tcp"
        echo "   Action: sudo ufw allow 443/tcp"
        echo ""
        ISSUES=$((ISSUES + 1))
    fi
fi

echo -e "${BLUE}AWS Security Group Check:${NC}"
echo "⚠️  Cannot check AWS Security Group from here"
echo "   You MUST verify in AWS Console:"
echo "   1. Go to EC2 → Security Groups"
echo "   2. Find your instance's security group"
echo "   3. Ensure these inbound rules exist:"
echo "      - HTTP (80) from 0.0.0.0/0"
echo "      - HTTPS (443) from 0.0.0.0/0"
echo ""

if [ $ISSUES -eq 0 ]; then
    echo -e "${GREEN}✓ No obvious issues found!${NC}"
    echo ""
    echo "If you're still getting 'Connection refused':"
    echo "1. Check AWS Security Group (most common issue)"
    echo "2. Wait 5-10 minutes for DNS propagation"
    echo "3. Run: sudo ./fix-ssl-standalone-proper.sh"
else
    echo -e "${YELLOW}Found $ISSUES issue(s) that need fixing${NC}"
    echo ""
    echo "Fix the issues above, then run:"
    echo "  sudo ./fix-ssl-standalone-proper.sh"
fi

echo ""
echo "=========================================="
echo ""
