#!/bin/bash

# Start All Apps Locally (macOS)
# This script starts GenVedha main site, LLM service, and generated apps

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}🚀 Starting GenVedha Apps Locally${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Base directory
BASE_DIR="/Users/avydiya/Desktop/genvedha-website"

# Check if we're in the right directory
if [ ! -d "$BASE_DIR" ]; then
    echo "Error: Base directory not found: $BASE_DIR"
    exit 1
fi

cd "$BASE_DIR"

# Function to check if port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to start app in background
start_app() {
    local name=$1
    local dir=$2
    local port=$3
    local command=$4
    
    echo -e "${YELLOW}Starting $name on port $port...${NC}"
    
    if check_port $port; then
        echo "✅ $name already running on port $port"
    else
        cd "$dir"
        if [ -f "package.json" ]; then
            # Start in background and redirect output to log file
            PORT=$port $command > "$BASE_DIR/logs/$name.log" 2>&1 &
            echo $! > "$BASE_DIR/logs/$name.pid"
            sleep 2
            if check_port $port; then
                echo "✅ $name started successfully on port $port"
            else
                echo "❌ Failed to start $name"
            fi
        else
            echo "⚠️  package.json not found in $dir"
        fi
    fi
}

# Create logs directory
mkdir -p "$BASE_DIR/logs"

echo "📋 Checking current status..."
echo ""

# 1. Start Main GenVedha Website
echo -e "${GREEN}1. Main GenVedha Website${NC}"
start_app "genvedha-main" "$BASE_DIR" 3000 "node server.js"
echo ""

# 2. Start GenVedha LLM Service
echo -e "${GREEN}2. GenVedha LLM Service${NC}"
start_app "genvedha-llm" "$BASE_DIR/genvedha-llm-service" 3001 "node index.js"
echo ""

# 3. Start Generated Apps
echo -e "${GREEN}3. Generated Apps${NC}"

# Check if generated apps exist
GENERATED_APPS_DIR="$BASE_DIR/genvedha-llm-service/generated-apps"

if [ -d "$GENERATED_APPS_DIR" ]; then
    # Find all generated apps
    app_count=0
    port=3002
    
    for app_dir in "$GENERATED_APPS_DIR"/*/ ; do
        if [ -d "$app_dir" ]; then
            app_name=$(basename "$app_dir")
            backend_dir="$app_dir/backend"
            
            if [ -d "$backend_dir" ] && [ -f "$backend_dir/server.js" ]; then
                echo -e "${YELLOW}Found app: $app_name${NC}"
                
                # Install dependencies if needed
                if [ ! -d "$backend_dir/node_modules" ]; then
                    echo "📦 Installing dependencies for $app_name..."
                    cd "$backend_dir"
                    npm install --silent
                fi
                
                # Start the app
                start_app "$app_name" "$backend_dir" $port "node server.js"
                port=$((port + 1))
                app_count=$((app_count + 1))
                echo ""
            fi
        fi
    done
    
    if [ $app_count -eq 0 ]; then
        echo "ℹ️  No generated apps found"
    else
        echo "✅ Started $app_count generated app(s)"
    fi
else
    echo "ℹ️  No generated apps directory found"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ All Apps Started!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "🌐 Access your apps:"
echo "   Main Site:    http://localhost:3000"
echo "   LLM Service:  http://localhost:3001"
echo ""

# List generated apps
if [ -d "$GENERATED_APPS_DIR" ]; then
    port=3002
    for app_dir in "$GENERATED_APPS_DIR"/*/ ; do
        if [ -d "$app_dir" ]; then
            app_name=$(basename "$app_dir")
            if [ -d "$app_dir/backend" ]; then
                echo "   $app_name: http://localhost:$port"
                port=$((port + 1))
            fi
        fi
    done
fi

echo ""
echo "📊 View logs:"
echo "   tail -f logs/genvedha-main.log"
echo "   tail -f logs/genvedha-llm.log"
echo ""
echo "🛑 Stop all apps:"
echo "   ./stop-all-apps-local.sh"
echo ""
echo -e "${GREEN}========================================${NC}"
