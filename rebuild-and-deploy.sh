#!/bin/bash

# Rebuild and deploy the React app with Google verification tag
# Run this on EC2 server

set -e

echo "🚀 Rebuilding and Deploying with Google Verification Tag"
echo "=========================================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found"
    echo "Please run this from: ~/genvedha-website"
    exit 1
fi

# Pull latest changes
echo "📥 Pulling latest changes from GitHub..."
git pull origin production

# Install dependencies (in case anything changed)
echo "📦 Installing dependencies..."
npm install

# Build the React application
echo "🔨 Building React application..."
npm run build

# Restart PM2 applications
echo "🔄 Restarting PM2 applications..."
pm2 restart all

# Wait for apps to start
echo "⏳ Waiting for applications to start..."
sleep 5

# Check PM2 status
echo ""
echo "📊 PM2 Status:"
pm2 list

# Verify the tag is now live
echo ""
echo "🔍 Verifying Google verification tag on live site..."
sleep 2

if curl -s https://genvedha.com/ | grep -q "google-site-verification"; then
    echo ""
    echo "✅ SUCCESS! Google verification tag is now live!"
    echo ""
    curl -s https://genvedha.com/ | grep "google-site-verification"
    echo ""
    echo "🎉 You can now verify your site in Google Search Console!"
else
    echo ""
    echo "⚠️  Verification tag not found yet. Troubleshooting..."
    echo ""
    echo "Checking build output..."
    if [ -d "dist" ]; then
        echo "Checking dist/index.html:"
        grep -i "google-site-verification" dist/index.html || echo "Tag not found in dist/index.html"
    fi
    echo ""
    echo "Try reloading Nginx:"
    echo "  sudo systemctl reload nginx"
fi

echo ""
echo "✅ Deployment complete!"
