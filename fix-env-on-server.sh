#!/bin/bash

echo "🔧 Fixing .env file on EC2 server..."
echo "====================================="

# Create the correct .env content
cat > /tmp/genvedha.env << 'EOF'
# MongoDB Configuration
MONGODB_URI=mongodb://ykmysuru27_db_user:QWLP9LcE3nIRcEaY@atlas-sql-69f06bb159aabca72961dac5-ew3cgx.a.query.mongodb.net/genvedha?ssl=true&authSource=admin&retryWrites=true&w=majority
MONGODB_USERNAME=ykmysuru27_db_user
MONGODB_PASSWORD=QWLP9LcE3nIRcEaY
MONGODB_DATABASE=genvedha

# Server Configuration
PORT=3000

# Email Configuration (Gmail SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_specific_password
EMAIL_FROM=GenVedha <your_email@gmail.com>
EMAIL_TO=support@genvedha.com
EOF

echo "✅ Created correct .env file"
echo ""

# Backup existing .env
if [ -f .env ]; then
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
    echo "✅ Backed up existing .env file"
fi

# Replace with correct version
cp /tmp/genvedha.env .env
echo "✅ Updated .env file"
echo ""

# Verify the fix
echo "📍 Verifying MongoDB URI format..."
if grep -q "retryWrites=true&w=majority" .env; then
    echo "✅ MongoDB URI format is correct"
else
    echo "❌ MongoDB URI format is still incorrect"
    exit 1
fi

echo ""
echo "📍 Testing MongoDB connection..."
node -e "
const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI;
console.log('Testing connection to:', uri.replace(/:[^:@]+@/, ':****@'));

const client = new MongoClient(uri);

client.connect()
  .then(() => {
    console.log('✅ MongoDB connection successful!');
    return client.close();
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });
"

if [ $? -eq 0 ]; then
    echo ""
    echo "📍 Restarting application..."
    
    # Stop PM2
    pm2 stop genvedha 2>/dev/null
    pm2 delete genvedha 2>/dev/null
    
    # Kill port 3000
    lsof -ti:3000 | xargs kill -9 2>/dev/null
    
    # Start fresh
    pm2 start server.js --name genvedha --time
    pm2 save
    
    echo ""
    echo "✅ Application restarted successfully!"
    echo ""
    echo "📋 Check status:"
    pm2 status
    echo ""
    echo "📋 View logs:"
    echo "pm2 logs genvedha"
else
    echo ""
    echo "❌ MongoDB connection test failed!"
    echo "Please check MongoDB Atlas network access and credentials."
fi
