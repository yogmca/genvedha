#!/bin/bash

# Fix SSL with HTTP-01 Validation (Proper Method)
# This script uses HTTP validation instead of DNS validation

set -e

echo "=========================================="
echo "SSL Certificate Setup - HTTP Validation"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root (use sudo)${NC}"
    exit 1
fi

# Get email for certificate
read -p "Enter your email for SSL certificate: " EMAIL

if [ -z "$EMAIL" ]; then
    echo -e "${RED}Email is required${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Step 1: Checking DNS configuration...${NC}"
echo ""

# Check if domain points to this server
DOMAIN_IP=$(dig +short genvedha.com | tail -n1)
SERVER_IP=$(curl -s ifconfig.me)

echo "Domain IP: $DOMAIN_IP"
echo "Server IP: $SERVER_IP"

if [ "$DOMAIN_IP" != "$SERVER_IP" ]; then
    echo -e "${RED}WARNING: Domain doesn't point to this server!${NC}"
    echo "Please update your DNS A records in GoDaddy first."
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""
echo -e "${YELLOW}Step 2: Installing/Updating Certbot...${NC}"
echo ""

# Install certbot if not present
if ! command -v certbot &> /dev/null; then
    apt-get update
    apt-get install -y certbot python3-certbot-nginx
else
    echo "Certbot already installed"
fi

echo ""
echo -e "${YELLOW}Step 3: Checking port 80 availability...${NC}"
echo ""

# Check what's using port 80
PORT_80_PROCESS=$(lsof -ti:80 || echo "")

if [ ! -z "$PORT_80_PROCESS" ]; then
    echo "Port 80 is in use. Stopping services..."
    
    # Stop nginx if running
    if systemctl is-active --quiet nginx; then
        echo "Stopping nginx..."
        systemctl stop nginx
    fi
    
    # Stop apache if running
    if systemctl is-active --quiet apache2; then
        echo "Stopping apache2..."
        systemctl stop apache2
    fi
    
    sleep 2
fi

echo ""
echo -e "${YELLOW}Step 4: Obtaining SSL certificate with standalone method...${NC}"
echo ""

# Remove any existing certificates for clean start
if [ -d "/etc/letsencrypt/live/genvedha.com" ]; then
    echo "Removing old certificates..."
    certbot delete --cert-name genvedha.com --non-interactive
fi

# Get certificate using standalone method
echo "Running Certbot..."
certbot certonly \
    --standalone \
    --preferred-challenges http \
    -d genvedha.com \
    -d www.genvedha.com \
    --email "$EMAIL" \
    --agree-tos \
    --non-interactive \
    --verbose

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Certificate obtained successfully!${NC}"
else
    echo -e "${RED}✗ Failed to obtain certificate${NC}"
    echo ""
    echo "Troubleshooting steps:"
    echo "1. Check AWS Security Group allows port 80 from 0.0.0.0/0"
    echo "2. Verify DNS: dig genvedha.com (should show your server IP)"
    echo "3. Check firewall: sudo ufw status"
    exit 1
fi

echo ""
echo -e "${YELLOW}Step 5: Configuring Nginx...${NC}"
echo ""

# Create nginx configuration
cat > /etc/nginx/sites-available/genvedha << 'EOF'
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name genvedha.com www.genvedha.com;
    
    # Allow Certbot renewal
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    # Redirect everything else to HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name genvedha.com www.genvedha.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/genvedha.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/genvedha.com/privkey.pem;
    
    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Document root
    root /var/www/html;
    index index.html index.htm;

    # Main location
    location / {
        try_files $uri $uri/ =404;
    }

    # Proxy to Node.js application (if needed)
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

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/genvedha /etc/nginx/sites-enabled/

# Remove default site if exists
rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
echo "Testing Nginx configuration..."
nginx -t

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Nginx configuration is valid${NC}"
else
    echo -e "${RED}✗ Nginx configuration has errors${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Step 6: Starting Nginx...${NC}"
echo ""

# Start nginx
systemctl start nginx
systemctl enable nginx

if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✓ Nginx is running${NC}"
else
    echo -e "${RED}✗ Failed to start Nginx${NC}"
    systemctl status nginx
    exit 1
fi

echo ""
echo -e "${YELLOW}Step 7: Setting up auto-renewal...${NC}"
echo ""

# Test renewal
certbot renew --dry-run

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Auto-renewal is configured${NC}"
else
    echo -e "${YELLOW}⚠ Auto-renewal test had issues (but certificate is installed)${NC}"
fi

echo ""
echo -e "${GREEN}=========================================="
echo "✓ SSL Setup Complete!"
echo "==========================================${NC}"
echo ""
echo "Your site should now be accessible at:"
echo "  https://genvedha.com"
echo "  https://www.genvedha.com"
echo ""
echo "Certificate details:"
certbot certificates
echo ""
echo "Next steps:"
echo "1. Visit https://genvedha.com to verify"
echo "2. Check SSL rating: https://www.ssllabs.com/ssltest/analyze.html?d=genvedha.com"
echo "3. Certificates will auto-renew before expiration"
echo ""
echo "Useful commands:"
echo "  sudo certbot certificates          # View certificates"
echo "  sudo certbot renew                 # Manually renew"
echo "  sudo systemctl status nginx        # Check Nginx status"
echo "  sudo nginx -t                      # Test Nginx config"
echo ""
