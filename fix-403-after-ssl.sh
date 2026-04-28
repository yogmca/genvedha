#!/bin/bash

# Fix 403 Error After SSL Setup
# This script diagnoses and fixes the 403 Forbidden error

set -e

echo "=========================================="
echo "Diagnosing 403 Error"
echo "=========================================="

# Step 1: Check if application is running
echo ""
echo "Step 1: Checking if Node.js application is running..."
if pgrep -f "node.*server.js" > /dev/null; then
    echo "✓ Node.js application is running"
    ps aux | grep "node.*server.js" | grep -v grep
else
    echo "✗ Node.js application is NOT running"
    echo "  Starting the application..."
    cd /home/ubuntu/genvedha-website
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        echo "  Installing dependencies..."
        npm install
    fi
    
    # Start the application in the background
    nohup node server.js > /var/log/genvedha-app.log 2>&1 &
    sleep 3
    
    if pgrep -f "node.*server.js" > /dev/null; then
        echo "✓ Application started successfully"
    else
        echo "✗ Failed to start application"
        echo "  Check logs: tail -f /var/log/genvedha-app.log"
    fi
fi

# Step 2: Check if port 3000 is listening
echo ""
echo "Step 2: Checking if port 3000 is listening..."
if netstat -tlnp 2>/dev/null | grep ":3000" > /dev/null; then
    echo "✓ Port 3000 is listening"
    netstat -tlnp 2>/dev/null | grep ":3000"
else
    echo "✗ Port 3000 is NOT listening"
    echo "  This is the problem! The application needs to be running on port 3000"
fi

# Step 3: Test local connection to port 3000
echo ""
echo "Step 3: Testing local connection to port 3000..."
if curl -s http://localhost:3000 > /dev/null; then
    echo "✓ Application responds on localhost:3000"
else
    echo "✗ Application does NOT respond on localhost:3000"
fi

# Step 4: Check Nginx configuration
echo ""
echo "Step 4: Checking Nginx configuration..."
if [ -f /etc/nginx/sites-available/genvedha.com ]; then
    echo "✓ Nginx config exists"
    echo ""
    echo "Current proxy_pass configuration:"
    grep -A 2 "location /" /etc/nginx/sites-available/genvedha.com | grep proxy_pass || echo "  No proxy_pass found!"
else
    echo "✗ Nginx config NOT found"
fi

# Step 5: Check Nginx error logs
echo ""
echo "Step 5: Recent Nginx errors:"
if [ -f /var/log/nginx/error.log ]; then
    tail -20 /var/log/nginx/error.log | grep -i "error\|forbidden\|denied" || echo "  No recent errors found"
else
    echo "  Error log not found"
fi

# Step 6: Fix Nginx configuration
echo ""
echo "=========================================="
echo "Applying Fix"
echo "=========================================="

echo ""
echo "Creating correct Nginx configuration..."

cat > /etc/nginx/sites-available/genvedha.com << 'EOF'
server {
    listen 80;
    server_name genvedha.com www.genvedha.com;
    
    # Redirect all HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name genvedha.com www.genvedha.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/genvedha.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/genvedha.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy to Node.js application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Error pages
    error_page 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}
EOF

echo "✓ Nginx configuration updated"

# Step 7: Test and reload Nginx
echo ""
echo "Testing Nginx configuration..."
if nginx -t; then
    echo "✓ Nginx configuration is valid"
    echo ""
    echo "Reloading Nginx..."
    systemctl reload nginx
    echo "✓ Nginx reloaded"
else
    echo "✗ Nginx configuration has errors"
    exit 1
fi

# Step 8: Ensure application is running
echo ""
echo "=========================================="
echo "Ensuring Application is Running"
echo "=========================================="

cd /home/ubuntu/genvedha-website

# Kill any existing processes
pkill -f "node.*server.js" || true
sleep 2

# Start fresh
echo "Starting application..."
nohup node server.js > /var/log/genvedha-app.log 2>&1 &
sleep 3

# Verify it's running
if pgrep -f "node.*server.js" > /dev/null; then
    echo "✓ Application is running"
    echo ""
    echo "Process details:"
    ps aux | grep "node.*server.js" | grep -v grep
else
    echo "✗ Application failed to start"
    echo ""
    echo "Application logs:"
    tail -20 /var/log/genvedha-app.log
    exit 1
fi

# Step 9: Final verification
echo ""
echo "=========================================="
echo "Final Verification"
echo "=========================================="

echo ""
echo "Waiting 5 seconds for everything to stabilize..."
sleep 5

echo ""
echo "Testing localhost:3000..."
if curl -s http://localhost:3000 > /dev/null; then
    echo "✓ Application responds on localhost:3000"
else
    echo "✗ Application does NOT respond"
    echo ""
    echo "Application logs:"
    tail -30 /var/log/genvedha-app.log
fi

echo ""
echo "Testing HTTPS..."
if curl -k -s https://localhost > /dev/null; then
    echo "✓ HTTPS responds"
else
    echo "✗ HTTPS does NOT respond"
fi

echo ""
echo "=========================================="
echo "Status Summary"
echo "=========================================="

echo ""
echo "Services Status:"
systemctl status nginx --no-pager | head -3
echo ""
ps aux | grep "node.*server.js" | grep -v grep || echo "Node.js: NOT RUNNING"

echo ""
echo "Ports Listening:"
netstat -tlnp 2>/dev/null | grep -E ":(80|443|3000)" || echo "No ports listening"

echo ""
echo "=========================================="
echo "✓ Fix Complete!"
echo "=========================================="
echo ""
echo "Your site should now be accessible at:"
echo "  https://genvedha.com"
echo "  https://www.genvedha.com"
echo ""
echo "If you still see 403, check:"
echo "  1. Application logs: tail -f /var/log/genvedha-app.log"
echo "  2. Nginx error logs: tail -f /var/log/nginx/error.log"
echo "  3. Verify port 3000: netstat -tlnp | grep :3000"
echo ""
