#!/bin/bash

echo "🚀 Deploying MongoDB Fix to EC2 Server"
echo "========================================"
echo ""

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found!"
    echo "Please ensure .env file exists in the current directory."
    exit 1
fi

# Verify MongoDB URI has retryWrites parameter
if ! grep -q "retryWrites=true" .env; then
    echo "❌ Error: MongoDB URI missing retryWrites parameter!"
    echo "Please update your .env file with the correct format."
    exit 1
fi

echo "✅ Local .env file verified"
echo ""

# Prompt for EC2 details
read -p "Enter your EC2 IP address: " EC2_IP
read -p "Enter path to your SSH key (e.g., ~/key.pem): " SSH_KEY

# Expand tilde to home directory
SSH_KEY="${SSH_KEY/#\~/$HOME}"

# Verify SSH key exists
if [ ! -f "$SSH_KEY" ]; then
    echo "❌ Error: SSH key not found at $SSH_KEY"
    exit 1
fi

echo ""
echo "📤 Uploading fixed .env file to EC2..."
scp -i "$SSH_KEY" .env ubuntu@$EC2_IP:~/genvedha-website/.env

if [ $? -ne 0 ]; then
    echo "❌ Failed to upload .env file"
    exit 1
fi

echo "✅ .env file uploaded successfully"
echo ""

echo "📤 Uploading fix script to EC2..."
scp -i "$SSH_KEY" fix-mongodb-and-restart.sh ubuntu@$EC2_IP:~/genvedha-website/

if [ $? -ne 0 ]; then
    echo "❌ Failed to upload fix script"
    exit 1
fi

echo "✅ Fix script uploaded successfully"
echo ""

echo "🔧 Running fix script on EC2..."
ssh -i "$SSH_KEY" ubuntu@$EC2_IP << 'ENDSSH'
cd ~/genvedha-website
chmod +x fix-mongodb-and-restart.sh
./fix-mongodb-and-restart.sh
ENDSSH

if [ $? -ne 0 ]; then
    echo "❌ Fix script execution failed"
    exit 1
fi

echo ""
echo "========================================"
echo "✅ Deployment completed successfully!"
echo ""
echo "📋 Next steps:"
echo "  1. Check application status:"
echo "     ssh -i $SSH_KEY ubuntu@$EC2_IP 'pm2 status'"
echo ""
echo "  2. View logs:"
echo "     ssh -i $SSH_KEY ubuntu@$EC2_IP 'pm2 logs genvedha --lines 50'"
echo ""
echo "  3. Test the website:"
echo "     curl http://$EC2_IP:3000"
echo ""
