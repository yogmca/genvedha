#!/bin/bash

# Fix SSL with Standalone Method - Proper Setup
# This stops all services, gets the certificate, then configures everything

set -e

echo "=========================================="
echo "SSL Certificate - Standalone Method"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root: sudo ./fix-ssl-standalone-proper.sh${NC}"
    exit 1
fi

# Get email
read -p "Enter your email for SSL certificate: " EMAIL

if [ -z "$EMAIL" ]; then
    echo -e "${RED}Email is required${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Step 1: Checking DNS...${NC}"
DOMAIN_IP=$(dig +short genvedha.com | tail -n1)
SERVER_IP=$(curl -s ifconfig.me)
echo "Domain IP: $DOMAIN_IP"
echo "Server IP: $SERVER_IP"

if [ "$DOMAIN_IP" != "$SERVER_IP" ]; then
    echo -e "${RED}WARNING: DNS mismatch!${NC}"
fi

echo ""
echo -e "${YELLOW}Step 2: Stopping all web services...${NC}"

# Stop everything that might use port 80 or 443
systemctl stop nginx 2>/dev/null || true
systemctl stop apache2 2>/dev/null || true

# Kill any process on port 80
PORT_80=$(lsof -ti:80 || echo "")
if [ ! -z "$PORT_80" ]; then
    echo "Killing processes on port 80..."
    kill -9 $PORT_80 2>/dev/null || true
fi

# Kill any process on port 443
PORT_443=$(lsof -ti:443 || echo "")
if [ ! -z "$PORT_443" ]; then
    echo "Killing processes on port 443..."
    kill -9 $PORT_443 2>/dev/null || true
fi

sleep 3

echo ""
echo -e "${YELLOW}Step 3: Verifying ports are free...${NC}"
if lsof -i:80 &>/dev/null; then
    echo -e "${RED}Port 80 is still in use!${NC}"
    lsof -i:80
    exit 1
fi

if lsof -i:443 &>/dev/null; then
    echo -e "${RED}Port 443 is still in use!${NC}"
    lsof -i:443
    exit 1
fi

echo -e "${GREEN}✓ Ports 80 and 443 are free${NC}"

echo ""
echo -e "${YELLOW}Step 4: Installing Certbot...${NC}"
apt-get update -qq
apt-get install -y certbot python3-certbot-nginx

echo ""
echo -e "${YELLOW}Step 5: Removing old certificates...${NC}"
certbot delete --cert-name genvedha.com --non-interactive 2>/dev/null || true

echo ""
echo -e "${YELLOW}Step 6: Obtaining SSL certificate...${NC}"
echo "This may take a minute..."
echo ""

certbot certonly \
    --standalone \
    --preferred-challenges http \
    -d genvedha.com \
    -d www.genvedha.com \
    --email "$EMAIL" \
    --agree-tos \
    --non-interactive \
    --verbose

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Certificate request failed!${NC}"
    echo ""
    echo "Common issues:"
    echo "1. AWS Security Group doesn't allow port 80"
    echo "   - Go to EC2 Console > Security Groups"
    echo "   - Add inbound rule: HTTP (80) from 0.0.0.0/0"
    echo ""
    echo "2. DNS not pointing to this server"
    echo "   - Check: dig genvedha.com"
    echo "   - Should show: $SERVER_IP"
    echo ""
    echo "3. Firewall blocking"
    echo "   - Run: sudo ufw allow 80/tcp"
    echo "   - Run: sudo ufw allow 443/tcp"
    exit 1
fi

echo -e "${GREEN}✓ Certificate obtained successfully!${NC}"

echo ""
echo -e "${YELLOW}Step 7: Configuring Nginx...${NC}"

# Create nginx config
cat > /etc/nginx/sites-available/genvedha << 'NGINXCONF'
# HTTP - Redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name genvedha.com www.genvedha.com;
    
    # Allow Certbot renewals
    location /.well-known/acme-challenge/ {
        root /var/www/html;
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
    ssl_session_timeout 10m;
    ssl_stapling on;
    ssl_stapling_verify on;

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

# Create webroot directory for renewals
mkdir -p /var/www/html/.well-known/acme-challenge
chown -R www-data:www-data /var/www/html

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
echo "Your website is now secured with HTTPS!"
echo ""
echo "🌐 Visit your site:"
echo "   https://genvedha.com"
echo "   https://www.genvedha.com"
echo ""
echo "📜 Certificate info:"
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
echo "   sudo nginx -t                  # Test config"
echo ""
