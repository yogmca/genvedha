#!/bin/bash

# ============================================================================
# SSH AND FIX - Connect to server and run recovery
# ============================================================================
# Instance is RUNNING but app is not responding
# This script will SSH and fix the issue
# ============================================================================

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
SERVER_IP="3.11.178.44"
SERVER_USER="ubuntu"
KEY_FILE="$HOME/.ssh/genvedha-key.pem"  # Update this path!
PROJECT_DIR="/home/ubuntu/genvedha-website"

echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}SSH AND FIX - GENVEDHA.COM${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo ""

echo -e "${YELLOW}⚠️  IMPORTANT: Update KEY_FILE path in this script before running!${NC}"
echo -e "${YELLOW}   Current: $KEY_FILE${NC}"
echo ""
echo -e "${BLUE}Server: $SERVER_USER@$SERVER_IP${NC}"
echo ""

# Check if key file exists
if [ ! -f "$KEY_FILE" ]; then
    echo -e "${RED}❌ Key file not found: $KEY_FILE${NC}"
    echo ""
    echo "Please update the KEY_FILE variable in this script with your actual key path."
    echo "Common locations:"
    echo "  - ~/.ssh/id_rsa"
    echo "  - ~/.ssh/genvedha.pem"
    echo "  - ~/Downloads/your-key.pem"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ Key file found${NC}"
echo ""

# Test SSH connection
echo -e "${BLUE}Testing SSH connection...${NC}"
if ssh -i "$KEY_FILE" -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" "echo 'Connection successful'" 2>/dev/null; then
    echo -e "${GREEN}✅ SSH connection successful${NC}"
else
    echo -e "${RED}❌ Cannot connect via SSH${NC}"
    echo ""
    echo "Possible issues:"
    echo "1. Wrong key file"
    echo "2. Security group doesn't allow SSH from your IP"
    echo "3. Key permissions are wrong (should be 600)"
    echo ""
    echo "Try fixing key permissions:"
    echo "  chmod 600 $KEY_FILE"
    echo ""
    echo "Or try connecting manually:"
    echo "  ssh -i $KEY_FILE $SERVER_USER@$SERVER_IP"
    echo ""
    exit 1
fi

echo ""
echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}Running diagnostics and recovery on server...${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo ""

# SSH and run commands
ssh -i "$KEY_FILE" -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" << 'ENDSSH'

# Colors for remote session
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Connected to server!${NC}"
echo ""

# Check system
echo -e "${BLUE}=== System Status ===${NC}"
echo "Uptime: $(uptime)"
echo "Memory: $(free -h | grep Mem | awk '{print $3 "/" $2}')"
echo "Disk: $(df -h / | tail -1 | awk '{print $3 "/" $2 " (" $5 " used)"}')"
echo ""

# Check if project exists
if [ ! -d "/home/ubuntu/genvedha-website" ]; then
    echo -e "${RED}❌ Project directory not found!${NC}"
    echo "Creating directory and cloning repository..."
    cd /home/ubuntu
    # You'll need to add your repo URL here
    echo -e "${YELLOW}Please clone your repository manually:${NC}"
    echo "  cd /home/ubuntu"
    echo "  git clone <your-repo-url> genvedha-website"
    exit 1
fi

cd /home/ubuntu/genvedha-website

echo -e "${BLUE}=== Checking Services ===${NC}"

# Check Node.js
if command -v node &> /dev/null; then
    echo -e "${GREEN}✅ Node.js: $(node --version)${NC}"
else
    echo -e "${RED}❌ Node.js not installed${NC}"
fi

# Check PM2
if command -v pm2 &> /dev/null; then
    echo -e "${GREEN}✅ PM2: $(pm2 --version)${NC}"
else
    echo -e "${RED}❌ PM2 not installed${NC}"
fi

# Check Nginx
if command -v nginx &> /dev/null; then
    if sudo systemctl is-active --quiet nginx; then
        echo -e "${GREEN}✅ Nginx: Running${NC}"
    else
        echo -e "${YELLOW}⚠️  Nginx: Installed but not running${NC}"
    fi
else
    echo -e "${RED}❌ Nginx not installed${NC}"
fi

echo ""
echo -e "${BLUE}=== PM2 Status ===${NC}"
pm2 status || echo -e "${YELLOW}No PM2 processes${NC}"

echo ""
echo -e "${BLUE}=== Checking Ports ===${NC}"
sudo netstat -tlnp | grep -E ":(22|80|443|3000) " || echo "No services listening"

echo ""
echo -e "${BLUE}=== Recent Logs ===${NC}"
if pm2 list | grep -q "genvedha"; then
    pm2 logs genvedha --lines 20 --nostream 2>/dev/null || echo "No logs available"
else
    echo "No PM2 app named 'genvedha' found"
fi

echo ""
echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}Running Emergency Recovery Script${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo ""

# Check if recovery script exists
if [ -f "emergency-server-recovery.sh" ]; then
    echo -e "${GREEN}✅ Recovery script found${NC}"
    echo "Running recovery script..."
    echo ""
    sudo bash emergency-server-recovery.sh
else
    echo -e "${YELLOW}⚠️  Recovery script not found, pulling from git...${NC}"
    git pull origin production || git pull origin main || echo "Could not pull from git"
    
    if [ -f "emergency-server-recovery.sh" ]; then
        echo "Running recovery script..."
        sudo bash emergency-server-recovery.sh
    else
        echo -e "${RED}❌ Recovery script still not found${NC}"
        echo "Running manual recovery..."
        
        # Manual recovery steps
        echo "Installing dependencies..."
        npm install --production
        
        echo "Stopping old processes..."
        pm2 stop all 2>/dev/null || true
        pm2 delete all 2>/dev/null || true
        
        echo "Starting application..."
        pm2 start server.js --name genvedha
        pm2 save
        
        echo "Application started!"
        pm2 status
    fi
fi

echo ""
echo -e "${GREEN}============================================================================${NC}"
echo -e "${GREEN}Recovery Complete!${NC}"
echo -e "${GREEN}============================================================================${NC}"
echo ""

echo "Testing application..."
sleep 3

if curl -s http://localhost:3000 > /dev/null; then
    echo -e "${GREEN}✅ Application is responding on port 3000!${NC}"
else
    echo -e "${RED}❌ Application is not responding${NC}"
    echo "Check logs: pm2 logs genvedha"
fi

echo ""
echo "Final status:"
pm2 status

ENDSSH

echo ""
echo -e "${GREEN}============================================================================${NC}"
echo -e "${GREEN}Remote execution completed!${NC}"
echo -e "${GREEN}============================================================================${NC}"
echo ""

echo "Testing from your machine..."
sleep 2

if curl -s http://$SERVER_IP:3000 > /dev/null; then
    echo -e "${GREEN}✅ Server is accessible from your machine!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Test in browser: http://$SERVER_IP:3000"
    echo "2. Test domain: http://genvedha.com"
    echo "3. Setup SSL: ssh -i $KEY_FILE $SERVER_USER@$SERVER_IP 'cd genvedha-website && sudo ./fix-site-down-ssl.sh'"
else
    echo -e "${YELLOW}⚠️  Server is not accessible from your machine${NC}"
    echo ""
    echo "This might be because:"
    echo "1. AWS Security Group doesn't allow port 3000 from your IP"
    echo "2. Application is not running"
    echo ""
    echo "Check AWS Security Group:"
    echo "https://console.aws.amazon.com/ec2/v2/home#SecurityGroups:group-id=sg-01b24f42694bc45f6"
fi

echo ""
