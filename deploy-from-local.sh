#!/bin/bash

# Deploy to EC2 from Local Machine
# This script uploads the deployment script to EC2 and executes it

set -e

echo "🚀 Deploying AI E-commerce Service Page to EC2..."
echo "================================================"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# EC2 Configuration
EC2_USER="ubuntu"
EC2_HOST="genvedha.com"  # or use IP address
EC2_KEY="~/.ssh/your-key.pem"  # Update with your actual key path
PROJECT_DIR="/home/ubuntu/genvedha-website"

# Check if SSH key exists
if [ ! -f "$EC2_KEY" ]; then
    echo -e "${RED}❌ SSH key not found at: $EC2_KEY${NC}"
    echo -e "${YELLOW}Please update EC2_KEY variable in this script${NC}"
    exit 1
fi

echo -e "${YELLOW}📤 Uploading deployment script to EC2...${NC}"
scp -i "$EC2_KEY" deploy-to-ec2-server.sh ${EC2_USER}@${EC2_HOST}:${PROJECT_DIR}/

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Deployment script uploaded${NC}"
else
    echo -e "${RED}❌ Failed to upload deployment script${NC}"
    exit 1
fi

echo -e "${YELLOW}🔧 Making script executable...${NC}"
ssh -i "$EC2_KEY" ${EC2_USER}@${EC2_HOST} "chmod +x ${PROJECT_DIR}/deploy-to-ec2-server.sh"

echo -e "${YELLOW}🚀 Executing deployment on EC2...${NC}"
echo ""
ssh -i "$EC2_KEY" ${EC2_USER}@${EC2_HOST} "cd ${PROJECT_DIR} && ./deploy-to-ec2-server.sh"

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
    echo ""
    echo "🌐 Visit your website:"
    echo "  - https://genvedha.com"
    echo "  - https://genvedha.com/ai-ecommerce-solution"
else
    echo -e "${RED}❌ Deployment failed${NC}"
    exit 1
fi
