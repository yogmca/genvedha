#!/bin/bash

echo "🔧 Fixing MongoDB Connection and Port Conflict..."
echo "=================================================="

# Step 1: Stop PM2 process
echo ""
echo "📍 Step 1: Stopping PM2 process..."
pm2 stop genvedha 2>/dev/null || echo "No PM2 process to stop"
pm2 delete genvedha 2>/dev/null || echo "No PM2 process to delete"

# Step 2: Kill any process on port 3000
echo ""
echo "📍 Step 2: Killing any process on port 3000..."
PORT_PID=$(lsof -ti:3000)
if [ ! -z "$PORT_PID" ]; then
    echo "Found process $PORT_PID on port 3000, killing it..."
    kill -9 $PORT_PID
    sleep 2
    echo "✅ Process killed"
else
    echo "✅ No process found on port 3000"
fi

# Step 3: Verify .env file has correct MongoDB URI
echo ""
echo "📍 Step 3: Verifying MongoDB URI in .env..."
if grep -q "retryWrites=true" .env; then
    echo "✅ MongoDB URI contains retryWrites parameter"
else
    echo "⚠️  WARNING: MongoDB URI missing retryWrites parameter"
    echo "Please ensure your .env file has the correct format:"
    echo "MONGODB_URI=mongodb://username:password@host/database?ssl=true&authSource=admin&retryWrites=true&w=majority"
fi

# Step 4: Test MongoDB connection
echo ""
echo "📍 Step 4: Testing MongoDB connection..."
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
" || {
    echo ""
    echo "❌ MongoDB connection test failed!"
    echo "Please check:"
    echo "  1. MongoDB Atlas network access (whitelist your IP or use 0.0.0.0/0)"
    echo "  2. Database user credentials are correct"
    echo "  3. Connection string format is correct"
    echo ""
    echo "Current MongoDB URI format should be:"
    echo "mongodb://username:password@host/database?ssl=true&authSource=admin&retryWrites=true&w=majority"
    exit 1
}

# Step 5: Start the application with PM2
echo ""
echo "📍 Step 5: Starting application with PM2..."
pm2 start server.js --name genvedha --time

# Step 6: Save PM2 configuration
echo ""
echo "📍 Step 6: Saving PM2 configuration..."
pm2 save

# Step 7: Show status and logs
echo ""
echo "📍 Step 7: Checking application status..."
pm2 status

echo ""
echo "=================================================="
echo "✅ Fix completed!"
echo ""
echo "📋 Next steps:"
echo "  1. Check logs: pm2 logs genvedha"
echo "  2. Monitor status: pm2 status"
echo "  3. Test the website: curl http://localhost:3000"
echo ""
echo "If you see 'Running in demo mode', the app is working but MongoDB"
echo "connection needs additional configuration (network access, credentials)."
echo ""
