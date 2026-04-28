#!/bin/bash

echo "🚀 Setting up GenVedha Production Server"
echo "========================================"
echo ""

# Step 1: Navigate to home directory
cd ~

# Step 2: Check if directory exists and remove if needed
if [ -d "genvedha-website" ]; then
    echo "📁 Existing directory found. Removing..."
    rm -rf genvedha-website
fi

# Step 3: Clone the repository
echo "📥 Cloning repository from GitHub..."
git clone -b production https://github.com/yogmca/genvedha.git genvedha-website

if [ $? -ne 0 ]; then
    echo "❌ Failed to clone repository"
    exit 1
fi

cd genvedha-website

# Step 4: Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Step 5: Build the application
echo "🔨 Building application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Failed to build application"
    exit 1
fi

# Step 6: Stop any existing PM2 processes
echo "🛑 Stopping existing PM2 processes..."
sudo pm2 stop all
sudo pm2 delete all

# Step 7: Start the application with PM2
echo "🚀 Starting application with PM2..."
sudo pm2 start server.js --name genvedha

# Step 8: Save PM2 configuration
echo "💾 Saving PM2 configuration..."
sudo pm2 save

# Step 9: Setup PM2 startup script
echo "⚙️  Setting up PM2 startup script..."
sudo pm2 startup systemd -u ubuntu --hp /home/ubuntu
sudo pm2 save

# Step 10: Check application status
echo ""
echo "✅ Setup complete! Checking status..."
echo ""
sudo pm2 status
echo ""
sudo pm2 logs genvedha --lines 20

echo ""
echo "🎉 Production server setup complete!"
echo "Your site should now be running at http://genvedha.com"
