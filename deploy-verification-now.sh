#!/bin/bash

# Deploy Google Search Console verification tag (for EC2)
# Run this script directly on your EC2 server

set -e

echo "🚀 Deploying Google Search Console Verification Tag"
echo "===================================================="

# Check if we're in the right directory
if [ ! -f "public/index.html" ]; then
    echo "❌ Error: public/index.html not found"
    echo "Please run this from: ~/genvedha-website"
    exit 1
fi

# Verify the tag exists in the file
echo ""
echo "📋 Checking for verification tag in index.html..."
if grep -q "google-site-verification" public/index.html; then
    echo "✅ Verification tag found in index.html:"
    grep "google-site-verification" public/index.html
else
    echo "❌ Verification tag NOT found in index.html"
    exit 1
fi

# Restart PM2 application
echo ""
echo "🔄 Restarting application..."
pm2 restart genvedha-website || pm2 restart all

# Wait for app to start
echo "⏳ Waiting for application to start..."
sleep 3

# Check PM2 status
echo ""
echo "📊 PM2 Status:"
pm2 list

# Verify the tag is live on the website
echo ""
echo "🔍 Verifying tag on live site..."
sleep 2

if curl -s https://genvedha.com/ | grep -q "google-site-verification"; then
    echo "✅ SUCCESS! Verification tag is now live on genvedha.com"
    echo ""
    curl -s https://genvedha.com/ | grep "google-site-verification"
    echo ""
    echo "🎉 You can now verify your site in Google Search Console!"
else
    echo "⚠️  Verification tag not found on live site yet"
    echo ""
    echo "Troubleshooting steps:"
    echo "1. Check if Nginx is caching: sudo systemctl reload nginx"
    echo "2. Check PM2 logs: pm2 logs genvedha-website"
    echo "3. Wait 30 seconds and try again"
fi

echo ""
echo "✅ Deployment complete!"
