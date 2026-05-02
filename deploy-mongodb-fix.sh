#!/bin/bash

# Deploy MongoDB Fix to EC2 Server
# This script pulls the latest changes and restarts the application

echo "🚀 Deploying MongoDB fix to EC2 server..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "server.js" ]; then
    echo -e "${RED}❌ Error: server.js not found. Please run this script from the project root directory.${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 This script will:${NC}"
echo "  1. Connect to your EC2 server"
echo "  2. Pull the latest code from GitHub"
echo "  3. Restart the PM2 application"
echo "  4. Show the application logs"
echo ""

# Prompt for EC2 details
read -p "Enter your EC2 IP address or hostname: " EC2_HOST
read -p "Enter your SSH key path (e.g., ~/.ssh/your-key.pem): " SSH_KEY
read -p "Enter SSH user (default: ubuntu): " SSH_USER
SSH_USER=${SSH_USER:-ubuntu}

echo ""
echo -e "${GREEN}🔌 Connecting to EC2 server...${NC}"

# SSH into server and execute commands
ssh -i "$SSH_KEY" "$SSH_USER@$EC2_HOST" << 'ENDSSH'
    echo "✅ Connected to EC2 server"
    echo ""
    
    # Navigate to project directory
    cd ~/genvedha-website || { echo "❌ Project directory not found"; exit 1; }
    echo "📂 Current directory: $(pwd)"
    echo ""
    
    # Pull latest changes
    echo "📥 Pulling latest changes from GitHub..."
    git pull origin production
    echo ""
    
    # Check PM2 status before restart
    echo "📊 Current PM2 status:"
    pm2 status
    echo ""
    
    # Restart PM2 application
    echo "🔄 Restarting application..."
    pm2 restart genvedha-website
    echo ""
    
    # Wait a moment for app to start
    sleep 2
    
    # Show updated status
    echo "📊 Updated PM2 status:"
    pm2 status
    echo ""
    
    # Show recent logs
    echo "📋 Recent application logs:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    pm2 logs genvedha-website --lines 30 --nostream
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    echo "✅ Deployment complete!"
    echo ""
    echo "🔍 To view live logs, run:"
    echo "   pm2 logs genvedha-website"
    echo ""
    echo "🌐 Test your contact form at: https://genvedha.com"
ENDSSH

echo ""
echo -e "${GREEN}✅ Deployment script completed!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Test the contact form at https://genvedha.com"
echo "  2. Check your email at support@genvedha.com"
echo "  3. Review the logs above for any errors"
echo ""
echo -e "${YELLOW}Expected behavior:${NC}"
echo "  ✅ Email should be sent successfully"
echo "  ⚠️  MongoDB error may still appear (but form works)"
echo "  ✅ User receives success message"
echo ""
