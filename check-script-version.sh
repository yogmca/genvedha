#!/bin/bash

# Script to check if setup-https.sh has the latest updates

echo "Checking setup-https.sh version..."
echo ""

if grep -q "Stopping Nginx to clean up old configurations" setup-https.sh; then
    echo "✓ Script has the latest updates (includes Nginx stop step)"
else
    echo "✗ Script is OLD VERSION (missing Nginx stop step)"
    echo ""
    echo "To fix, run:"
    echo "  git stash  # Save any local changes"
    echo "  git pull   # Get latest version"
    echo ""
    exit 1
fi

if grep -q "Removing any existing Nginx configurations" setup-https.sh; then
    echo "✓ Script has config cleanup step"
else
    echo "✗ Script is missing config cleanup step"
    exit 1
fi

if grep -q "listen 443 ssl http2" setup-https.sh; then
    echo "✗ Script still has OLD HTTPS configuration (this is the problem!)"
    echo ""
    echo "The script should NOT have HTTPS config initially."
    echo "Run: git stash && git pull"
    exit 1
else
    echo "✓ Script has HTTP-only initial configuration"
fi

echo ""
echo "Script version is CORRECT. The issue must be elsewhere."
echo ""
echo "Try running these commands to completely clean up:"
echo "  sudo systemctl stop nginx"
echo "  sudo rm -f /etc/nginx/conf.d/genvedha* /etc/nginx/sites-*/genvedha*"
echo "  sudo ./setup-https.sh"
