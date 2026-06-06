#!/bin/bash

# Genvedha Guru - Quick Start Script
# This script starts the server and opens Genvedha Guru in your browser

echo "╔════════════════════════════════════════════════════════╗"
echo "║        Genvedha Guru - AI E-commerce Creator           ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js found: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm found: $(npm --version)"

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo ""
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
    echo "✅ Dependencies installed successfully"
fi

# Check if MongoDB is running (optional)
echo ""
echo "🔍 Checking MongoDB..."
if command -v mongod &> /dev/null; then
    if pgrep -x "mongod" > /dev/null; then
        echo "✅ MongoDB is running"
    else
        echo "⚠️  MongoDB is not running. Starting MongoDB..."
        # Try to start MongoDB (this may vary by system)
        if command -v brew &> /dev/null; then
            brew services start mongodb-community 2>/dev/null || echo "   Please start MongoDB manually"
        else
            echo "   Please start MongoDB manually: mongod"
        fi
    fi
else
    echo "⚠️  MongoDB not found. Install it for full functionality."
    echo "   Visit: https://www.mongodb.com/try/download/community"
fi

# Create generated-apps directory if it doesn't exist
mkdir -p generated-apps

echo ""
echo "🚀 Starting Genvedha Guru server..."
echo ""

# Start the server
npm start &
SERVER_PID=$!

# Wait for server to start
echo "⏳ Waiting for server to start..."
sleep 3

# Check if server is running
if ps -p $SERVER_PID > /dev/null; then
    echo "✅ Server started successfully on http://localhost:3000"
    echo ""
    echo "📱 Opening Genvedha Guru in your browser..."
    sleep 1
    
    # Open browser based on OS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        open "http://localhost:3000/genvedha-guru.html"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        xdg-open "http://localhost:3000/genvedha-guru.html" 2>/dev/null || echo "Please open: http://localhost:3000/genvedha-guru.html"
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
        # Windows
        start "http://localhost:3000/genvedha-guru.html"
    else
        echo "Please open: http://localhost:3000/genvedha-guru.html"
    fi
    
    echo ""
    echo "╔════════════════════════════════════════════════════════╗"
    echo "║              Genvedha Guru is Ready!                   ║"
    echo "╚════════════════════════════════════════════════════════╝"
    echo ""
    echo "🌐 Access Points:"
    echo "   • Genvedha Guru: http://localhost:3000/genvedha-guru.html"
    echo "   • Main Website:  http://localhost:3000"
    echo "   • API Health:    http://localhost:3000/api/health"
    echo ""
    echo "📝 Quick Guide:"
    echo "   1. Click 'Start Creating' in the browser"
    echo "   2. Answer the questions about your business"
    echo "   3. Review and approve your requirements"
    echo "   4. Watch your app being created!"
    echo ""
    echo "🛑 To stop the server: Press Ctrl+C"
    echo ""
    
    # Keep script running
    wait $SERVER_PID
else
    echo "❌ Failed to start server"
    exit 1
fi
