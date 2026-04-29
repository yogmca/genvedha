#!/bin/bash

echo "============================================================================"
echo "🚀 Running Fix on EC2 Server"
echo "============================================================================"
echo ""

# Check if SSH key is provided
if [ -z "$1" ]; then
    echo "Usage: ./run-fix-on-server.sh <path-to-ssh-key>"
    echo "Example: ./run-fix-on-server.sh ~/.ssh/genvedha-key.pem"
    echo ""
    echo "Or run directly:"
    echo "ssh -i your-key.pem ubuntu@genvedha.com 'bash -s' < fix-app-not-running.sh"
    exit 1
fi

SSH_KEY="$1"

echo "📡 Testing connection to server..."
if ! ssh -i "$SSH_KEY" -o ConnectTimeout=10 ubuntu@genvedha.com "echo 'Connection successful'"; then
    echo "❌ Cannot connect to server"
    echo ""
    echo "Try connecting directly with:"
    echo "ssh -i $SSH_KEY ubuntu@genvedha.com"
    exit 1
fi

echo ""
echo "✅ Connected to server"
echo ""
echo "📥 Pulling latest code..."
ssh -i "$SSH_KEY" ubuntu@genvedha.com << 'ENDSSH'
cd /home/ubuntu/genvedha-website
git pull origin production
chmod +x fix-app-not-running.sh diagnose-app-not-running.sh
ENDSSH

echo ""
echo "🔧 Running fix script..."
ssh -i "$SSH_KEY" ubuntu@genvedha.com 'bash -s' < fix-app-not-running.sh

echo ""
echo "============================================================================"
echo "✅ Fix Complete!"
echo "============================================================================"
echo ""
echo "Test your site: https://genvedha.com"
echo ""
