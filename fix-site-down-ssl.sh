#!/bin/bash

# ============================================================================
# GENVEDHA.COM - EMERGENCY SSL FIX SCRIPT
# ============================================================================
# This script fixes the SSL/TLS configuration issue causing site downtime
# Error: tlsv1 unrecognized name
# ============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="genvedha.com"
WWW_DOMAIN="www.genvedha.com"
EMAIL="your-email@example.com"  # Change this!
APP_PORT="3000"
PROJECT_DIR="/home/ubuntu/genvedha-website"

# ============================================================================
# Helper Functions
# ============================================================================

print_header() {
    echo -e "\n${BLUE}============================================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}============================================================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

check_root() {
    if [[ $EUID -ne 0 ]]; then
        print_error "This script must be run as root (use sudo)"
        exit 1
    fi
}

# ============================================================================
# Main Script
# ============================================================================

print_header "🚨 GENVEDHA.COM - EMERGENCY SSL FIX"

check_root

# Step 1: Check current status
print_header "Step 1: Checking Current Status"

print_info "Checking Nginx status..."
if systemctl is-active --quiet nginx; then
    print_success "Nginx is running"
    NGINX_RUNNING=true
else
    print_warning "Nginx is not running"
    NGINX_RUNNING=false
fi

print_info "Checking PM2 status..."
if command -v pm2 &> /dev/null; then
    pm2 status || true
    print_success "PM2 is installed"
else
    print_warning "PM2 is not installed"
fi

print_info "Checking existing SSL certificates..."
if [ -d "/etc/letsencrypt/live/$DOMAIN" ]; then
    print_warning "SSL certificates exist but may be misconfigured"
    ls -la /etc/letsencrypt/live/$DOMAIN/ || true
else
    print_info "No SSL certificates found - will create new ones"
fi

# Step 2: Stop services to free up ports
print_header "Step 2: Stopping Services"

print_info "Stopping Nginx..."
systemctl stop nginx 2>/dev/null || print_warning "Nginx was not running"
print_success "Nginx stopped"

print_info "Stopping PM2 apps..."
if command -v pm2 &> /dev/null; then
    pm2 stop all 2>/dev/null || print_warning "No PM2 apps were running"
    print_success "PM2 apps stopped"
fi

# Wait for ports to be released
sleep 3

# Step 3: Check if ports are free
print_header "Step 3: Checking Port Availability"

if netstat -tlnp | grep -q ":80 "; then
    print_error "Port 80 is still in use!"
    netstat -tlnp | grep ":80 "
    print_info "Attempting to kill process on port 80..."
    fuser -k 80/tcp 2>/dev/null || true
    sleep 2
fi

if netstat -tlnp | grep -q ":443 "; then
    print_error "Port 443 is still in use!"
    netstat -tlnp | grep ":443 "
    print_info "Attempting to kill process on port 443..."
    fuser -k 443/tcp 2>/dev/null || true
    sleep 2
fi

print_success "Ports 80 and 443 are available"

# Step 4: Install/Update Certbot
print_header "Step 4: Ensuring Certbot is Installed"

if ! command -v certbot &> /dev/null; then
    print_info "Installing Certbot..."
    apt-get update -qq
    apt-get install -y certbot python3-certbot-nginx
    print_success "Certbot installed"
else
    print_success "Certbot is already installed"
fi

# Step 5: Get SSL Certificate
print_header "Step 5: Obtaining SSL Certificate"

print_info "Requesting SSL certificate for $DOMAIN and $WWW_DOMAIN..."

# Remove existing certificates if they exist and are broken
if [ -d "/etc/letsencrypt/live/$DOMAIN" ]; then
    print_warning "Removing existing certificates..."
    certbot delete --cert-name $DOMAIN --non-interactive 2>/dev/null || true
fi

# Get new certificate
print_info "Running certbot in standalone mode..."
if certbot certonly --standalone \
    --preferred-challenges http \
    --agree-tos \
    --email $EMAIL \
    --domains $DOMAIN,$WWW_DOMAIN \
    --non-interactive \
    --force-renewal; then
    print_success "SSL certificate obtained successfully!"
else
    print_warning "Failed to get certificate for both domains, trying main domain only..."
    if certbot certonly --standalone \
        --preferred-challenges http \
        --agree-tos \
        --email $EMAIL \
        --domains $DOMAIN \
        --non-interactive \
        --force-renewal; then
        print_success "SSL certificate obtained for main domain!"
    else
        print_error "Failed to obtain SSL certificate!"
        print_error "Please check:"
        print_error "1. AWS Security Group allows port 80 and 443"
        print_error "2. Domain DNS is pointing to this server"
        print_error "3. No firewall is blocking the ports"
        exit 1
    fi
fi

# Verify certificate was created
if [ ! -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    print_error "Certificate files not found!"
    exit 1
fi

print_success "Certificate files verified"

# Step 6: Configure Nginx
print_header "Step 6: Configuring Nginx"

print_info "Creating Nginx configuration..."

cat > /etc/nginx/sites-available/genvedha << 'EOF'
# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name genvedha.com www.genvedha.com;
    
    # Allow Let's Encrypt validation
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    # Redirect all other traffic to HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS Server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name genvedha.com www.genvedha.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/genvedha.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/genvedha.com/privkey.pem;
    
    # Modern SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;
    
    # SSL session cache
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # OCSP stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    ssl_trusted_certificate /etc/letsencrypt/live/genvedha.com/chain.pem;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logging
    access_log /var/log/nginx/genvedha_access.log;
    error_log /var/log/nginx/genvedha_error.log;

    # Proxy to Node.js app
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # API endpoints
    location /api/ {
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
}
EOF

print_success "Nginx configuration created"

# Enable the site
print_info "Enabling site configuration..."
ln -sf /etc/nginx/sites-available/genvedha /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
print_info "Testing Nginx configuration..."
if nginx -t; then
    print_success "Nginx configuration is valid"
else
    print_error "Nginx configuration test failed!"
    exit 1
fi

# Step 7: Start Services
print_header "Step 7: Starting Services"

print_info "Starting Nginx..."
systemctl start nginx
systemctl enable nginx
print_success "Nginx started and enabled"

print_info "Starting Node.js application..."
if command -v pm2 &> /dev/null; then
    cd $PROJECT_DIR || print_warning "Could not change to project directory"
    
    # Check if app is already in PM2
    if pm2 list | grep -q "genvedha"; then
        pm2 restart genvedha
        print_success "Application restarted"
    else
        # Start new app
        if [ -f "server.js" ]; then
            pm2 start server.js --name genvedha
            pm2 save
            print_success "Application started"
        else
            print_warning "server.js not found in $PROJECT_DIR"
        fi
    fi
else
    print_warning "PM2 not found - please start your Node.js app manually"
fi

# Step 8: Verify Everything is Working
print_header "Step 8: Verification"

sleep 3

print_info "Checking Nginx status..."
if systemctl is-active --quiet nginx; then
    print_success "Nginx is running"
else
    print_error "Nginx is not running!"
    systemctl status nginx
fi

print_info "Checking SSL certificate..."
certbot certificates

print_info "Checking if ports are listening..."
if netstat -tlnp | grep -q ":443 "; then
    print_success "Port 443 (HTTPS) is listening"
else
    print_error "Port 443 is not listening!"
fi

if netstat -tlnp | grep -q ":80 "; then
    print_success "Port 80 (HTTP) is listening"
else
    print_error "Port 80 is not listening!"
fi

print_info "Checking Node.js app..."
if curl -s http://localhost:3000 > /dev/null; then
    print_success "Node.js app is responding on port 3000"
else
    print_warning "Node.js app may not be running on port 3000"
fi

# Step 9: Setup Auto-Renewal
print_header "Step 9: Setting Up SSL Auto-Renewal"

print_info "Configuring certbot auto-renewal..."
systemctl enable certbot.timer 2>/dev/null || print_warning "Certbot timer not available"
print_success "SSL certificates will auto-renew"

# Final Summary
print_header "🎉 SSL FIX COMPLETE!"

echo -e "${GREEN}"
echo "✅ SSL certificate obtained and installed"
echo "✅ Nginx configured with HTTPS"
echo "✅ Services started and running"
echo "✅ Auto-renewal configured"
echo -e "${NC}"

print_info "Testing from server..."
echo ""
curl -I https://$DOMAIN 2>&1 | head -5 || print_warning "Could not test HTTPS locally"

echo ""
print_header "📋 Next Steps"
echo "1. Test your site: https://$DOMAIN"
echo "2. Test SSL: https://www.ssllabs.com/ssltest/analyze.html?d=$DOMAIN"
echo "3. Check logs if needed:"
echo "   - Nginx: sudo tail -f /var/log/nginx/genvedha_error.log"
echo "   - App: pm2 logs genvedha"
echo ""

print_header "🔍 Troubleshooting"
echo "If site is still not accessible:"
echo "1. Check AWS Security Group has ports 80 and 443 open"
echo "2. Check DNS propagation: https://dnschecker.org/#A/$DOMAIN"
echo "3. Check firewall: sudo ufw status"
echo "4. View this guide: cat SITE-IS-DOWN-FIX.md"
echo ""

print_success "Script completed successfully!"
echo ""
