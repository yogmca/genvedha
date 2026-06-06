#!/bin/bash

# Safe Deployment Script for Generated Apps
# This script deploys generated apps WITHOUT breaking existing GenVedha website
# Usage: ./safe-deploy-generated-app.sh <app-folder-name> <subdomain> <port>

set -e  # Exit on error

APP_FOLDER=$1
SUBDOMAIN=$2
PORT=$3
DOMAIN="genvedha.com"
BASE_PATH="/home/ubuntu/genvedha/genvedha-llm-service/generated-apps"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Validate inputs
if [ -z "$APP_FOLDER" ] || [ -z "$SUBDOMAIN" ] || [ -z "$PORT" ]; then
    print_error "Missing required arguments"
    echo "Usage: ./safe-deploy-generated-app.sh <app-folder-name> <subdomain> <port>"
    echo "Example: ./safe-deploy-generated-app.sh fashion-store-abc123 fashion 3004"
    exit 1
fi

APP_PATH="$BASE_PATH/$APP_FOLDER"

# Check if app folder exists
if [ ! -d "$APP_PATH" ]; then
    print_error "App folder not found: $APP_PATH"
    exit 1
fi

print_info "🚀 Starting safe deployment of $APP_FOLDER"
print_info "📍 Subdomain: $SUBDOMAIN.$DOMAIN"
print_info "🔌 Port: $PORT"

# Check if port is already in use
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null ; then
    print_error "Port $PORT is already in use!"
    print_info "Running processes on port $PORT:"
    lsof -i :$PORT
    exit 1
fi

# Check if subdomain already exists in Nginx
if [ -f "/etc/nginx/sites-available/$SUBDOMAIN" ]; then
    print_warning "Nginx configuration for $SUBDOMAIN already exists"
    read -p "Do you want to overwrite it? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Deployment cancelled"
        exit 0
    fi
fi

# Backup existing Nginx configuration (safety measure)
print_info "📦 Creating backup of Nginx configuration..."
sudo cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup.$(date +%Y%m%d_%H%M%S)

# Install backend dependencies
print_info "📦 Installing backend dependencies..."
cd "$APP_PATH/backend"
if [ ! -f "package.json" ]; then
    print_error "package.json not found in backend folder"
    exit 1
fi
npm install --production

# Install frontend dependencies and build
print_info "📦 Installing frontend dependencies..."
cd "$APP_PATH/frontend"
if [ ! -f "package.json" ]; then
    print_error "package.json not found in frontend folder"
    exit 1
fi
npm install --production

print_info "🏗️  Building frontend for production..."
npm run build

if [ ! -d "build" ]; then
    print_error "Frontend build failed - build directory not found"
    exit 1
fi

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    print_error "PM2 is not installed. Installing PM2..."
    sudo npm install -g pm2
fi

# Add to PM2 (this won't affect existing apps)
print_info "⚙️  Adding app to PM2..."
pm2 start "$APP_PATH/backend/server.js" \
    --name "$SUBDOMAIN-backend" \
    --env production \
    -- --port=$PORT

# Save PM2 configuration
pm2 save

# Create Nginx configuration for the new subdomain
print_info "🌐 Creating Nginx configuration..."
sudo tee "/etc/nginx/sites-available/$SUBDOMAIN" > /dev/null <<EOF
# Generated App: $APP_FOLDER
# Created: $(date)
# This configuration is SEPARATE from main GenVedha site

server {
    listen 80;
    server_name $SUBDOMAIN.$DOMAIN;

    # Frontend - Serve React build
    root $APP_PATH/frontend/build;
    index index.html;

    # Serve static files
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Proxy API requests to backend
    location /api {
        proxy_pass http://localhost:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Logging
    access_log /var/log/nginx/$SUBDOMAIN.access.log;
    error_log /var/log/nginx/$SUBDOMAIN.error.log;
}
EOF

# Enable the site (create symlink)
print_info "🔗 Enabling site in Nginx..."
sudo ln -sf "/etc/nginx/sites-available/$SUBDOMAIN" "/etc/nginx/sites-enabled/"

# Test Nginx configuration BEFORE reloading
print_info "🧪 Testing Nginx configuration..."
if sudo nginx -t; then
    print_info "✅ Nginx configuration is valid"
else
    print_error "Nginx configuration test failed!"
    print_warning "Rolling back changes..."
    
    # Remove the new configuration
    sudo rm -f "/etc/nginx/sites-enabled/$SUBDOMAIN"
    sudo rm -f "/etc/nginx/sites-available/$SUBDOMAIN"
    
    # Stop the PM2 app
    pm2 delete "$SUBDOMAIN-backend"
    pm2 save
    
    print_error "Deployment failed. Your existing site is still running."
    exit 1
fi

# Reload Nginx (this won't affect existing sites)
print_info "🔄 Reloading Nginx..."
sudo systemctl reload nginx

# Verify the app is running
sleep 2
if pm2 list | grep -q "$SUBDOMAIN-backend"; then
    print_info "✅ App is running in PM2"
else
    print_error "App failed to start in PM2"
    exit 1
fi

# Check if Certbot is installed for SSL
if command -v certbot &> /dev/null; then
    print_info "🔒 Setting up SSL certificate..."
    print_warning "Note: Make sure DNS record for $SUBDOMAIN.$DOMAIN points to this server"
    read -p "Do you want to get SSL certificate now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        sudo certbot --nginx -d "$SUBDOMAIN.$DOMAIN" --non-interactive --agree-tos --email admin@genvedha.com || {
            print_warning "SSL certificate setup failed. You can run it manually later:"
            print_info "sudo certbot --nginx -d $SUBDOMAIN.$DOMAIN"
        }
    else
        print_info "Skipping SSL setup. You can run it later:"
        print_info "sudo certbot --nginx -d $SUBDOMAIN.$DOMAIN"
    fi
else
    print_warning "Certbot not installed. Install it to enable HTTPS:"
    print_info "sudo apt install certbot python3-certbot-nginx"
fi

# Print deployment summary
echo ""
print_info "=========================================="
print_info "✅ Deployment Successful!"
print_info "=========================================="
print_info "App Name: $APP_FOLDER"
print_info "Subdomain: $SUBDOMAIN.$DOMAIN"
print_info "Port: $PORT"
print_info "PM2 Process: $SUBDOMAIN-backend"
print_info ""
print_info "🌐 Access your app at:"
print_info "   http://$SUBDOMAIN.$DOMAIN"
print_info ""
print_info "📊 Useful commands:"
print_info "   View logs: pm2 logs $SUBDOMAIN-backend"
print_info "   Restart: pm2 restart $SUBDOMAIN-backend"
print_info "   Stop: pm2 stop $SUBDOMAIN-backend"
print_info "   Delete: pm2 delete $SUBDOMAIN-backend"
print_info ""
print_info "🔍 Check status:"
print_info "   PM2: pm2 list"
print_info "   Nginx: sudo systemctl status nginx"
print_info ""
print_info "⚠️  Your main GenVedha site is still running normally!"
print_info "=========================================="
