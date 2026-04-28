#!/bin/bash

# Simple DNS Validation SSL Setup
# This bypasses all network blocking issues

set -e

echo "=========================================="
echo "SSL Setup with DNS Validation"
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
    echo -e "${RED}Please run as root: sudo ./fix-ssl-dns-validation-simple.sh${NC}"
    exit 1
fi

# Get email
read -p "Enter your email for SSL certificate: " EMAIL

if [ -z "$EMAIL" ]; then
    echo -e "${RED}Email is required${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Step 1: Stopping web servers...${NC}"
systemctl stop nginx 2>/dev/null || true
systemctl stop apache2 2>/dev/null || true
killall nginx apache2 httpd 2>/dev/null || true
echo -e "${GREEN}✓ Web servers stopped${NC}"

echo ""
echo -e "${YELLOW}Step 2: Removing old certificates...${NC}"
certbot delete --cert-name genvedha.com --non-interactive 2>/dev/null || true
echo -e "${GREEN}✓ Old certificates removed${NC}"

echo ""
echo -e "${BLUE}=========================================="
echo "Step 3: Requesting SSL Certificate"
echo "==========================================${NC}"
echo ""
echo -e "${YELLOW}IMPORTANT: Certbot will ask you to add DNS TXT records.${NC}"
echo ""
echo "When prompted:"
echo "1. Copy the TXT record name and value"
echo "2. Go to GoDaddy DNS Management"
echo "3. Add a TXT record:"
echo "   - Type: TXT"
echo "   - Name: _acme-challenge"
echo "   - Value: (paste the value Certbot gives you)"
echo "   - TTL: 600"
echo "4. Wait 2-3 minutes for DNS propagation"
echo "5. Verify with: dig TXT _acme-challenge.genvedha.com +short"
echo "6. Press Enter in Certbot when ready"
echo ""
echo "You'll need to do this TWICE (once for genvedha.com, once for www.genvedha.com)"
echo ""
read -p "Press Enter when you're ready to continue..."

echo ""
echo -e "${YELLOW}Starting certificate request...${NC}"
echo ""

# Request certificate with DNS validation
certbot certonly \
    --manual \
    --preferred-challenges dns \
    -d genvedha.com \
    -d www.genvedha.com \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email

if [ $? -ne 0 ]; then
    echo ""
    echo -e "${RED}✗ Certificate request failed!${NC}"
    echo ""
    echo "Common issues:"
    echo "1. DNS records not added correctly"
    echo "2. DNS not propagated yet (wait 2-3 minutes)"
    echo "3. Wrong TXT record values"
    echo ""
    echo "To verify DNS records:"
    echo "  dig TXT _acme-challenge.genvedha.com +short"
    echo "  dig TXT _acme-challenge.www.genvedha.com +short"
    echo ""
    exit 1
fi

echo ""
echo -e "${GREEN}✓✓✓ Certificate obtained successfully! ✓✓✓${NC}"
echo ""

echo -e "${YELLOW}Step 4: Creating webroot directory...${NC}"
mkdir -p /var/www/html/.well-known/acme-challenge
chown -R www-data:www-data /var/www/html
chmod -R 755 /var/www/html
echo -e "${GREEN}✓ Webroot created${NC}"

echo ""
echo -e "${YELLOW}Step 5: Configuring Nginx...${NC}"

# Create nginx configuration
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

# Enable site
ln -sf /etc/nginx/sites-available/genvedha /etc/nginx/sites-enabled/genvedha
rm -f /etc/nginx/sites-enabled/default

echo ""
echo -e "${YELLOW}Step 6: Testing Nginx configuration...${NC}"
nginx -t

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Nginx configuration error!${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Nginx configuration is valid${NC}"

echo ""
echo -e "${YELLOW}Step 7: Starting Nginx...${NC}"
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
echo -e "${YELLOW}⚠️  IMPORTANT: Certificate Renewal${NC}"
echo ""
echo "DNS validation requires manual renewal every 60-90 days."
echo ""
echo "To renew:"
echo "  sudo certbot renew --manual --preferred-challenges dns"
echo ""
echo "You'll need to add new TXT records each time."
echo ""
echo "Alternative: Fix your network blocking issue and switch to HTTP validation"
echo "for automatic renewal. See ULTIMATE-SSL-FIX.md for details."
echo ""
echo "📊 Test your SSL:"
echo "   https://www.ssllabs.com/ssltest/analyze.html?d=genvedha.com"
echo ""
