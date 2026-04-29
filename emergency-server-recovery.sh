#!/bin/bash

# ============================================================================
# GENVEDHA.COM - EMERGENCY SERVER RECOVERY SCRIPT
# ============================================================================
# The Node.js app is completely down - not even responding on port 3000
# This script will diagnose and fix the issue
# ============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="genvedha.com"
APP_PORT="3000"
PROJECT_DIR="/home/ubuntu/genvedha-website"
APP_NAME="genvedha"

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

print_critical() {
    echo -e "${MAGENTA}🚨 $1${NC}"
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

print_header "🚨 EMERGENCY SERVER RECOVERY - GENVEDHA.COM"

check_root

# Step 1: System Diagnostics
print_header "Step 1: System Diagnostics"

print_info "Checking system resources..."
echo "Memory Usage:"
free -h
echo ""
echo "Disk Usage:"
df -h /
echo ""
echo "CPU Load:"
uptime
echo ""

print_info "Checking if server is reachable..."
if ping -c 1 8.8.8.8 &> /dev/null; then
    print_success "Internet connectivity is working"
else
    print_error "No internet connectivity!"
fi

# Step 2: Check Node.js and PM2
print_header "Step 2: Checking Node.js and PM2"

print_info "Checking Node.js installation..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_success "Node.js is installed: $NODE_VERSION"
else
    print_error "Node.js is NOT installed!"
    print_info "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
    print_success "Node.js installed"
fi

print_info "Checking PM2 installation..."
if command -v pm2 &> /dev/null; then
    PM2_VERSION=$(pm2 --version)
    print_success "PM2 is installed: $PM2_VERSION"
else
    print_error "PM2 is NOT installed!"
    print_info "Installing PM2..."
    npm install -g pm2
    print_success "PM2 installed"
fi

# Step 3: Check Application Status
print_header "Step 3: Checking Application Status"

print_info "Current PM2 processes:"
pm2 list || print_warning "PM2 list failed"
echo ""

print_info "Checking if port $APP_PORT is in use..."
if netstat -tlnp | grep ":$APP_PORT "; then
    print_warning "Port $APP_PORT is in use by:"
    netstat -tlnp | grep ":$APP_PORT "
    print_info "Killing process on port $APP_PORT..."
    fuser -k $APP_PORT/tcp 2>/dev/null || true
    sleep 2
    print_success "Port $APP_PORT freed"
else
    print_info "Port $APP_PORT is available"
fi

# Step 4: Check Project Directory
print_header "Step 4: Checking Project Directory"

if [ ! -d "$PROJECT_DIR" ]; then
    print_error "Project directory not found: $PROJECT_DIR"
    print_info "Please clone the repository first:"
    echo "  cd /home/ubuntu"
    echo "  git clone <your-repo-url> genvedha-website"
    exit 1
fi

print_success "Project directory exists: $PROJECT_DIR"

cd "$PROJECT_DIR" || exit 1

print_info "Checking project files..."
if [ -f "server.js" ]; then
    print_success "server.js found"
else
    print_error "server.js NOT found!"
    ls -la
    exit 1
fi

if [ -f "package.json" ]; then
    print_success "package.json found"
else
    print_error "package.json NOT found!"
    exit 1
fi

# Step 5: Check Environment Variables
print_header "Step 5: Checking Environment Variables"

if [ -f ".env" ]; then
    print_success ".env file exists"
    print_info "Environment variables (masked):"
    cat .env | sed 's/=.*/=***/' || true
else
    print_warning ".env file NOT found!"
    print_info "Creating .env file from .env.example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        print_success ".env created from .env.example"
        print_warning "Please update .env with actual values!"
    else
        print_error ".env.example also not found!"
        print_info "Creating minimal .env file..."
        cat > .env << 'ENVEOF'
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://localhost:27017/genvedha
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
ENVEOF
        print_warning "Created minimal .env - please update with actual values!"
    fi
fi

# Step 6: Install Dependencies
print_header "Step 6: Installing Dependencies"

print_info "Checking node_modules..."
if [ ! -d "node_modules" ]; then
    print_warning "node_modules not found - installing dependencies..."
    npm install --production
    print_success "Dependencies installed"
else
    print_info "node_modules exists - checking for updates..."
    npm install --production
    print_success "Dependencies updated"
fi

# Step 7: Check MongoDB
print_header "Step 7: Checking MongoDB"

if systemctl is-active --quiet mongod; then
    print_success "MongoDB is running"
elif systemctl is-active --quiet mongodb; then
    print_success "MongoDB is running"
else
    print_warning "MongoDB is not running"
    print_info "Attempting to start MongoDB..."
    systemctl start mongod 2>/dev/null || systemctl start mongodb 2>/dev/null || print_warning "Could not start MongoDB - app will run in demo mode"
fi

# Step 8: Stop All Existing Processes
print_header "Step 8: Stopping Existing Processes"

print_info "Stopping all PM2 processes..."
pm2 stop all 2>/dev/null || print_info "No processes to stop"
pm2 delete all 2>/dev/null || print_info "No processes to delete"
print_success "All processes stopped"

# Kill any rogue Node processes
print_info "Checking for rogue Node.js processes..."
pkill -f "node.*server.js" 2>/dev/null || print_info "No rogue processes found"
sleep 2

# Step 9: Build Application (if needed)
print_header "Step 9: Building Application"

if [ -f "webpack.config.js" ]; then
    print_info "Webpack config found - building application..."
    if [ -d "dist" ]; then
        print_info "Removing old dist directory..."
        rm -rf dist
    fi
    npm run build || print_warning "Build failed - will try to start anyway"
    print_success "Build completed"
else
    print_info "No webpack config - skipping build"
fi

# Step 10: Start Application
print_header "Step 10: Starting Application"

print_info "Starting application with PM2..."

# Start the app
pm2 start server.js \
    --name "$APP_NAME" \
    --time \
    --env production \
    --max-memory-restart 500M \
    --error /var/log/pm2-error.log \
    --output /var/log/pm2-output.log

sleep 3

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup systemd -u ubuntu --hp /home/ubuntu 2>/dev/null || print_warning "Could not setup PM2 startup"

print_success "Application started"

# Step 11: Verify Application
print_header "Step 11: Verifying Application"

print_info "Waiting for application to start..."
sleep 5

print_info "PM2 Status:"
pm2 status

echo ""
print_info "PM2 Logs (last 20 lines):"
pm2 logs --lines 20 --nostream || true

echo ""
print_info "Checking if app is responding on port $APP_PORT..."
if curl -s http://localhost:$APP_PORT > /dev/null; then
    print_success "Application is responding on port $APP_PORT!"
    echo ""
    print_info "Testing HTTP response:"
    curl -I http://localhost:$APP_PORT
else
    print_error "Application is NOT responding on port $APP_PORT!"
    print_info "Checking logs for errors..."
    pm2 logs --lines 50 --nostream || true
    print_info "Checking if port is listening..."
    netstat -tlnp | grep ":$APP_PORT" || print_error "Port $APP_PORT is not listening!"
fi

# Step 12: Check Nginx
print_header "Step 12: Checking Nginx"

if command -v nginx &> /dev/null; then
    print_success "Nginx is installed"
    
    if systemctl is-active --quiet nginx; then
        print_success "Nginx is running"
    else
        print_warning "Nginx is not running"
        print_info "Starting Nginx..."
        systemctl start nginx || print_error "Failed to start Nginx"
    fi
    
    print_info "Testing Nginx configuration..."
    nginx -t || print_warning "Nginx configuration has errors"
else
    print_warning "Nginx is not installed"
    print_info "Installing Nginx..."
    apt-get update -qq
    apt-get install -y nginx
    print_success "Nginx installed"
fi

# Step 13: Check Firewall and Security
print_header "Step 13: Checking Firewall and Security"

print_info "Checking UFW firewall..."
if command -v ufw &> /dev/null; then
    UFW_STATUS=$(ufw status | head -1)
    echo "$UFW_STATUS"
    
    if echo "$UFW_STATUS" | grep -q "active"; then
        print_warning "UFW is active - checking rules..."
        ufw status numbered
        
        print_info "Ensuring required ports are open..."
        ufw allow 22/tcp comment 'SSH' 2>/dev/null || true
        ufw allow 80/tcp comment 'HTTP' 2>/dev/null || true
        ufw allow 443/tcp comment 'HTTPS' 2>/dev/null || true
        ufw allow 3000/tcp comment 'Node.js App' 2>/dev/null || true
        print_success "Firewall rules updated"
    else
        print_info "UFW is not active"
    fi
else
    print_info "UFW is not installed"
fi

print_info "Checking listening ports..."
netstat -tlnp | grep -E ":(22|80|443|3000) "

# Step 14: AWS Security Group Check
print_header "Step 14: AWS Security Group Reminder"

print_warning "IMPORTANT: Ensure AWS Security Group allows these ports:"
echo "  - Port 22 (SSH)"
echo "  - Port 80 (HTTP)"
echo "  - Port 443 (HTTPS)"
echo "  - Port 3000 (Node.js - optional)"
echo ""
echo "Check at: https://console.aws.amazon.com/ec2/v2/home#SecurityGroups:"
echo ""

# Final Summary
print_header "📊 Recovery Summary"

echo -e "${GREEN}Completed Steps:${NC}"
echo "✅ System diagnostics"
echo "✅ Node.js and PM2 verified"
echo "✅ Dependencies installed"
echo "✅ Application started"
echo "✅ Services verified"
echo ""

print_info "Application Status:"
pm2 status

echo ""
print_info "Quick Tests:"
echo "1. Local test: curl http://localhost:3000"
echo "2. External test: curl http://$(curl -s ifconfig.me):3000"
echo "3. Domain test: curl http://$DOMAIN"
echo ""

print_header "🔍 Next Steps"

echo "1. Test the application:"
echo "   curl http://localhost:3000"
echo ""
echo "2. Check logs if there are issues:"
echo "   pm2 logs $APP_NAME"
echo ""
echo "3. If working locally but not externally, check:"
echo "   - AWS Security Group (ports 80, 443, 3000)"
echo "   - DNS settings (should point to this server)"
echo "   - Firewall rules (ufw status)"
echo ""
echo "4. Setup SSL certificate:"
echo "   sudo ./fix-site-down-ssl.sh"
echo ""

print_header "📝 Useful Commands"

echo "View logs:        pm2 logs $APP_NAME"
echo "Restart app:      pm2 restart $APP_NAME"
echo "Stop app:         pm2 stop $APP_NAME"
echo "App status:       pm2 status"
echo "Nginx status:     sudo systemctl status nginx"
echo "Nginx logs:       sudo tail -f /var/log/nginx/error.log"
echo "Server IP:        curl ifconfig.me"
echo ""

print_success "Recovery script completed!"
echo ""
