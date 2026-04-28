#!/bin/bash

# EC2 Deployment Testing Script
# This script tests all aspects of your deployed application

echo "🧪 EC2 DEPLOYMENT TESTING SCRIPT"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Function to print test results
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ PASSED${NC}: $2"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAILED${NC}: $2"
        ((FAILED++))
    fi
}

echo -e "${BLUE}📋 System Information${NC}"
echo "-----------------------------------"
echo "Hostname: $(hostname)"
echo "User: $(whoami)"
echo "Date: $(date)"
echo "Uptime: $(uptime -p)"
echo ""

# Test 1: Check if Node.js is installed
echo -e "${BLUE}1️⃣  Testing Node.js Installation${NC}"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "Node.js version: $NODE_VERSION"
    print_result 0 "Node.js is installed"
else
    print_result 1 "Node.js is not installed"
fi
echo ""

# Test 2: Check if npm is installed
echo -e "${BLUE}2️⃣  Testing npm Installation${NC}"
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo "npm version: $NPM_VERSION"
    print_result 0 "npm is installed"
else
    print_result 1 "npm is not installed"
fi
echo ""

# Test 3: Check if PM2 is installed
echo -e "${BLUE}3️⃣  Testing PM2 Installation${NC}"
if command -v pm2 &> /dev/null; then
    PM2_VERSION=$(pm2 --version)
    echo "PM2 version: $PM2_VERSION"
    print_result 0 "PM2 is installed"
else
    print_result 1 "PM2 is not installed"
fi
echo ""

# Test 4: Check PM2 process status
echo -e "${BLUE}4️⃣  Testing PM2 Application Status${NC}"
if command -v pm2 &> /dev/null; then
    PM2_LIST=$(pm2 list)
    echo "$PM2_LIST"
    
    if pm2 list | grep -q "online"; then
        print_result 0 "PM2 application is running"
        
        # Get app details
        APP_NAME=$(pm2 jlist | jq -r '.[0].name' 2>/dev/null || echo "genvedha")
        echo "Application name: $APP_NAME"
    else
        print_result 1 "PM2 application is not running"
    fi
else
    print_result 1 "Cannot check PM2 status - PM2 not installed"
fi
echo ""

# Test 5: Check if port 3000 is listening
echo -e "${BLUE}5️⃣  Testing Port 3000 Availability${NC}"
if netstat -tuln 2>/dev/null | grep -q ":3000 " || ss -tuln 2>/dev/null | grep -q ":3000 "; then
    print_result 0 "Port 3000 is listening"
    echo "Port details:"
    netstat -tuln 2>/dev/null | grep ":3000 " || ss -tuln 2>/dev/null | grep ":3000 "
else
    print_result 1 "Port 3000 is not listening"
fi
echo ""

# Test 6: Check if Nginx is installed and running
echo -e "${BLUE}6️⃣  Testing Nginx Status${NC}"
if command -v nginx &> /dev/null; then
    NGINX_VERSION=$(nginx -v 2>&1)
    echo "$NGINX_VERSION"
    
    if systemctl is-active --quiet nginx 2>/dev/null || service nginx status 2>/dev/null | grep -q "running"; then
        print_result 0 "Nginx is running"
    else
        print_result 1 "Nginx is installed but not running"
    fi
else
    print_result 1 "Nginx is not installed"
fi
echo ""

# Test 7: Check if port 80 is listening
echo -e "${BLUE}7️⃣  Testing Port 80 (HTTP)${NC}"
if netstat -tuln 2>/dev/null | grep -q ":80 " || ss -tuln 2>/dev/null | grep -q ":80 "; then
    print_result 0 "Port 80 is listening"
else
    print_result 1 "Port 80 is not listening"
fi
echo ""

# Test 8: Check if port 443 is listening
echo -e "${BLUE}8️⃣  Testing Port 443 (HTTPS)${NC}"
if netstat -tuln 2>/dev/null | grep -q ":443 " || ss -tuln 2>/dev/null | grep -q ":443 "; then
    print_result 0 "Port 443 is listening"
else
    echo -e "${YELLOW}⚠️  WARNING${NC}: Port 443 is not listening (SSL not configured)"
fi
echo ""

# Test 9: Test localhost connection
echo -e "${BLUE}9️⃣  Testing Localhost HTTP Connection${NC}"
HTTP_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null)
if [ "$HTTP_RESPONSE" = "200" ] || [ "$HTTP_RESPONSE" = "304" ]; then
    print_result 0 "Application responds on localhost:3000 (HTTP $HTTP_RESPONSE)"
else
    print_result 1 "Application not responding on localhost:3000 (HTTP $HTTP_RESPONSE)"
fi
echo ""

# Test 10: Test public IP connection
echo -e "${BLUE}🔟 Testing Public IP Connection${NC}"
PUBLIC_IP=$(curl -s http://checkip.amazonaws.com 2>/dev/null || curl -s http://ifconfig.me 2>/dev/null)
if [ -n "$PUBLIC_IP" ]; then
    echo "Public IP: $PUBLIC_IP"
    
    HTTP_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://$PUBLIC_IP 2>/dev/null)
    if [ "$HTTP_RESPONSE" = "200" ] || [ "$HTTP_RESPONSE" = "304" ]; then
        print_result 0 "Application accessible via public IP (HTTP $HTTP_RESPONSE)"
    else
        print_result 1 "Application not accessible via public IP (HTTP $HTTP_RESPONSE)"
    fi
else
    print_result 1 "Could not determine public IP"
fi
echo ""

# Test 11: Check SSL certificates
echo -e "${BLUE}1️⃣1️⃣  Testing SSL Certificates${NC}"
if [ -d "/etc/letsencrypt/live" ]; then
    CERT_DIRS=$(ls -1 /etc/letsencrypt/live 2>/dev/null | grep -v README)
    if [ -n "$CERT_DIRS" ]; then
        echo "SSL certificates found for:"
        echo "$CERT_DIRS"
        print_result 0 "SSL certificates are present"
        
        # Check certificate expiry
        for domain in $CERT_DIRS; do
            CERT_FILE="/etc/letsencrypt/live/$domain/cert.pem"
            if [ -f "$CERT_FILE" ]; then
                EXPIRY=$(openssl x509 -enddate -noout -in "$CERT_FILE" 2>/dev/null | cut -d= -f2)
                echo "  $domain expires: $EXPIRY"
            fi
        done
    else
        print_result 1 "No SSL certificates found"
    fi
else
    print_result 1 "Let's Encrypt directory not found"
fi
echo ""

# Test 12: Check environment file
echo -e "${BLUE}1️⃣2️⃣  Testing Environment Configuration${NC}"
if [ -f ".env" ]; then
    print_result 0 ".env file exists"
    echo "Environment variables configured:"
    grep -v "PASSWORD\|SECRET\|KEY" .env 2>/dev/null | grep "=" | cut -d= -f1 | sed 's/^/  - /'
else
    print_result 1 ".env file not found"
fi
echo ""

# Test 13: Check MongoDB connection
echo -e "${BLUE}1️⃣3️⃣  Testing MongoDB Connection${NC}"
if command -v pm2 &> /dev/null; then
    LOGS=$(pm2 logs --nostream --lines 50 2>/dev/null)
    if echo "$LOGS" | grep -q "Connected to MongoDB"; then
        print_result 0 "MongoDB connection successful"
    else
        print_result 1 "MongoDB connection not confirmed in logs"
    fi
else
    echo -e "${YELLOW}⚠️  SKIPPED${NC}: Cannot check logs without PM2"
fi
echo ""

# Test 14: Check disk space
echo -e "${BLUE}1️⃣4️⃣  Testing Disk Space${NC}"
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
echo "Disk usage: ${DISK_USAGE}%"
if [ "$DISK_USAGE" -lt 80 ]; then
    print_result 0 "Sufficient disk space available"
else
    print_result 1 "Disk space is running low (${DISK_USAGE}% used)"
fi
echo ""

# Test 15: Check memory usage
echo -e "${BLUE}1️⃣5️⃣  Testing Memory Usage${NC}"
if command -v free &> /dev/null; then
    MEMORY_INFO=$(free -h)
    echo "$MEMORY_INFO"
    
    MEMORY_USAGE=$(free | awk 'NR==2 {printf "%.0f", $3/$2 * 100}')
    if [ "$MEMORY_USAGE" -lt 90 ]; then
        print_result 0 "Memory usage is acceptable (${MEMORY_USAGE}%)"
    else
        print_result 1 "Memory usage is high (${MEMORY_USAGE}%)"
    fi
else
    echo -e "${YELLOW}⚠️  SKIPPED${NC}: Cannot check memory usage"
fi
echo ""

# Test 16: Check AWS Security Group (if applicable)
echo -e "${BLUE}1️⃣6️⃣  Testing Network Connectivity${NC}"
echo "Testing external connectivity..."

# Test if we can reach common services
if curl -s --connect-timeout 5 https://www.google.com > /dev/null; then
    print_result 0 "Outbound internet connectivity working"
else
    print_result 1 "Outbound internet connectivity issues"
fi
echo ""

# Test 17: Check application logs for errors
echo -e "${BLUE}1️⃣7️⃣  Testing Application Logs${NC}"
if command -v pm2 &> /dev/null; then
    ERROR_COUNT=$(pm2 logs --nostream --lines 100 --err 2>/dev/null | grep -i "error" | wc -l)
    echo "Recent error count: $ERROR_COUNT"
    
    if [ "$ERROR_COUNT" -eq 0 ]; then
        print_result 0 "No recent errors in application logs"
    else
        print_result 1 "Found $ERROR_COUNT errors in recent logs"
        echo "Recent errors:"
        pm2 logs --nostream --lines 20 --err 2>/dev/null | grep -i "error" | tail -5
    fi
else
    echo -e "${YELLOW}⚠️  SKIPPED${NC}: Cannot check logs without PM2"
fi
echo ""

# Test 18: Check if application files exist
echo -e "${BLUE}1️⃣8️⃣  Testing Application Files${NC}"
REQUIRED_FILES=("server.js" "package.json" ".env")
ALL_FILES_EXIST=true

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $file exists"
    else
        echo -e "${RED}✗${NC} $file missing"
        ALL_FILES_EXIST=false
    fi
done

if [ "$ALL_FILES_EXIST" = true ]; then
    print_result 0 "All required application files present"
else
    print_result 1 "Some required application files are missing"
fi
echo ""

# Test 19: Test domain resolution (if domain is configured)
echo -e "${BLUE}1️⃣9️⃣  Testing Domain Configuration${NC}"
if [ -f ".env" ]; then
    DOMAIN=$(grep "DOMAIN=" .env 2>/dev/null | cut -d= -f2 | tr -d '"' | tr -d "'")
    if [ -n "$DOMAIN" ] && [ "$DOMAIN" != "your-domain.com" ]; then
        echo "Configured domain: $DOMAIN"
        
        # Test DNS resolution
        if nslookup "$DOMAIN" > /dev/null 2>&1 || dig "$DOMAIN" > /dev/null 2>&1; then
            print_result 0 "Domain DNS resolution working"
            
            # Test HTTP connection to domain
            HTTP_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://$DOMAIN 2>/dev/null)
            if [ "$HTTP_RESPONSE" = "200" ] || [ "$HTTP_RESPONSE" = "304" ]; then
                print_result 0 "Domain accessible via HTTP (HTTP $HTTP_RESPONSE)"
            else
                print_result 1 "Domain not accessible via HTTP (HTTP $HTTP_RESPONSE)"
            fi
        else
            print_result 1 "Domain DNS resolution failed"
        fi
    else
        echo -e "${YELLOW}⚠️  SKIPPED${NC}: No domain configured"
    fi
else
    echo -e "${YELLOW}⚠️  SKIPPED${NC}: Cannot check domain without .env file"
fi
echo ""

# Test 20: Check PM2 startup configuration
echo -e "${BLUE}2️⃣0️⃣  Testing PM2 Startup Configuration${NC}"
if command -v pm2 &> /dev/null; then
    if pm2 startup 2>&1 | grep -q "already"; then
        print_result 0 "PM2 startup is configured"
    else
        print_result 1 "PM2 startup may not be configured"
    fi
else
    echo -e "${YELLOW}⚠️  SKIPPED${NC}: Cannot check PM2 startup without PM2"
fi
echo ""

# Summary
echo "=================================="
echo -e "${BLUE}📊 TEST SUMMARY${NC}"
echo "=================================="
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
TOTAL=$((PASSED + FAILED))
echo "Total: $TOTAL"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED!${NC}"
    echo "Your EC2 deployment is working correctly!"
    exit 0
elif [ $FAILED -le 3 ]; then
    echo -e "${YELLOW}⚠️  MOSTLY WORKING${NC}"
    echo "Your deployment is mostly functional but has some issues."
    exit 1
else
    echo -e "${RED}❌ DEPLOYMENT HAS ISSUES${NC}"
    echo "Please review the failed tests above and fix the issues."
    exit 2
fi
