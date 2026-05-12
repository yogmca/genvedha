#!/bin/bash

# Start GenVedha LLM Service
# This script starts the service and runs basic checks

echo "=========================================="
echo "🚀 Starting GenVedha LLM Service"
echo "=========================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    echo "Please install Node.js 16+ from https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed"
    exit 1
fi

echo "✅ npm version: $(npm --version)"

# Navigate to service directory
cd genvedha-llm-service || exit 1

# Check if .env exists
if [ ! -f .env ]; then
    echo ""
    echo "⚠️  .env file not found"
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo ""
    echo "⚠️  IMPORTANT: Edit .env and add your Claude API key:"
    echo "   CLAUDE_API_KEY=your_actual_api_key_here"
    echo ""
    read -p "Press Enter after you've updated the .env file..."
fi

# Check if node_modules exists
if [ ! -d node_modules ]; then
    echo ""
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
    echo "✅ Dependencies installed"
fi

# Create required directories
echo ""
echo "📁 Creating required directories..."
mkdir -p templates
mkdir -p generated-apps
mkdir -p logs
echo "✅ Directories created"

# Start the service
echo ""
echo "=========================================="
echo "🌐 Starting service on port 3001..."
echo "=========================================="
echo ""

npm start
