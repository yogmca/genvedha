#!/bin/bash

# Fix AWS Security Group - Add HTTP and HTTPS ports
# This is the root cause of your 403 errors

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}AWS Security Group Fix${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Get instance metadata
INSTANCE_ID=$(curl -s http://169.254.169.254/latest/meta-data/instance-id)
REGION=$(curl -s http://169.254.169.254/latest/meta-data/placement/region)

echo -e "${YELLOW}Instance ID: $INSTANCE_ID${NC}"
echo -e "${YELLOW}Region: $REGION${NC}"
echo ""

# Get security group ID
SG_ID=$(aws ec2 describe-instances \
    --instance-ids $INSTANCE_ID \
    --region $REGION \
    --query 'Reservations[0].Instances[0].SecurityGroups[0].GroupId' \
    --output text 2>/dev/null)

if [ -z "$SG_ID" ] || [ "$SG_ID" = "None" ]; then
    echo -e "${RED}Could not automatically detect Security Group${NC}"
    echo -e "${YELLOW}Your Security Group ID: sg-01b24f42694bc45f6${NC}"
    echo ""
    echo -e "${YELLOW}Please add these rules manually in AWS Console:${NC}"
    echo ""
    echo "1. Go to: https://console.aws.amazon.com/ec2/v2/home#SecurityGroups:"
    echo "2. Find Security Group: launch-wizard-1 (sg-01b24f42694bc45f6)"
    echo "3. Click 'Edit inbound rules'"
    echo "4. Add these rules:"
    echo ""
    echo "   Rule 1:"
    echo "   - Type: HTTP"
    echo "   - Protocol: TCP"
    echo "   - Port: 80"
    echo "   - Source: 0.0.0.0/0"
    echo "   - Description: Allow HTTP from anywhere"
    echo ""
    echo "   Rule 2:"
    echo "   - Type: HTTPS"
    echo "   - Protocol: TCP"
    echo "   - Port: 443"
    echo "   - Source: 0.0.0.0/0"
    echo "   - Description: Allow HTTPS from anywhere"
    echo ""
    echo "5. Click 'Save rules'"
    echo ""
    echo -e "${GREEN}After adding these rules, run: sudo ./fix-ssl-aggressive.sh${NC}"
    exit 0
fi

echo -e "${YELLOW}Security Group ID: $SG_ID${NC}"
echo ""

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &>/dev/null; then
    echo -e "${RED}AWS CLI is not configured${NC}"
    echo ""
    echo -e "${YELLOW}Manual fix required:${NC}"
    echo "1. Go to AWS Console: https://console.aws.amazon.com/ec2/v2/home#SecurityGroups:"
    echo "2. Find Security Group: $SG_ID"
    echo "3. Add inbound rules for ports 80 and 443 (see above)"
    exit 0
fi

# Add HTTP rule
echo -e "${YELLOW}Adding HTTP (port 80) rule...${NC}"
aws ec2 authorize-security-group-ingress \
    --group-id $SG_ID \
    --protocol tcp \
    --port 80 \
    --cidr 0.0.0.0/0 \
    --region $REGION 2>/dev/null

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ HTTP rule added${NC}"
else
    echo -e "${YELLOW}⚠ HTTP rule may already exist or failed to add${NC}"
fi

# Add HTTPS rule
echo -e "${YELLOW}Adding HTTPS (port 443) rule...${NC}"
aws ec2 authorize-security-group-ingress \
    --group-id $SG_ID \
    --protocol tcp \
    --port 443 \
    --cidr 0.0.0.0/0 \
    --region $REGION 2>/dev/null

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ HTTPS rule added${NC}"
else
    echo -e "${YELLOW}⚠ HTTPS rule may already exist or failed to add${NC}"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Security Group Updated!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}Current inbound rules:${NC}"
aws ec2 describe-security-groups \
    --group-ids $SG_ID \
    --region $REGION \
    --query 'SecurityGroups[0].IpPermissions[*].[IpProtocol,FromPort,ToPort,IpRanges[0].CidrIp]' \
    --output table

echo ""
echo -e "${GREEN}Next step: Run the SSL setup script${NC}"
echo -e "${GREEN}sudo ./fix-ssl-aggressive.sh${NC}"
