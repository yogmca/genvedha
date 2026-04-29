#!/bin/bash

echo "============================================================================"
echo "🔍 Diagnosing Why App Is Not Running"
echo "============================================================================"
echo ""

# Check if PM2 is running
echo "1️⃣ Checking PM2 status..."
pm2 list

echo ""
echo "2️⃣ Checking PM2 logs (last 50 lines)..."
pm2 logs genvedha --lines 50 --nostream

echo ""
echo "3️⃣ Checking if app is listening on port 3000..."
sudo netstat -tlnp | grep :3000 || echo "❌ Nothing listening on port 3000"

echo ""
echo "4️⃣ Checking Nginx configuration..."
sudo nginx -t

echo ""
echo "5️⃣ Checking Nginx status..."
sudo systemctl status nginx --no-pager

echo ""
echo "6️⃣ Checking Nginx error logs (last 20 lines)..."
sudo tail -20 /var/log/nginx/genvedha_error.log

echo ""
echo "7️⃣ Checking if .env file exists..."
if [ -f /home/ubuntu/genvedha-website/.env ]; then
    echo "✅ .env file exists"
    echo "Contents (hiding sensitive data):"
    cat /home/ubuntu/genvedha-website/.env | sed 's/=.*/=***HIDDEN***/'
else
    echo "❌ .env file NOT found"
fi

echo ""
echo "8️⃣ Testing local connection to app..."
curl -v http://localhost:3000 2>&1 | head -20

echo ""
echo "9️⃣ Checking SSL certificate..."
echo | openssl s_client -connect genvedha.com:443 -servername genvedha.com 2>&1 | grep -A 5 "Certificate chain"

echo ""
echo "🔟 Testing HTTPS connection..."
curl -v https://genvedha.com 2>&1 | head -30

echo ""
echo "============================================================================"
echo "📋 Diagnosis Complete"
echo "============================================================================"
