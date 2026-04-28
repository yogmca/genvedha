#!/bin/bash

# Fix Certbot 403 Error - ACME Challenge Access Issue
# This script fixes the 403 Forbidden error when Certbot tries to validate domain ownership

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DOMAIN_NAME="${DOMAIN_NAME:-genvedha.com}"
EMAIL="${SSL_EMAIL:-admin@genvedha.com}"
APP_PORT="3000"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Fix Certbot 403 Error${NC}"
echo -e "${GREEN}========================================${NC}"

# Function to print colored messages
print_message() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if running with sudo
if [ "$EUID" -ne 0 ]; then 
    print_error "Please run this script with sudo"
    exit 1
fi

# Prompt for domain name if not set
if [ "$DOMAIN_NAME" = "genvedha.com" ]; then
    read -p "Enter your domain name (e.g., genvedha.com): " DOMAIN_NAME
    if [ -z "$DOMAIN_NAME" ]; then
        print_error "Domain name is required!"
        exit 1
    fi
fi

# Prompt for email if not set
if [ "$EMAIL" = "admin@genvedha.com" ]; then
    read -p "Enter your email for SSL certificate notifications: " EMAIL
    if [ -z "$EMAIL" ]; then
        print_error "Email is required!"
        exit 1
    fi
fi

print_message "Domain: $DOMAIN_NAME"
print_message "Email: $EMAIL"

# Step 1: Stop Nginx
print_message "Stopping Nginx..."
systemctl stop nginx || true

# Step 2: Remove all existing Nginx configurations
print_message "Removing all existing Nginx configurations..."
rm -f /etc/nginx/sites-enabled/* /etc/nginx/sites-available/genvedha* /etc/nginx/conf.d/genvedha* /etc/nginx/conf.d/default.conf

# Step 3: Create webroot directory with proper permissions
print_message "Creating webroot directory for ACME challenges..."
mkdir -p /var/www/html/.well-known/acme-challenge
mkdir -p /var/www/certbot/.well-known/acme-challenge
chmod -R 755 /var/www/html
chmod -R 755 /var/www/certbot

# Set proper ownership
if id "www-data" &>/dev/null; then
    chown -R www-data:www-data /var/www/html
    chown -R www-data:www-data /var/www/certbot
    NGINX_USER="www-data"
elif id "nginx" &>/dev/null; then
    chown -R nginx:nginx /var/www/html
    chown -R nginx:nginx /var/www/certbot
    NGINX_USER="nginx"
else
    print_warning "Could not determine Nginx user, using default permissions"
    NGINX_USER="nginx"
fi

print_message "Nginx user: $NGINX_USER"

# Step 4: Create a minimal HTTP-only Nginx configuration
print_message "Creating minimal HTTP-only Nginx configuration..."
cat > /etc/nginx/conf.d/genvedha.conf << EOF
# Minimal HTTP configuration for SSL certificate generation
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name $DOMAIN_NAME www.$DOMAIN_NAME;

    # Root directory for ACME challenges
    root /var/www/html;

    # ACME challenge location - MUST be accessible
    location ^~ /.well-known/acme-challenge/ {
        allow all;
        root /var/www/html;
        default_type "text/plain";
        try_files \$uri =404;
    }

    # Logging for debugging
    access_log /var/log/nginx/genvedha_access.log;
    error_log /var/log/nginx/genvedha_error.log debug;

    # Temporary: serve all other requests
    location / {
        proxy_pass http://localhost:$APP_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Step 5: Test Nginx configuration
print_message "Testing Nginx configuration..."
nginx -t

# Step 6: Start Nginx
print_message "Starting Nginx..."
systemctl start nginx
systemctl enable nginx

# Step 7: Verify Nginx is running
if ! systemctl is-active --quiet nginx; then
    print_error "Nginx failed to start!"
    systemctl status nginx --no-pager
    exit 1
fi

print_message "Nginx is running successfully"

# Step 8: Test ACME challenge directory accessibility
print_message "Testing ACME challenge directory accessibility..."
echo "test" > /var/www/html/.well-known/acme-challenge/test.txt
chmod 644 /var/www/html/.well-known/acme-challenge/test.txt

# Wait a moment for Nginx to fully start
sleep 2

# Test local access
print_message "Testing local access to ACME challenge..."
if curl -s http://localhost/.well-known/acme-challenge/test.txt | grep -q "test"; then
    print_message "✓ Local ACME challenge access works"
else
    print_warning "⚠ Local ACME challenge access failed"
fi

# Clean up test file
rm -f /var/www/html/.well-known/acme-challenge/test.txt

# Step 9: Revoke any existing failed certificates
print_message "Cleaning up any existing certificate attempts..."
certbot delete --cert-name $DOMAIN_NAME --non-interactive 2>/dev/null || true

# Step 10: Obtain SSL certificate using webroot method
print_message "Obtaining SSL certificate from Let's Encrypt..."
print_message "Using webroot authentication method..."

# Use webroot method which is more reliable
certbot certonly \
    --webroot \
    --webroot-path /var/www/html \
    -d $DOMAIN_NAME \
    -d www.$DOMAIN_NAME \
    --non-interactive \
    --agree-tos \
    --email $EMAIL \
    --preferred-challenges http \
    --debug-challenges

# Check if certificate was obtained successfully
if [ ! -f "/etc/letsencrypt/live/$DOMAIN_NAME/fullchain.pem" ]; then
    print_error "Failed to obtain SSL certificate!"
    print_error "Please check the logs at /var/log/letsencrypt/letsencrypt.log"
    exit 1
fi

print_message "✓ SSL certificate obtained successfully!"

# Step 11: Update Nginx configuration to use HTTPS
print_message "Updating Nginx configuration to use HTTPS..."
cat > /etc/nginx/conf.d/genvedha.conf << EOF
# HTTP - Redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN_NAME www.$DOMAIN_NAME;

    # ACME challenge location
    location ^~ /.well-known/acme-challenge/ {
        allow all;
        root /var/www/html;
        default_type "text/plain";
        try_files \$uri =404;
    }

    # Redirect all other HTTP traffic to HTTPS
    location / {
        return 301 https://\$server_name\$request_uri;
    }
}

# HTTPS - Main configuration
server {
    listen 443 ssl;
    listen [::]:443 ssl;
    http2 on;
    
    server_name $DOMAIN_NAME www.$DOMAIN_NAME;

    # SSL Certificate
    ssl_certificate /etc/letsencrypt/live/$DOMAIN_NAME/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN_NAME/privkey.pem;
    
    # SSL Configuration
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

    # Logging
    access_log /var/log/nginx/genvedha_access.log;
    error_log /var/log/nginx/genvedha_error.log;

    # Proxy settings for the application
    location / {
        proxy_pass http://localhost:$APP_PORT;
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

    # Static files caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:$APP_PORT;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Step 12: Test and reload Nginx
print_message "Testing updated Nginx configuration..."
nginx -t

print_message "Reloading Nginx..."
systemctl reload nginx

# Step 13: Setup automatic certificate renewal
print_message "Setting up automatic certificate renewal..."
# Remove any existing certbot cron jobs
crontab -l 2>/dev/null | grep -v "certbot renew" | crontab - 2>/dev/null || true
# Add new cron job
(crontab -l 2>/dev/null; echo "0 0,12 * * * certbot renew --quiet --post-hook 'systemctl reload nginx'") | crontab -

# Step 14: Display status
print_message "Nginx status:"
systemctl status nginx --no-pager | head -20

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ HTTPS Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Your website is now accessible at:${NC}"
echo -e "${GREEN}  • https://$DOMAIN_NAME${NC}"
echo -e "${GREEN}  • https://www.$DOMAIN_NAME${NC}"
echo ""
echo -e "${YELLOW}Certificate Information:${NC}"
certbot certificates
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo -e "  • Test your site: https://$DOMAIN_NAME"
echo -e "  • Certificate will auto-renew via cron job"
echo -e "  • Check certificate status: sudo certbot certificates"
echo -e "  • Renew manually: sudo certbot renew"
echo -e "  • View logs: tail -f /var/log/nginx/genvedha_error.log"
