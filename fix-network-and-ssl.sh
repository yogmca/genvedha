#!/bin/bash

# Complete Network Fix and SSL Setup
# This script diagnoses and fixes network blocking, then sets up SSL

set -e

echo "=========================================="
echo "Complete Network Fix and SSL Setup"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root: sudo ./fix-network-and-ssl.sh${NC}"
    exit 1
fi

echo -e "${BLUE}=========================================="
echo "Phase 1: Network Diagnostics"
echo "==========================================${NC}"
echo ""

# Get server IP
SERVER_IP=$(curl -s ifconfig.me)
echo -e "${GREEN}Server IP: $SERVER_IP${NC}"

# Check DNS
echo ""
echo -e "${YELLOW}Checking DNS resolution...${NC}"
DOMAIN_IP=$(dig +short genvedha.com | tail -n1)
WWW_IP=$(dig +short www.genvedha.com | tail -n1)

echo "genvedha.com → $DOMAIN_IP"
echo "www.genvedha.com → $WWW_IP"

if [ "$DOMAIN_IP" != "$SERVER_IP" ]; then
    echo -e "${RED}✗ DNS mismatch for genvedha.com${NC}"
    echo -e "${YELLOW}Update your DNS A record to: $SERVER_IP${NC}"
    DNS_OK=false
else
    echo -e "${GREEN}✓ DNS correct for genvedha.com${NC}"
    DNS_OK=true
fi

# Check what's listening on port 80
echo ""
echo -e "${YELLOW}Checking port 80...${NC}"
if lsof -i:80 &>/dev/null; then
    echo -e "${YELLOW}Port 80 is in use by:${NC}"
    lsof -i:80
    PORT_80_BUSY=true
else
    echo -e "${GREEN}✓ Port 80 is free${NC}"
    PORT_80_BUSY=false
fi

# Check firewall
echo ""
echo -e "${YELLOW}Checking firewall (UFW)...${NC}"
if command -v ufw &> /dev/null; then
    UFW_STATUS=$(ufw status | grep -i "Status:" | awk '{print $2}')
    echo "UFW Status: $UFW_STATUS"
    
    if [ "$UFW_STATUS" = "active" ]; then
        echo ""
        echo "UFW Rules:"
        ufw status numbered
        
        # Check if port 80 is allowed
        if ufw status | grep -q "80.*ALLOW"; then
            echo -e "${GREEN}✓ Port 80 is allowed in UFW${NC}"
        else
            echo -e "${RED}✗ Port 80 is NOT allowed in UFW${NC}"
            echo -e "${YELLOW}Adding port 80 to UFW...${NC}"
            ufw allow 80/tcp
            ufw allow 443/tcp
            echo -e "${GREEN}✓ Ports 80 and 443 added to UFW${NC}"
        fi
    fi
else
    echo "UFW not installed"
fi

# Check iptables
echo ""
echo -e "${YELLOW}Checking iptables...${NC}"
IPTABLES_RULES=$(iptables -L -n | grep -E "DROP|REJECT" | wc -l)
if [ $IPTABLES_RULES -gt 0 ]; then
    echo -e "${YELLOW}Found $IPTABLES_RULES DROP/REJECT rules in iptables${NC}"
    echo "Current iptables rules:"
    iptables -L -n -v
else
    echo -e "${GREEN}✓ No blocking rules in iptables${NC}"
fi

# Check for Apache2
echo ""
echo -e "${YELLOW}Checking for Apache2...${NC}"
if systemctl is-active --quiet apache2 2>/dev/null; then
    echo -e "${RED}✗ Apache2 is running and may interfere${NC}"
    echo -e "${YELLOW}Stopping and disabling Apache2...${NC}"
    systemctl stop apache2
    systemctl disable apache2
    echo -e "${GREEN}✓ Apache2 stopped${NC}"
elif dpkg -l | grep -q apache2; then
    echo -e "${YELLOW}Apache2 is installed but not running${NC}"
    echo -e "${YELLOW}Removing Apache2 completely...${NC}"
    apt-get remove --purge apache2 apache2-utils -y
    apt-get autoremove -y
    echo -e "${GREEN}✓ Apache2 removed${NC}"
else
    echo -e "${GREEN}✓ Apache2 not installed${NC}"
fi

# Test external connectivity
echo ""
echo -e "${YELLOW}Testing external connectivity...${NC}"
echo "Testing if port 80 is accessible from outside..."
echo ""
echo -e "${BLUE}Please test from your local machine:${NC}"
echo "  curl -I http://genvedha.com"
echo ""
echo "Expected responses:"
echo "  - 200 OK (good)"
echo "  - 301/302 Redirect (good)"
echo "  - 404 Not Found (good - port is open)"
echo "  - 502 Bad Gateway (good - port is open)"
echo "  - 403 Forbidden (BAD - network blocking)"
echo "  - Connection refused (BAD - port blocked)"
echo ""

# AWS Security Group check
echo -e "${BLUE}=========================================="
echo "AWS Security Group Check"
echo "==========================================${NC}"
echo ""
echo "To check your AWS Security Group:"
echo ""
echo "1. Go to AWS Console → EC2 → Instances"
echo "2. Select your instance"
echo "3. Click 'Security' tab"
echo "4. Click on the Security Group name"
echo "5. Check 'Inbound rules'"
echo ""
echo "Required rules:"
echo "  Type: HTTP,  Protocol: TCP, Port: 80,  Source: 0.0.0.0/0"
echo "  Type: HTTPS, Protocol: TCP, Port: 443, Source: 0.0.0.0/0"
echo ""
echo -e "${YELLOW}CRITICAL: Source must be 0.0.0.0/0 (not your IP!)${NC}"
echo ""

read -p "Have you verified AWS Security Group allows port 80 from 0.0.0.0/0? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo -e "${YELLOW}Please fix AWS Security Group first, then run this script again.${NC}"
    echo ""
    echo "Or use DNS validation instead:"
    echo "  sudo ./fix-ssl-dns-validation-simple.sh"
    echo ""
    exit 1
fi

echo ""
echo -e "${BLUE}=========================================="
echo "Phase 2: SSL Certificate Setup"
echo "==========================================${NC}"
echo ""

# Get email
read -p "Enter your email for SSL certificate: " EMAIL

if [ -z "$EMAIL" ]; then
    echo -e "${RED}Email is required${NC}"
    exit 1
fi

# Stop all web servers
echo ""
echo -e "${YELLOW}Stopping all web servers...${NC}"
systemctl stop nginx 2>/dev/null || true
systemctl stop apache2 2>/dev/null || true
killall nginx apache2 httpd 2>/dev/null || true
sleep 3

# Kill anything on port 80
if lsof -i:80 &>/dev/null; then
    echo -e "${YELLOW}Force killing processes on port 80...${NC}"
    PORT_80_PIDS=$(lsof -ti:80)
    if [ ! -z "$PORT_80_PIDS" ]; then
        kill -9 $PORT_80_PIDS
        sleep 2
    fi
fi

# Verify port 80 is free
if lsof -i:80 &>/dev/null; then
    echo -e "${RED}✗ Cannot free port 80!${NC}"
    echo "Processes still using port 80:"
    lsof -i:80
    echo ""
    echo -e "${YELLOW}Use DNS validation instead:${NC}"
    echo "  sudo ./fix-ssl-dns-validation-simple.sh"
    exit 1
fi

echo -e "${GREEN}✓ Port 80 is free${NC}"

# Remove old certificates
echo ""
echo -e "${YELLOW}Removing old certificates...${NC}"
certbot delete --cert-name genvedha.com --non-interactive 2>/dev/null || true

# Get certificate
echo ""
echo -e "${YELLOW}Requesting SSL certificate (standalone mode)...${NC}"
echo "This will take 1-2 minutes..."
echo ""

certbot certonly \
    --standalone \
    --preferred-challenges http \
    -d genvedha.com \
    -d www.genvedha.com \
    --email "$EMAIL" \
    --agree-tos \
    --non-interactive \
    --force-renewal

if [ $? -ne 0 ]; then
    echo ""
    echo -e "${RED}✗ Certificate request failed!${NC}"
    echo ""
    echo -e "${YELLOW}The network is still blocking Let's Encrypt.${NC}"
    echo ""
    echo "Options:"
    echo "1. Use DNS validation instead (recommended):"
    echo "   sudo ./fix-ssl-dns-validation-simple.sh"
    echo ""
    echo "2. Check AWS Security Group again"
    echo "3. Check AWS Network ACL"
    echo "4. Check if CloudFlare/CDN is blocking"
    echo ""
    echo "See ULTIMATE-SSL-FIX.md for detailed troubleshooting."
    exit 1
fi

echo ""
echo -e "${GREEN}✓✓✓ Certificate obtained successfully! ✓✓✓${NC}"

# Create webroot
echo ""
echo -e "${YELLOW}Creating webroot directory...${NC}"
mkdir -p /var/www/html/.well-known/acme-challenge
chown -R www-data:www-data /var/www/html
chmod -R 755 /var/www/html
echo -e "${GREEN}✓ Webroot created${NC}"

# Configure Nginx
echo ""
echo -e "${YELLOW}Configuring Nginx...${NC}"

cat > /etc/nginx/sites-available/genvedha << 'NGINXCONF'
# HTTP - Redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name genvedha.com www.genvedha.com;
    
    # Allow Certbot renewals
    location /.well-known/acme-challenge/ {
        root /var/www/html;
        allow all;
    }
    
    # Redirect to HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS - Main site
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name genvedha.com www.genvedha.com;

    # SSL Certificates
    ssl_certificate /etc/letsencrypt/live/genvedha.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/genvedha.com/privkey.pem;
    
    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Root directory
    root /var/www/html;
    index index.html;

    # Logging
    access_log /var/log/nginx/genvedha-access.log;
    error_log /var/log/nginx/genvedha-error.log;

    # Main location
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static files caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
NGINXCONF

ln -sf /etc/nginx/sites-available/genvedha /etc/nginx/sites-enabled/genvedha
rm -f /etc/nginx/sites-enabled/default

echo ""
echo -e "${YELLOW}Testing Nginx configuration...${NC}"
nginx -t

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Nginx configuration error!${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Nginx configuration is valid${NC}"

echo ""
echo -e "${YELLOW}Starting Nginx...${NC}"
systemctl start nginx
systemctl enable nginx
sleep 2

if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✓ Nginx is running${NC}"
else
    echo -e "${RED}✗ Nginx failed to start${NC}"
    systemctl status nginx
    exit 1
fi

echo ""
echo -e "${YELLOW}Testing auto-renewal...${NC}"
certbot renew --dry-run

echo ""
echo -e "${GREEN}=========================================="
echo "✓✓✓ COMPLETE SUCCESS! ✓✓✓"
echo "==========================================${NC}"
echo ""
echo "🎉 Your website is now secured with HTTPS!"
echo ""
echo "🌐 Visit your site:"
echo "   https://genvedha.com"
echo "   https://www.genvedha.com"
echo ""
echo "📜 Certificate details:"
certbot certificates
echo ""
echo "🔄 Auto-renewal: Enabled (runs twice daily)"
echo ""
echo "📊 Test your SSL:"
echo "   https://www.ssllabs.com/ssltest/analyze.html?d=genvedha.com"
echo ""
echo "🛠️  Useful commands:"
echo "   sudo certbot certificates       # View certificates"
echo "   sudo certbot renew             # Manual renewal"
echo "   sudo systemctl status nginx    # Check Nginx"
echo "   curl -I https://genvedha.com   # Test HTTPS"
echo ""
