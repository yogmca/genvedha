#!/bin/bash

# SSL Issue Diagnostic Script
# This script will identify why Let's Encrypt cannot reach your server

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}SSL Certificate Issue Diagnostics${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Get domain
DOMAIN="${1:-genvedha.com}"
echo -e "${GREEN}Testing domain: $DOMAIN${NC}"
echo ""

# 1. Check DNS Resolution
echo -e "${YELLOW}1. DNS Resolution Check${NC}"
echo "-----------------------------------"
DNS_IP=$(dig +short $DOMAIN | tail -1)
WWW_DNS_IP=$(dig +short www.$DOMAIN | tail -1)
echo "genvedha.com resolves to: $DNS_IP"
echo "www.genvedha.com resolves to: $WWW_DNS_IP"

# Get server's public IP
SERVER_IP=$(curl -s ifconfig.me || curl -s icanhazip.com || curl -s ipecho.net/plain)
echo "This server's public IP: $SERVER_IP"

if [ "$DNS_IP" != "$SERVER_IP" ]; then
    echo -e "${RED}❌ DNS MISMATCH! Domain does not point to this server${NC}"
    echo -e "${RED}   Fix: Update DNS in GoDaddy to point to $SERVER_IP${NC}"
else
    echo -e "${GREEN}✓ DNS correctly points to this server${NC}"
fi
echo ""

# 2. Check if port 80 is listening
echo -e "${YELLOW}2. Port 80 Listening Check${NC}"
echo "-----------------------------------"
if netstat -tuln | grep -q ":80 "; then
    echo -e "${GREEN}✓ Something is listening on port 80${NC}"
    netstat -tuln | grep ":80 "
else
    echo -e "${RED}❌ Nothing is listening on port 80${NC}"
fi
echo ""

# 3. Check what's using port 80
echo -e "${YELLOW}3. Process Using Port 80${NC}"
echo "-----------------------------------"
if lsof -i :80 >/dev/null 2>&1; then
    lsof -i :80
else
    echo "No process found using port 80"
fi
echo ""

# 4. Check firewall rules
echo -e "${YELLOW}4. Firewall Check${NC}"
echo "-----------------------------------"
if command -v ufw &> /dev/null; then
    echo "UFW Status:"
    ufw status
elif command -v firewall-cmd &> /dev/null; then
    echo "Firewalld Status:"
    firewall-cmd --list-all
else
    echo "No firewall detected (ufw/firewalld)"
fi
echo ""

# 5. Check iptables
echo -e "${YELLOW}5. IPTables Rules${NC}"
echo "-----------------------------------"
echo "INPUT chain rules for port 80:"
iptables -L INPUT -n -v | grep -E "dpt:80|dpt:http" || echo "No specific rules for port 80"
echo ""

# 6. Test local connectivity
echo -e "${YELLOW}6. Local Connectivity Test${NC}"
echo "-----------------------------------"
echo "Testing local HTTP access..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost/.well-known/acme-challenge/test 2>/dev/null; then
    echo -e "${GREEN}✓ Local HTTP access works${NC}"
else
    echo -e "${YELLOW}⚠ Local HTTP access test (expected to fail if nothing serving)${NC}"
fi
echo ""

# 7. Test external connectivity
echo -e "${YELLOW}7. External Connectivity Test${NC}"
echo "-----------------------------------"
echo "Testing if port 80 is accessible from outside..."
echo "Attempting to connect to http://$DOMAIN from this server..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://$DOMAIN 2>/dev/null || echo "FAILED")
echo "Response code: $RESPONSE"

if [ "$RESPONSE" = "403" ]; then
    echo -e "${RED}❌ Getting 403 Forbidden - Something is blocking access${NC}"
elif [ "$RESPONSE" = "000" ] || [ "$RESPONSE" = "FAILED" ]; then
    echo -e "${RED}❌ Cannot connect - Port 80 may be blocked${NC}"
else
    echo -e "${GREEN}✓ Port 80 is accessible (HTTP $RESPONSE)${NC}"
fi
echo ""

# 8. Check AWS Security Group (if on AWS)
echo -e "${YELLOW}8. AWS Metadata Check${NC}"
echo "-----------------------------------"
if curl -s -m 2 http://169.254.169.254/latest/meta-data/instance-id >/dev/null 2>&1; then
    echo "Running on AWS EC2"
    INSTANCE_ID=$(curl -s http://169.254.169.254/latest/meta-data/instance-id)
    echo "Instance ID: $INSTANCE_ID"
    echo ""
    echo -e "${YELLOW}⚠ IMPORTANT: Check AWS Security Group settings:${NC}"
    echo "   1. Go to AWS Console → EC2 → Instances"
    echo "   2. Select instance: $INSTANCE_ID"
    echo "   3. Click 'Security' tab"
    echo "   4. Check Security Group inbound rules"
    echo "   5. Ensure these rules exist:"
    echo "      - Type: HTTP, Port: 80, Source: 0.0.0.0/0"
    echo "      - Type: HTTPS, Port: 443, Source: 0.0.0.0/0"
else
    echo "Not running on AWS EC2 (or metadata service unavailable)"
fi
echo ""

# 9. Check Nginx configuration
echo -e "${YELLOW}9. Nginx Configuration${NC}"
echo "-----------------------------------"
if command -v nginx &> /dev/null; then
    echo "Nginx is installed"
    if systemctl is-active --quiet nginx; then
        echo -e "${GREEN}✓ Nginx is running${NC}"
    else
        echo -e "${YELLOW}⚠ Nginx is not running${NC}"
    fi
    
    echo ""
    echo "Nginx configuration files:"
    ls -la /etc/nginx/conf.d/*.conf 2>/dev/null || echo "No config files in /etc/nginx/conf.d/"
    ls -la /etc/nginx/sites-enabled/* 2>/dev/null || echo "No config files in /etc/nginx/sites-enabled/"
else
    echo "Nginx is not installed"
fi
echo ""

# 10. Network route check
echo -e "${YELLOW}10. Network Route Check${NC}"
echo "-----------------------------------"
echo "Default gateway:"
ip route | grep default
echo ""
echo "Network interfaces:"
ip addr show | grep -E "inet |^[0-9]:"
echo ""

# 11. Test with netcat
echo -e "${YELLOW}11. Port 80 Accessibility Test${NC}"
echo "-----------------------------------"
echo "Testing if port 80 accepts connections..."
if command -v nc &> /dev/null; then
    timeout 2 nc -zv localhost 80 2>&1 || echo "Port 80 not accepting connections"
else
    echo "netcat not available for testing"
fi
echo ""

# Summary and Recommendations
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}SUMMARY & RECOMMENDATIONS${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check DNS
if [ "$DNS_IP" != "$SERVER_IP" ]; then
    echo -e "${RED}🔴 CRITICAL: DNS Issue${NC}"
    echo "   Your domain does not point to this server"
    echo "   Action: Update DNS A records in GoDaddy:"
    echo "   - genvedha.com → $SERVER_IP"
    echo "   - www.genvedha.com → $SERVER_IP"
    echo ""
fi

# Check if getting 403
if [ "$RESPONSE" = "403" ]; then
    echo -e "${RED}🔴 CRITICAL: 403 Forbidden Error${NC}"
    echo "   Port 80 is accessible but returning 403"
    echo "   Possible causes:"
    echo "   1. AWS Security Group blocking at application level"
    echo "   2. Network ACL rules blocking traffic"
    echo "   3. Reverse proxy or CDN in front of server"
    echo "   4. Application-level blocking (unlikely with standalone mode)"
    echo ""
    echo "   Action: Check AWS Console:"
    echo "   - EC2 → Network & Security → Security Groups"
    echo "   - EC2 → Network & Security → Network ACLs"
    echo "   - Ensure inbound HTTP (80) is allowed from 0.0.0.0/0"
    echo ""
fi

# Check if port not accessible
if [ "$RESPONSE" = "000" ] || [ "$RESPONSE" = "FAILED" ]; then
    echo -e "${RED}🔴 CRITICAL: Port 80 Not Accessible${NC}"
    echo "   Cannot connect to port 80 from outside"
    echo "   Possible causes:"
    echo "   1. AWS Security Group not allowing port 80"
    echo "   2. Network ACL blocking traffic"
    echo "   3. Firewall blocking port 80"
    echo "   4. ISP blocking port 80"
    echo ""
    echo "   Action:"
    echo "   1. Check AWS Security Group (see section 8 above)"
    echo "   2. Check Network ACLs in AWS Console"
    echo "   3. Check firewall: sudo ufw status"
    echo ""
fi

echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Fix any CRITICAL issues listed above"
echo "2. Run this script again to verify: sudo ./diagnose-ssl-issue.sh"
echo "3. Once all checks pass, try SSL setup again"
echo ""
echo -e "${YELLOW}For AWS Security Group fix:${NC}"
echo "aws ec2 describe-security-groups --group-ids <your-sg-id>"
echo "Or use AWS Console → EC2 → Security Groups"
