#!/bin/bash

# Aggressive SSL Fix - Stops app, uses standalone mode
# This bypasses all Nginx/app issues by using Certbot's standalone server

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

DOMAIN_NAME="${DOMAIN_NAME:-genvedha.com}"
EMAIL="${SSL_EMAIL:-admin@genvedha.com}"
APP_PORT="3000"

print_message() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

if [ "$EUID" -ne 0 ]; then 
    print_error "Please run this script with sudo"
    exit 1
fi

if [ "$DOMAIN_NAME" = "genvedha.com" ]; then
    read -p "Enter your domain name (e.g., genvedha.com): " DOMAIN_NAME
    if [ -z "$DOMAIN_NAME" ]; then
        print_error "Domain name is required!"
        exit 1
    fi
fi

if [ "$EMAIL" = "admin@genvedha.com" ]; then
    read -p "Enter your email for SSL certificate notifications: " EMAIL
    if [ -z "$EMAIL" ]; then
        print_error "Email is required!"
        exit 1
    fi
fi

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Aggressive SSL Fix - Using Standalone Mode${NC}"
echo -e "${GREEN}========================================${NC}"
print_message "Domain: $DOMAIN_NAME"
print_message "Email: $EMAIL"

# Step 1: Stop everything that might use port 80
print_message "Stopping all services on port 80..."
systemctl stop nginx 2>/dev/null || true
pm2 stop all 2>/dev/null || true
pkill -f "node.*server.js" 2>/dev/null || true

# Wait for ports to be released
sleep 3

# Verify port 80 is free
if lsof -Pi :80 -sTCP:LISTEN -t >/dev/null 2>&1; then
    print_error "Port 80 is still in use. Killing processes..."
    lsof -ti:80 | xargs kill -9 2>/dev/null || true
    sleep 2
fi

# Step 2: Remove any existing certificates
print_message "Removing any existing certificate attempts..."
certbot delete --cert-name $DOMAIN_NAME --non-interactive 2>/dev/null || true

# Step 3: Use standalone mode to get certificate
print_message "Obtaining SSL certificate using standalone mode..."
print_message "This will temporarily run Certbot's own web server on port 80"

certbot certonly \
    --standalone \
    --preferred-challenges http \
    -d $DOMAIN_NAME \
    -d www.$DOMAIN_NAME \
    --non-interactive \
    --agree-tos \
    --email $EMAIL \
    --force-renewal

# Check if certificate was obtained
if [ ! -f "/etc/letsencrypt/live/$DOMAIN_NAME/fullchain.pem" ]; then
    print_error "Failed to obtain SSL certificate!"
    print_error "Please check:"
    print_error "1. DNS is pointing to this server: dig $DOMAIN_NAME"
    print_error "2. Port 80 is open in AWS Security Group"
    print_error "3. No firewall blocking port 80"
    exit 1
fi

print_message "✓ SSL certificate obtained successfully!"

# Step 4: Create Nginx configuration
print_message "Creating Nginx configuration..."

# Remove old configs
rm -f /etc/nginx/sites-enabled/* /etc/nginx/conf.d/genvedha* /etc/nginx/conf.d/default.conf

# Create new config
cat > /etc/nginx/conf.d/genvedha.conf << EOF
# HTTP - Redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN_NAME www.$DOMAIN_NAME;

    # ACME challenge for renewals
    location ^~ /.well-known/acme-challenge/ {
        allow all;
        root /var/www/html;
        default_type "text/plain";
        try_files \$uri =404;
    }

    # Redirect all other traffic to HTTPS
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

# Step 5: Create webroot for renewals
print_message "Creating webroot directory for certificate renewals..."
mkdir -p /var/www/html/.well-known/acme-challenge
chmod -R 755 /var/www/html

if id "www-data" &>/dev/null; then
    chown -R www-data:www-data /var/www/html
elif id "nginx" &>/dev/null; then
    chown -R nginx:nginx /var/www/html
fi

# Step 6: Test and start Nginx
print_message "Testing Nginx configuration..."
nginx -t

print_message "Starting Nginx..."
systemctl start nginx
systemctl enable nginx

# Step 7: Start your application
print_message "Starting your Node.js application..."
cd /home/ubuntu/genvedha-website || cd /home/ec2-user/genvedha-website || cd ~/genvedha-website

# Start with PM2 if available
if command -v pm2 &> /dev/null; then
    pm2 start server.js --name genvedha 2>/dev/null || pm2 restart genvedha
    pm2 save
else
    print_warning "PM2 not found. Please start your app manually with: pm2 start server.js --name genvedha"
fi

# Step 8: Setup automatic renewal
print_message "Setting up automatic certificate renewal..."

# Create renewal hook script
cat > /etc/letsencrypt/renewal-hooks/pre/stop-nginx.sh << 'EOFHOOK'
#!/bin/bash
systemctl stop nginx
EOFHOOK

cat > /etc/letsencrypt/renewal-hooks/post/start-nginx.sh << 'EOFHOOK'
#!/bin/bash
systemctl start nginx
EOFHOOK

chmod +x /etc/letsencrypt/renewal-hooks/pre/stop-nginx.sh
chmod +x /etc/letsencrypt/renewal-hooks/post/start-nginx.sh

# Update renewal config to use standalone
cat > /etc/letsencrypt/renewal/$DOMAIN_NAME.conf << EOFRENEW
# renew_before_expiry = 30 days
version = 2.11.0
archive_dir = /etc/letsencrypt/archive/$DOMAIN_NAME
cert = /etc/letsencrypt/live/$DOMAIN_NAME/cert.pem
privkey = /etc/letsencrypt/live/$DOMAIN_NAME/privkey.pem
chain = /etc/letsencrypt/live/$DOMAIN_NAME/chain.pem
fullchain = /etc/letsencrypt/live/$DOMAIN_NAME/fullchain.pem

# Options used in the renewal process
[renewalparams]
account = $(ls -1 /etc/letsencrypt/accounts/acme-v02.api.letsencrypt.org/directory/ | head -1)
authenticator = standalone
server = https://acme-v02.api.letsencrypt.org/directory
key_type = ecdsa
EOFRENEW

# Add cron job
crontab -l 2>/dev/null | grep -v "certbot renew" | crontab - 2>/dev/null || true
(crontab -l 2>/dev/null; echo "0 0,12 * * * certbot renew --quiet") | crontab -

# Step 9: Display status
print_message "Checking services status..."
echo ""
echo "Nginx status:"
systemctl status nginx --no-pager | head -10
echo ""
echo "Application status:"
pm2 status 2>/dev/null || echo "PM2 not available"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ SSL Certificate Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${GREEN}Your website is now accessible at:${NC}"
echo -e "${GREEN}  • https://$DOMAIN_NAME${NC}"
echo -e "${GREEN}  • https://www.$DOMAIN_NAME${NC}"
echo ""
echo -e "${YELLOW}Certificate Information:${NC}"
certbot certificates
echo ""
echo -e "${YELLOW}Important Notes:${NC}"
echo -e "  • Certificate obtained using standalone mode"
echo -e "  • Renewals will temporarily stop Nginx (automated)"
echo -e "  • Certificate will auto-renew every 60 days"
echo -e "  • Test renewal: sudo certbot renew --dry-run"
echo ""
echo -e "${YELLOW}Verify it's working:${NC}"
echo -e "  curl -I https://$DOMAIN_NAME"
echo -e "  curl -I https://www.$DOMAIN_NAME"
