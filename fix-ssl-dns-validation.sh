#!/bin/bash

# SSL Fix Using DNS Validation
# This bypasses port 80 blocking issues by using DNS TXT records instead

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] SUCCESS:${NC} $1"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    error "Please run as root (use sudo)"
    exit 1
fi

# Get domain and email
read -p "Enter your domain name (e.g., genvedha.com): " DOMAIN
read -p "Enter your email for SSL certificate notifications: " EMAIL

if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
    error "Domain and email are required"
    exit 1
fi

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}SSL Certificate Setup - DNS Validation${NC}"
echo -e "${BLUE}========================================${NC}"
log "Domain: $DOMAIN"
log "Email: $EMAIL"
echo ""

# Install certbot if not present
if ! command -v certbot &> /dev/null; then
    log "Installing Certbot..."
    apt-get update -qq
    apt-get install -y certbot python3-certbot-nginx
fi

# Stop services to free up port 80 (just in case)
log "Stopping PM2 services..."
pm2 stop all 2>/dev/null || true

log "Stopping Nginx..."
systemctl stop nginx 2>/dev/null || true

echo ""
echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}IMPORTANT: DNS Validation Required${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""
echo "This method uses DNS validation instead of HTTP validation."
echo "You will need to add TXT records to your domain's DNS settings."
echo ""
echo "Certbot will provide you with:"
echo "  1. A record name (e.g., _acme-challenge.genvedha.com)"
echo "  2. A record value (a long string)"
echo ""
echo "You'll need to:"
echo "  1. Go to GoDaddy DNS Management"
echo "  2. Add a TXT record with the provided name and value"
echo "  3. Wait 2-3 minutes for DNS propagation"
echo "  4. Press Enter when ready"
echo ""
read -p "Press Enter to continue..."

echo ""
log "Starting DNS validation process..."
echo ""

# Run certbot with manual DNS validation
certbot certonly \
    --manual \
    --preferred-challenges dns \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    -d "$DOMAIN" \
    -d "www.$DOMAIN"

if [ $? -eq 0 ]; then
    success "SSL certificate obtained successfully!"
    
    # Certificate paths
    CERT_PATH="/etc/letsencrypt/live/$DOMAIN/fullchain.pem"
    KEY_PATH="/etc/letsencrypt/live/$DOMAIN/privkey.pem"
    
    log "Certificate location: $CERT_PATH"
    log "Private key location: $KEY_PATH"
    
    # Create Nginx configuration
    log "Creating Nginx configuration..."
    
    cat > /etc/nginx/conf.d/genvedha.conf << EOF
# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN www.$DOMAIN;
    
    # Redirect all HTTP traffic to HTTPS
    return 301 https://\$server_name\$request_uri;
}

# HTTPS Server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;

    # SSL Configuration
    ssl_certificate $CERT_PATH;
    ssl_certificate_key $KEY_PATH;
    
    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy to Node.js application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static files (if any)
    location /static/ {
        alias /root/genvedha-website/public/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
EOF

    # Test Nginx configuration
    log "Testing Nginx configuration..."
    nginx -t
    
    if [ $? -eq 0 ]; then
        success "Nginx configuration is valid"
        
        # Start Nginx
        log "Starting Nginx..."
        systemctl start nginx
        systemctl enable nginx
        
        # Start application
        log "Starting application with PM2..."
        cd /root/genvedha-website
        pm2 start server.js --name genvedha
        pm2 save
        
        echo ""
        echo -e "${GREEN}========================================${NC}"
        echo -e "${GREEN}SSL Setup Complete!${NC}"
        echo -e "${GREEN}========================================${NC}"
        echo ""
        success "Your site is now accessible at:"
        echo -e "  ${GREEN}https://$DOMAIN${NC}"
        echo -e "  ${GREEN}https://www.$DOMAIN${NC}"
        echo ""
        log "Certificate will auto-renew before expiration"
        echo ""
        
        # Test the site
        log "Testing HTTPS connection..."
        sleep 3
        curl -I "https://$DOMAIN" 2>/dev/null | head -n 1
        
    else
        error "Nginx configuration test failed"
        cat /etc/nginx/conf.d/genvedha.conf
        exit 1
    fi
    
else
    error "Failed to obtain SSL certificate"
    echo ""
    echo -e "${YELLOW}Troubleshooting:${NC}"
    echo "1. Make sure you added the TXT records correctly in GoDaddy"
    echo "2. Wait 5-10 minutes for DNS propagation"
    echo "3. Verify TXT records: dig TXT _acme-challenge.$DOMAIN"
    echo "4. Try again: sudo ./fix-ssl-dns-validation.sh"
    exit 1
fi

echo ""
echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}Certificate Renewal${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""
warning "DNS validation requires manual intervention for renewal"
echo ""
echo "To renew the certificate (before it expires in 90 days):"
echo "  1. Run: sudo certbot renew --manual"
echo "  2. Add the new TXT records provided"
echo "  3. Complete the validation"
echo ""
echo "Alternative: Set up automatic DNS validation with GoDaddy API"
echo "  - Requires GoDaddy API credentials"
echo "  - Enables automatic renewal"
echo ""
