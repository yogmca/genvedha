#!/bin/bash

# Fix MongoDB URI Script
# Converts the old SQL interface URI to proper MongoDB Atlas URI

echo "🔧 FIXING MONGODB CONNECTION"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ .env file not found${NC}"
    exit 1
fi

# Read current MongoDB credentials
MONGODB_USERNAME=$(grep "MONGODB_USERNAME=" .env | cut -d= -f2)
MONGODB_PASSWORD=$(grep "MONGODB_PASSWORD=" .env | cut -d= -f2)
MONGODB_DATABASE=$(grep "MONGODB_DATABASE=" .env | cut -d= -f2)

echo -e "${BLUE}Current MongoDB Configuration:${NC}"
echo "Username: $MONGODB_USERNAME"
echo "Database: $MONGODB_DATABASE"
echo ""

# Current URI (SQL interface - doesn't work with Node.js MongoDB driver)
CURRENT_URI=$(grep "MONGODB_URI=" .env | cut -d= -f2-)
echo -e "${YELLOW}Current URI (SQL interface):${NC}"
echo "$CURRENT_URI"
echo ""

# Construct proper MongoDB Atlas URI
# Format: mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
echo -e "${BLUE}Building proper MongoDB Atlas URI...${NC}"
echo ""

# Extract cluster information from the old URI
# Old format: mongodb://atlas-sql-69f06bb159aabca72961dac5-ew3cgx.a.query.mongodb.net/...
# We need to convert this to the proper cluster address

# Option 1: Ask user for their cluster address
echo -e "${YELLOW}⚠️  The current URI uses MongoDB's SQL interface which doesn't work with Node.js${NC}"
echo ""
echo "Please provide your MongoDB Atlas cluster address."
echo "You can find this in MongoDB Atlas:"
echo "  1. Go to https://cloud.mongodb.com"
echo "  2. Click 'Connect' on your cluster"
echo "  3. Choose 'Connect your application'"
echo "  4. Copy the connection string"
echo ""
echo "Example formats:"
echo "  - cluster0.xxxxx.mongodb.net"
echo "  - xxxxx.mongodb.net"
echo ""
read -p "Enter your MongoDB cluster address: " CLUSTER_ADDRESS

# Remove any protocol prefix if user included it
CLUSTER_ADDRESS=$(echo "$CLUSTER_ADDRESS" | sed 's|mongodb+srv://||' | sed 's|mongodb://||' | sed 's|/.*||')

# Build the new URI
NEW_URI="mongodb+srv://${MONGODB_USERNAME}:${MONGODB_PASSWORD}@${CLUSTER_ADDRESS}/${MONGODB_DATABASE}?retryWrites=true&w=majority"

echo ""
echo -e "${GREEN}New MongoDB URI:${NC}"
echo "$NEW_URI"
echo ""

# Backup .env file
cp .env .env.backup.$(date +%Y%m%d-%H%M%S)
echo -e "${GREEN}✅ Backed up .env file${NC}"

# Update MONGODB_URI in .env
sed -i.tmp "s|MONGODB_URI=.*|MONGODB_URI=$NEW_URI|g" .env
rm -f .env.tmp

echo -e "${GREEN}✅ Updated MONGODB_URI in .env${NC}"
echo ""

# Show the updated .env (without sensitive data)
echo -e "${BLUE}Updated .env file (sensitive data hidden):${NC}"
cat .env | sed "s/${MONGODB_PASSWORD}/***HIDDEN***/g"
echo ""

# Restart the application
echo -e "${BLUE}Restarting application...${NC}"

# Stop all PM2 processes
pm2 stop all
pm2 delete all

# Kill any process on port 3000
PORT_PID=$(lsof -ti:3000 2>/dev/null)
if [ -n "$PORT_PID" ]; then
    echo "Killing process on port 3000..."
    kill -9 $PORT_PID 2>/dev/null
fi

# Start the application
pm2 start server.js --name genvedha

# Wait for startup
sleep 5

# Check status
echo ""
echo -e "${BLUE}Application Status:${NC}"
pm2 status

echo ""
echo -e "${BLUE}Checking MongoDB connection...${NC}"
sleep 2

# Check logs for MongoDB connection
if pm2 logs genvedha --nostream --lines 50 | grep -q "Connected to MongoDB"; then
    echo -e "${GREEN}✅ MongoDB connection successful!${NC}"
else
    echo -e "${RED}❌ MongoDB connection failed${NC}"
    echo ""
    echo "Recent logs:"
    pm2 logs genvedha --nostream --lines 20
    echo ""
    echo -e "${YELLOW}Troubleshooting:${NC}"
    echo "1. Verify your cluster address is correct"
    echo "2. Check MongoDB Atlas network access (allow your IP)"
    echo "3. Verify database user credentials"
    echo "4. Check logs: pm2 logs genvedha"
fi

# Save PM2 configuration
pm2 save

echo ""
echo "=================================="
echo -e "${GREEN}✅ FIX COMPLETE${NC}"
echo "=================================="
echo ""
echo "Next steps:"
echo "1. Test the application: curl http://localhost:3000"
echo "2. Check logs: pm2 logs genvedha"
echo "3. Run full test: bash test-ec2-deployment.sh"
echo ""
