#!/bin/bash

# Fix 403 Forbidden Error for SSL Certificate
# This script stops all web servers and gets the certificate properly

set -e

echo "=========================================="
echo "Fix 403 Forbidden SSL Error"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root: sudo ./fix-403-ssl-error.sh${NC}"
    exit 1
fi

# Get email
read -p "Enter your email for SSL certificate: " EMAIL

if [ -z "$EMAIL" ]; then
    echo -e "${RED}Email is required${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Step 1: Stopping ALL web servers...${NC}"

# Stop nginx
if systemctl is-active --quiet nginx; then
    echo "Stopping nginx..."
    systemctl stop nginx
fi

# Stop apache2
if systemctl is-active --quiet apache2; then
    echo "Stopping apache2..."
    systemctl stop apache2
    systemctl disable apache2
fi

# Kill any remaining processes
echo "Killing any remaining web server processes..."
killall nginx 2>/dev/null || true
killall apache2 2>/dev/null || true
killall httpd 2>/dev/null || true

# Wait for ports to be released
echo "Waiting for ports to be released..."
sleep 5

echo ""
echo -e "${YELLOW}Step 2: Verifying port 80 is free...${NC}"

# Check if port 80 is free
if lsof -i:80 &>/dev/null; then
    echo -e "${RED}ERROR: Port 80 is still in use!${NC}"
    echo "Processes using port 80:"
    lsof -i:80
    echo ""
    echo "Trying to force kill..."
    PORT_80_PIDS=$(lsof -ti:80)
    if [ ! -z "$PORT_80_PIDS" ]; then
        kill -9 $PORT_80_PIDS
        sleep 3
    fi
    
    # Check again
    if lsof -i:80 &>/dev/null; then
        echo -e "${RED}Still cannot free port 80. Please investigate.${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✓ Port 80 is free${NC}"

echo ""
echo -e "${YELLOW}Step 3: Checking DNS...${NC}"
DOMAIN_IP=$(dig +short genvedha.com | tail -n1)
SERVER_IP=$(curl -s ifconfig.me)
echo "genvedha.com resolves to: $DOMAIN_IP"
echo "This server IP: $SERVER_IP"

if [ "$DOMAIN_IP" != "$SERVER_IP" ]; then
    echo -e "${YELLOW}WARNING: DNS mismatch! Certificate may fail.${NC}"
    echo "Update your DNS A record to point to: $SERVER_IP"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""
echo -e "${YELLOW}Step 4: Removing old certificates...${NC}"
certbot delete --cert-name genvedha.com --non-interactive 2>/dev/null || true

echo ""
echo -e "${YELLOW}Step 5: Getting SSL certificate (standalone mode)...${NC}"
echo "This may take 1-2 minutes..."
echo ""

# Get certificate with standalone
certbot certonly \
    --standalone \
    --preferred-challenges http \
    -d genvedha.com \
    -d www.genvedha.com \
    --email "$EMAIL" \
    --agree-tos \
    --non-interactive \
    --force-renewal \
    --verbose

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Certificate request failed!${NC}"
    echo ""
    echo "Common issues:"
    echo "1. DNS not pointing to this server ($SERVER_IP)"
    echo "2. AWS Security Group blocking port 80"
    echo "3. Firewall blocking connections"
    echo ""
    echo "Check logs:"
    echo "  sudo tail -50 /var/log/letsencrypt/letsencrypt.log"
    exit 1
fi

echo -e "${GREEN}✓ Certificate obtained successfully!${NC}"

echo ""
echo -e "${YELLOW}Step 6: Creating webroot directory...${NC}"
mkdir -p /var/www/html/.well-known/acme-challenge
chown -R www-data:www-data /var/www/html
chmod -R 755 /var/www/html
echo -e "${GREEN}✓ Webroot created${NC}"

echo ""
echo -e "${YELLOW}Step 7: Configuring Nginx...${NC}"

# Create nginx configuration
cat > /etc/nginx/sites-available/genvedha << 'NGINXCONF'
# HTTP - Redirect to HTTPS and serve ACME challenges
server {
    listen 80;
    listen [::]:80;
    server_name genvedha.com www.genvedha.com;
    
    # Allow Certbot renewals
    location /.well-known/acme-challenge/ {
        root /var/www/html;
        allow all;
    }
    
    # Redirect everything else to HTTPS
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
    ssl_session_timeout 10m;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Root directory
    root /var/www/html;
    index index.html index.htm;

    # Logging
    access_log /var/log/nginx/genvedha-access.log;
    error_log /var/log/nginx/genvedha-error.log;

    # Main location
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy (if you have a Node.js backend)
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

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;
}
NGINXCONF

# Enable site
ln -sf /etc/nginx/sites-available/genvedha /etc/nginx/sites-enabled/genvedha
rm -f /etc/nginx/sites-enabled/default

echo ""
echo -e "${YELLOW}Step 8: Testing Nginx configuration...${NC}"
nginx -t

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Nginx configuration error!${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Nginx configuration is valid${NC}"

echo ""
echo -e "${YELLOW}Step 9: Starting Nginx...${NC}"
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
echo -e "${YELLOW}Step 10: Testing auto-renewal...${NC}"
certbot renew --dry-run

echo ""
echo -e "${GREEN}=========================================="
echo "✓✓✓ SSL SETUP COMPLETE! ✓✓✓"
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
echo "📊 Test your SSL rating:"
echo "   https://www.ssllabs.com/ssltest/analyze.html?d=genvedha.com"
echo ""
echo "🛠️  Useful commands:"
echo "   sudo certbot certificates       # View certificates"
echo "   sudo certbot renew             # Manual renewal"
echo "   sudo systemctl status nginx    # Check Nginx"
echo "   sudo nginx -t                  # Test config"
echo "   curl -I https://genvedha.com   # Test HTTPS"
echo ""
