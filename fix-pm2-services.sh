#!/bin/bash

# Fix PM2 Services on EC2
# This script fixes errored PM2 services and ensures all services are running properly

set -e

echo "🔧 Fixing PM2 Services..."
echo "================================================"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check current PM2 status
echo -e "${YELLOW}📊 Current PM2 Status:${NC}"
pm2 list

echo ""
echo -e "${YELLOW}🛑 Stopping all errored services...${NC}"

# Delete errored genvedha-llm-service
echo -e "${YELLOW}Removing errored genvedha-llm-service...${NC}"
pm2 delete genvedha-llm-service || echo "Service not found or already deleted"

# Navigate to genvedha-llm-service directory
if [ -d "/home/ubuntu/genvedha-website/genvedha-llm-service" ]; then
    echo -e "${YELLOW}📂 Found genvedha-llm-service directory${NC}"
    
    # Check if .env file exists
    if [ ! -f "/home/ubuntu/genvedha-website/genvedha-llm-service/.env" ]; then
        echo -e "${RED}⚠️  .env file not found in genvedha-llm-service${NC}"
        echo -e "${YELLOW}Creating .env from .env.example...${NC}"
        
        if [ -f "/home/ubuntu/genvedha-website/genvedha-llm-service/.env.example" ]; then
            cp /home/ubuntu/genvedha-website/genvedha-llm-service/.env.example /home/ubuntu/genvedha-website/genvedha-llm-service/.env
            echo -e "${YELLOW}⚠️  Please update .env file with actual values${NC}"
        fi
    fi
    
    # Start genvedha-llm-service
    echo -e "${YELLOW}🚀 Starting genvedha-llm-service...${NC}"
    cd /home/ubuntu/genvedha-website/genvedha-llm-service
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}📦 Installing dependencies...${NC}"
        npm install
    fi
    
    # Start with PM2
    pm2 start server.js --name genvedha-llm-service --time
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ genvedha-llm-service started${NC}"
    else
        echo -e "${RED}❌ Failed to start genvedha-llm-service${NC}"
        echo -e "${YELLOW}This service may require additional configuration${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  genvedha-llm-service directory not found${NC}"
fi

# Ensure main website is running
echo ""
echo -e "${YELLOW}🌐 Checking main website service...${NC}"
cd /home/ubuntu/genvedha-website

if pm2 list | grep -q "genvedha-website"; then
    echo -e "${GREEN}✅ genvedha-website is already running${NC}"
    echo -e "${YELLOW}Restarting to ensure latest changes...${NC}"
    pm2 restart genvedha-website
else
    echo -e "${YELLOW}🚀 Starting genvedha-website...${NC}"
    pm2 start server.js --name genvedha-website --time
fi

# Save PM2 configuration
echo ""
echo -e "${YELLOW}💾 Saving PM2 configuration...${NC}"
pm2 save

# Setup PM2 startup script
echo -e "${YELLOW}⚙️  Setting up PM2 startup script...${NC}"
pm2 startup systemd -u ubuntu --hp /home/ubuntu

echo ""
echo "================================================"
echo -e "${GREEN}🎉 PM2 Services Fixed!${NC}"
echo ""
echo -e "${YELLOW}📊 Current Status:${NC}"
pm2 list

echo ""
echo -e "${YELLOW}📝 Useful PM2 Commands:${NC}"
echo "  - View logs: pm2 logs"
echo "  - View specific service: pm2 logs genvedha-website"
echo "  - Restart service: pm2 restart genvedha-website"
echo "  - Stop service: pm2 stop genvedha-website"
echo "  - Monitor: pm2 monit"
echo ""
echo "================================================"
