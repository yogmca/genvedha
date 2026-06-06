#!/bin/bash

# Stop All Apps Locally (macOS)

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${RED}========================================${NC}"
echo -e "${RED}🛑 Stopping All GenVedha Apps${NC}"
echo -e "${RED}========================================${NC}"
echo ""

BASE_DIR="/Users/avydiya/Desktop/genvedha-website"
LOGS_DIR="$BASE_DIR/logs"

# Function to stop app by PID file
stop_app() {
    local name=$1
    local pid_file="$LOGS_DIR/$name.pid"
    
    if [ -f "$pid_file" ]; then
        pid=$(cat "$pid_file")
        if ps -p $pid > /dev/null 2>&1; then
            echo "Stopping $name (PID: $pid)..."
            kill $pid
            rm "$pid_file"
            echo "✅ $name stopped"
        else
            echo "⚠️  $name not running (stale PID file)"
            rm "$pid_file"
        fi
    else
        echo "ℹ️  No PID file for $name"
    fi
}

# Function to kill by port
kill_port() {
    local port=$1
    local name=$2
    
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        echo "Stopping process on port $port ($name)..."
        lsof -ti:$port | xargs kill -9 2>/dev/null || true
        echo "✅ Port $port freed"
    fi
}

# Stop apps by PID files
if [ -d "$LOGS_DIR" ]; then
    for pid_file in "$LOGS_DIR"/*.pid; do
        if [ -f "$pid_file" ]; then
            app_name=$(basename "$pid_file" .pid)
            stop_app "$app_name"
        fi
    done
fi

echo ""
echo "Checking ports..."

# Kill processes on known ports
kill_port 3000 "Main Site"
kill_port 3001 "LLM Service"
kill_port 3002 "Generated App 1"
kill_port 3003 "Generated App 2"
kill_port 3004 "Generated App 3"
kill_port 3005 "Generated App 4"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ All Apps Stopped${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "To start again, run:"
echo "   ./start-all-apps-local.sh"
echo ""
