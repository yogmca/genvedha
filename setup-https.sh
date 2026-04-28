#!/bin/bash

# HTTPS Setup Script for Genvedha Website on AWS EC2
# This script configures Nginx as reverse proxy with Let's Encrypt SSL

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DOMAIN_NAME="${DOMAIN_NAME:-example.com}"
EMAIL="${SSL_EMAIL:-admin@example.com}"
APP_PORT="3000"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}HTTPS Setup for Genvedha Website${NC}"
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
if [ "$DOMAIN_NAME" = "example.com" ]; then
    read -p "Enter your domain name (e.g., genvedha.com): " DOMAIN_NAME
    if [ -z "$DOMAIN_NAME" ]; then
        print_error "Domain name is required!"
        exit 1
    fi
fi

# Prompt for email if not set
if [ "$EMAIL" = "admin@example.com" ]; then
    read -p "Enter your email for SSL certificate notifications: " EMAIL
    if [ -z "$EMAIL" ]; then
        print_error "Email is required!"
        exit 1
    fi
fi

print_message "Domain: $DOMAIN_NAME"
print_message "Email: $EMAIL"
print_message "App Port: $APP_PORT"

# Detect OS type
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
else
    print_error "Cannot detect OS type"
    exit 1
fi

print_message "Detected OS: $OS"

# Update system packages
print_message "Updating system packages..."
if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
    apt-get update -y
    export DEBIAN_FRONTEND=noninteractive
elif [ "$OS" = "amzn" ] || [ "$OS" = "rhel" ] || [ "$OS" = "centos" ]; then
    yum update -y
else
    print_warning "Unknown OS, attempting with apt-get..."
    apt-get update -y || yum update -y
fi

# Install Nginx if not installed
if ! command -v nginx &> /dev/null; then
    print_message "Installing Nginx..."
    if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
        apt-get install nginx -y
    elif [ "$OS" = "amzn" ] || [ "$OS" = "rhel" ] || [ "$OS" = "centos" ]; then
        amazon-linux-extras install nginx1 -y || yum install nginx -y
    fi
else
    print_message "Nginx is already installed"
fi

# Install Certbot for Let's Encrypt
if ! command -v certbot &> /dev/null; then
    print_message "Installing Certbot..."
    if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
        apt-get install certbot python3-certbot-nginx -y
    elif [ "$OS" = "amzn" ] || [ "$OS" = "rhel" ] || [ "$OS" = "centos" ]; then
        yum install certbot python3-certbot-nginx -y || {
            # Alternative installation method
            yum install python3 augeas-libs -y
            python3 -m venv /opt/certbot/
            /opt/certbot/bin/pip install --upgrade pip
            /opt/certbot/bin/pip install certbot certbot-nginx
            ln -s /opt/certbot/bin/certbot /usr/bin/certbot
        }
    fi
else
    print_message "Certbot is already installed"
fi

# Stop Nginx if it's running to avoid conflicts
if systemctl is-active --quiet nginx; then
    print_message "Stopping Nginx to clean up old configurations..."
    systemctl stop nginx
fi

# Remove any existing Nginx configuration for this domain
print_message "Removing any existing Nginx configurations..."
rm -f /etc/nginx/sites-enabled/genvedha* /etc/nginx/sites-available/genvedha* /etc/nginx/conf.d/genvedha*

# Create initial HTTP-only Nginx configuration
print_message "Creating initial HTTP-only Nginx configuration..."
cat > /etc/nginx/conf.d/genvedha.conf << EOF
# HTTP - Initial configuration for SSL certificate generation
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN_NAME www.$DOMAIN_NAME;

    # Let's Encrypt validation
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

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

# Create directory for Let's Encrypt validation
print_message "Creating certbot directory..."
mkdir -p /var/www/certbot

# Test Nginx configuration
print_message "Testing Nginx configuration..."
nginx -t

# Start and enable Nginx
print_message "Starting Nginx..."
systemctl start nginx
systemctl enable nginx

# Configure firewall (if firewalld is running)
if systemctl is-active --quiet firewalld; then
    print_message "Configuring firewall..."
    firewall-cmd --permanent --add-service=http
    firewall-cmd --permanent --add-service=https
    firewall-cmd --reload
fi

# Obtain SSL certificate
print_message "Obtaining SSL certificate from Let's Encrypt..."
print_warning "Make sure your domain $DOMAIN_NAME points to this server's IP address!"
read -p "Press Enter to continue or Ctrl+C to cancel..."

# Certbot will automatically update the Nginx configuration to use HTTPS
print_message "Running Certbot to obtain certificate and configure HTTPS..."
certbot --nginx -d $DOMAIN_NAME -d www.$DOMAIN_NAME --non-interactive --agree-tos --email $EMAIL --redirect

# Update the Nginx configuration to use modern http2 directive syntax
print_message "Updating Nginx configuration for modern http2 syntax..."
if [ -f /etc/nginx/conf.d/genvedha.conf ]; then
    # Replace deprecated "listen 443 ssl http2" with "listen 443 ssl" and add "http2 on"
    sed -i 's/listen 443 ssl http2;/listen 443 ssl;\n    http2 on;/g' /etc/nginx/conf.d/genvedha.conf
    sed -i 's/listen \[::\]:443 ssl http2;/listen [::]:443 ssl;\n    http2 on;/g' /etc/nginx/conf.d/genvedha.conf
fi

# Setup automatic certificate renewal
print_message "Setting up automatic certificate renewal..."
(crontab -l 2>/dev/null; echo "0 0,12 * * * certbot renew --quiet --post-hook 'systemctl reload nginx'") | crontab -

# Reload Nginx with new configuration
print_message "Reloading Nginx..."
systemctl reload nginx

# Display status
print_message "Nginx status:"
systemctl status nginx --no-pager

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}HTTPS Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Your website is now accessible at:${NC}"
echo -e "${GREEN}https://$DOMAIN_NAME${NC}"
echo -e "${GREEN}https://www.$DOMAIN_NAME${NC}"
echo ""
echo -e "${YELLOW}Certificate will auto-renew via cron job${NC}"
echo -e "${YELLOW}Check certificate status: certbot certificates${NC}"
echo -e "${YELLOW}Renew manually: sudo certbot renew${NC}"
