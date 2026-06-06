#!/bin/bash

# Start Frontend for Generated Apps
# This builds and serves the React frontends

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}🎨 Starting Generated App Frontends${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

BASE_DIR="/Users/avydiya/Desktop/genvedha-website/genvedha-llm-service/generated-apps"

# Function to start frontend
start_frontend() {
    local app_name=$1
    local port=$2
    local app_dir="$BASE_DIR/$app_name"
    
    if [ ! -d "$app_dir/frontend" ]; then
        echo "⚠️  Frontend not found for $app_name"
        return
    fi
    
    echo -e "${YELLOW}Starting $app_name frontend on port $port...${NC}"
    cd "$app_dir/frontend"
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        echo "📦 Installing dependencies..."
        npm install --silent
    fi
    
    # Start in development mode
    echo "🚀 Starting React app..."
    PORT=$port npm start > "/Users/avydiya/Desktop/genvedha-website/logs/$app_name-frontend.log" 2>&1 &
    echo $! > "/Users/avydiya/Desktop/genvedha-website/logs/$app_name-frontend.pid"
    
    echo "✅ $app_name frontend starting on http://localhost:$port"
    echo ""
}

# Create logs directory
mkdir -p "/Users/avydiya/Desktop/genvedha-website/logs"

# Start Organic Spice Bazaar Frontend
if [ -d "$BASE_DIR/organic-spice-bazaar-140e8a66" ]; then
    start_frontend "organic-spice-bazaar-140e8a66" 3004
fi

# Start StyleVista Frontend
if [ -d "$BASE_DIR/stylevista-77626dcc" ]; then
    start_frontend "stylevista-77626dcc" 3005
fi

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Frontends Starting!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "⏳ Please wait 30-60 seconds for React apps to compile..."
echo ""
echo "🌐 Once ready, access at:"
echo "   Organic Spice Bazaar: http://localhost:3004"
echo "   StyleVista Fashion:   http://localhost:3005"
echo ""
echo "📊 View logs:"
echo "   tail -f logs/organic-spice-bazaar-140e8a66-frontend.log"
echo "   tail -f logs/stylevista-77626dcc-frontend.log"
echo ""
echo "🛑 To stop frontends:"
echo "   ./stop-all-apps-local.sh"
echo ""
