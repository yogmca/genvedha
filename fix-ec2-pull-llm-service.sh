#!/bin/bash

# Fix EC2 Pull Issue and Deploy LLM Service
# This script stashes local changes, pulls latest code, and sets up the LLM service

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  EC2 LLM Service Deployment Fix${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Step 1: Check current directory
echo -e "${YELLOW}Step 1: Checking current directory...${NC}"
if [ ! -f "server.js" ]; then
    echo -e "${RED}Error: Not in genvedha-website directory${NC}"
    echo "Please run: cd ~/genvedha-website"
    exit 1
fi
echo -e "${GREEN}✓ In correct directory${NC}"
echo ""

# Step 2: Show current git status
echo -e "${YELLOW}Step 2: Current git status...${NC}"
git status
echo ""

# Step 3: Stash local changes
echo -e "${YELLOW}Step 3: Stashing local changes...${NC}"
git stash save "Local changes before LLM service deployment - $(date +%Y%m%d_%H%M%S)"
echo -e "${GREEN}✓ Local changes stashed${NC}"
echo ""

# Step 4: Pull latest code
echo -e "${YELLOW}Step 4: Pulling latest code from production...${NC}"
git pull origin production
echo -e "${GREEN}✓ Code pulled successfully${NC}"
echo ""

# Step 5: Verify LLM service exists
echo -e "${YELLOW}Step 5: Verifying LLM service...${NC}"
if [ -d "genvedha-llm-service" ]; then
    echo -e "${GREEN}✓ LLM service directory found${NC}"
    ls -la genvedha-llm-service/ | head -10
else
    echo -e "${RED}✗ LLM service directory not found${NC}"
    exit 1
fi
echo ""

# Step 6: Install dependencies
echo -e "${YELLOW}Step 6: Installing dependencies...${NC}"
echo "Installing main project dependencies..."
npm install
echo ""
echo "Installing LLM service dependencies..."
cd genvedha-llm-service
npm install
cd ..
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# Step 7: Check environment variables
echo -e "${YELLOW}Step 7: Checking environment variables...${NC}"
if [ -f ".env" ]; then
    echo -e "${GREEN}✓ .env file exists${NC}"
    
    # Check for LLM service variables
    if grep -q "CLAUDE_API_KEY" .env; then
        echo -e "${GREEN}✓ CLAUDE_API_KEY found${NC}"
    else
        echo -e "${YELLOW}⚠ CLAUDE_API_KEY not found in .env${NC}"
        echo -e "${YELLOW}  Please add: CLAUDE_API_KEY=your_key_here${NC}"
    fi
    
    if grep -q "GENVEDHA_SERVICE_PORT" .env; then
        echo -e "${GREEN}✓ GENVEDHA_SERVICE_PORT found${NC}"
    else
        echo -e "${YELLOW}⚠ GENVEDHA_SERVICE_PORT not found${NC}"
        echo -e "${YELLOW}  Adding default configuration...${NC}"
        cat >> .env << 'EOF'

# GenVedha LLM Service Configuration
CLAUDE_API_KEY=your_claude_api_key_here
CLAUDE_MODEL=claude-3-5-sonnet-20241022
GENVEDHA_SERVICE_PORT=3001
ENABLE_GENVEDHA_SERVICE=true
GENVEDHA_API_KEY=your_genvedha_api_key_here
EOF
        echo -e "${GREEN}✓ LLM service config added to .env${NC}"
        echo -e "${YELLOW}  Please edit .env and add your actual Claude API key${NC}"
    fi
else
    echo -e "${RED}✗ .env file not found${NC}"
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo -e "${YELLOW}  Please edit .env with your configuration${NC}"
fi
echo ""

# Step 8: Stop existing PM2 processes
echo -e "${YELLOW}Step 8: Managing PM2 processes...${NC}"
if command -v pm2 &> /dev/null; then
    echo "Stopping existing processes..."
    pm2 stop all || true
    echo -e "${GREEN}✓ Processes stopped${NC}"
else
    echo -e "${YELLOW}⚠ PM2 not found, skipping process management${NC}"
fi
echo ""

# Step 9: Start services
echo -e "${YELLOW}Step 9: Starting services...${NC}"
if command -v pm2 &> /dev/null; then
    # Start main website
    echo "Starting main website..."
    pm2 start server.js --name genvedha-website || pm2 restart genvedha-website
    
    # Start LLM service
    echo "Starting LLM service..."
    pm2 start genvedha-llm-service/index.js --name genvedha-llm-service || pm2 restart genvedha-llm-service
    
    # Save PM2 configuration
    pm2 save
    
    echo -e "${GREEN}✓ Services started${NC}"
    echo ""
    
    # Show status
    echo -e "${YELLOW}PM2 Status:${NC}"
    pm2 status
else
    echo -e "${YELLOW}⚠ PM2 not installed. Starting manually...${NC}"
    echo "To start manually:"
    echo "  node server.js &"
    echo "  node genvedha-llm-service/index.js &"
fi
echo ""

# Step 10: Verify services
echo -e "${YELLOW}Step 10: Verifying services...${NC}"
sleep 3

# Check main website
if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Main website is running (port 3000)${NC}"
else
    echo -e "${YELLOW}⚠ Main website health check failed${NC}"
fi

# Check LLM service
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ LLM service is running (port 3001)${NC}"
else
    echo -e "${YELLOW}⚠ LLM service health check failed${NC}"
    echo -e "${YELLOW}  Make sure CLAUDE_API_KEY is set in .env${NC}"
fi
echo ""

# Summary
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Deployment Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${GREEN}✓ Code pulled from production branch${NC}"
echo -e "${GREEN}✓ LLM service deployed${NC}"
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo -e "${GREEN}✓ Services started${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Edit .env and add your Claude API key:"
echo "   nano .env"
echo ""
echo "2. Restart LLM service after adding API key:"
echo "   pm2 restart genvedha-llm-service"
echo ""
echo "3. Check logs:"
echo "   pm2 logs genvedha-llm-service"
echo ""
echo "4. Test Genvedha Guru:"
echo "   https://genvedha.com/genvedha-guru.html"
echo ""
echo -e "${GREEN}Deployment complete!${NC}"
