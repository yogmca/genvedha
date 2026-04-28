#!/bin/bash

echo "🔧 Fixing Port 3000 Conflict"
echo "============================"
echo ""

# Step 1: Find and kill process on port 3000
echo "🔍 Finding process on port 3000..."
PORT_PID=$(sudo lsof -t -i:3000)

if [ -n "$PORT_PID" ]; then
    echo "Found process $PORT_PID using port 3000"
    echo "🛑 Killing process..."
    sudo kill -9 $PORT_PID
    sleep 2
    echo "✅ Process killed"
else
    echo "No process found on port 3000"
fi

# Step 2: Stop all PM2 processes
echo ""
echo "🛑 Stopping all PM2 processes..."
sudo pm2 stop all
sudo pm2 delete all

# Step 3: Navigate to project directory
echo ""
echo "📁 Navigating to project directory..."
cd /root/genvedha-website || cd ~/genvedha-website || {
    echo "❌ Project directory not found"
    exit 1
}

# Step 4: Pull latest changes
echo ""
echo "📥 Pulling latest changes from production..."
git pull origin production

# Step 5: Install dependencies (if needed)
echo ""
echo "📦 Installing dependencies..."
npm install

# Step 6: Build the application
echo ""
echo "🔨 Building application..."
npm run build

# Step 7: Start with PM2
echo ""
echo "🚀 Starting application with PM2..."
sudo pm2 start server.js --name genvedha

# Step 8: Save PM2 configuration
echo ""
echo "💾 Saving PM2 configuration..."
sudo pm2 save

# Step 9: Check status
echo ""
echo "✅ Checking application status..."
echo ""
sudo pm2 status
echo ""
echo "📋 Recent logs:"
sudo pm2 logs genvedha --lines 10 --nostream

echo ""
echo "🎉 Done! Your application should now be running on port 3000"
echo "Visit: http://genvedha.com"
