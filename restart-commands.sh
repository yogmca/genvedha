#!/bin/bash

# Quick Restart Script for GenVedha Application
# Run this on your EC2 instance after SSH'ing in

echo "🔄 Restarting GenVedha Application..."
echo "======================================"
echo ""

# Navigate to project directory
cd ~/genvedha-website || {
    echo "❌ Error: Project directory not found at ~/genvedha-website"
    exit 1
}

echo "✅ In project directory: $(pwd)"
echo ""

# Check current PM2 status
echo "📊 Current PM2 Status:"
pm2 status
echo ""

# Restart the application
echo "🔄 Restarting application..."
pm2 restart genvedha-website

# Wait for app to start
echo "⏳ Waiting 5 seconds for app to start..."
sleep 5

# Check new status
echo ""
echo "📊 New PM2 Status:"
pm2 status
echo ""

# Test local connection
echo "🧪 Testing local connection..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Application is responding! (HTTP $HTTP_CODE)"
else
    echo "⚠️  Application returned HTTP $HTTP_CODE"
    echo "Checking logs..."
    pm2 logs genvedha-website --lines 20 --nostream
fi

echo ""

# Check if port 3000 is listening
echo "🔌 Checking port 3000..."
if sudo netstat -tlnp 2>/dev/null | grep -q ":3000"; then
    echo "✅ Port 3000 is listening"
    sudo netstat -tlnp | grep ":3000"
else
    echo "❌ Port 3000 is NOT listening"
fi

echo ""
echo "======================================"
echo "🎯 Restart Complete!"
echo "======================================"
echo ""
echo "Test URLs:"
echo "  - Local: http://localhost:3000"
echo "  - External: http://$(curl -s ifconfig.me):3000"
echo "  - Domain: https://genvedha.com"
echo ""
echo "To view live logs: pm2 logs genvedha-website"
echo "To check status: pm2 status"
echo ""
