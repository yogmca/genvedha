#!/bin/bash

# Deployment script for Genvedha Website on AWS EC2 with HTTPS
# This script pulls the latest code and deploys the application with SSL

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="${APP_DIR:-$HOME/genvedha-website}"
GIT_REPO="https://github.com/yogmca/genvedha.git"
GIT_BRANCH="production"
NODE_VERSION="18"
PM2_APP_NAME="genvedha-website"
DOMAIN_NAME="${DOMAIN_NAME:-example.com}"  # Set via environment variable or update here
EMAIL="${SSL_EMAIL:-admin@example.com}"     # Set via environment variable or update here

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Genvedha Website Deployment Script${NC}"
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

# Check if running with sudo for system operations
check_sudo() {
    if [ "$EUID" -ne 0 ]; then 
        print_error "Please run with sudo for initial setup"
        exit 1
    fi
}

# Check if application directory exists, if not clone it
if [ ! -d "$APP_DIR" ]; then
    print_message "Application directory does not exist. Cloning repository..."
    git clone -b "$GIT_BRANCH" "$GIT_REPO" "$APP_DIR"
    cd "$APP_DIR"
    print_message "Repository cloned successfully"
else
    cd "$APP_DIR"
    print_message "Changed to directory: $APP_DIR"
fi

# Backup current .env file if it exists
if [ -f ".env" ]; then
    print_message "Backing up .env file..."
    cp .env .env.backup
fi

# Pull latest code from git
print_message "Pulling latest code from GitHub (genvedha/production)..."
git fetch origin

# Check if production branch exists, otherwise use main/master
if git show-ref --verify --quiet refs/heads/production; then
    print_message "Pulling from production branch..."
    git pull origin production
elif git show-ref --verify --quiet refs/remotes/origin/production; then
    print_message "Checking out production branch..."
    git checkout production
    git pull origin production
elif git show-ref --verify --quiet refs/heads/main; then
    print_message "Pulling from main branch..."
    git pull origin main
else
    print_message "Pulling from master branch..."
    git pull origin master
fi

# Display current commit
print_message "Current commit: $(git log -1 --oneline)"

# Restore .env file
if [ -f ".env.backup" ]; then
    print_message "Restoring .env file..."
    mv .env.backup .env
fi

# Install/Update Node.js dependencies (including devDependencies for build)
print_message "Installing Node.js dependencies..."
if [ -f "package-lock.json" ]; then
    npm ci --include=dev
else
    npm install
fi

# Build the application
print_message "Building the application..."
if npm run build; then
    print_message "Build completed successfully"
else
    print_warning "Build failed or not required"
fi

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    print_warning "PM2 is not installed. Installing PM2 globally..."
    npm install -g pm2
fi

# Stop the application if it's running
print_message "Checking if application is running..."
if pm2 list | grep -q "$PM2_APP_NAME"; then
    print_message "Stopping existing application..."
    pm2 stop "$PM2_APP_NAME"
    pm2 delete "$PM2_APP_NAME"
fi

# Start the application with PM2
print_message "Starting application with PM2..."
pm2 start server.js --name "$PM2_APP_NAME" --time

# Save PM2 process list
print_message "Saving PM2 process list..."
pm2 save

# Setup PM2 to start on system boot
print_message "Setting up PM2 startup script..."
pm2 startup systemd -u ec2-user --hp /home/ec2-user || true

# Display application status
print_message "Application status:"
pm2 status

# Health check
print_message "Performing health check..."
sleep 5

if pm2 list | grep -q "$PM2_APP_NAME.*online"; then
    print_message "${GREEN}✓ Application deployment successful!${NC}"
    print_message "Application is running on port 3000"
else
    print_error "Deployment failed! Application is not running."
    print_error "Check logs with: pm2 logs $PM2_APP_NAME"
    exit 1
fi

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "${YELLOW}Note: Run setup-https.sh to configure HTTPS${NC}"
