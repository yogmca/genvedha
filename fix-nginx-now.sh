#!/bin/bash

echo "============================================================================"
echo "🔧 Fixing Nginx Configuration and Starting Service"
echo "============================================================================"
echo ""

cd /home/ubuntu/genvedha-website

echo "1️⃣ Removing duplicate Nginx configurations..."
# Remove all genvedha configs except the main one
sudo rm -f /etc/nginx/sites-enabled/genvedha
sudo rm -f /etc/nginx/sites-available/genvedha
sudo rm -f /etc/nginx/sites-enabled/default

echo ""
echo "2️⃣ Creating clean Nginx configuration..."
sudo tee /etc/nginx/sites-available/genvedha.com > /dev/null << 'NGINXEOF'
# HTTP - Redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name genvedha.com www.genvedha.com;
    
    # Allow Let's Encrypt validation
    location /.well-known/acme-challenge/ {
        root /var/www/html;
        allow all;
    }
    
    # Redirect all other traffic to HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS - Main configuration
server {
    listen 443 ssl;
    listen [::]:443 ssl;
    http2 on;
    server_name genvedha.com www.genvedha.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/genvedha.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/genvedha.com/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/genvedha.com/chain.pem;

    # Modern SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;
    
    # SSL session cache
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Logging
    access_log /var/log/nginx/genvedha_access.log;
    error_log /var/log/nginx/genvedha_error.log;

    # Proxy settings
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
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
NGINXEOF

echo "✅ Configuration created"

echo ""
echo "3️⃣ Enabling site..."
sudo ln -sf /etc/nginx/sites-available/genvedha.com /etc/nginx/sites-enabled/genvedha.com

echo ""
echo "4️⃣ Testing Nginx configuration..."
if sudo nginx -t 2>&1 | grep -q "successful"; then
    echo "✅ Nginx configuration is valid"
else
    echo "❌ Nginx configuration has errors:"
    sudo nginx -t
    exit 1
fi

echo ""
echo "5️⃣ Starting Nginx..."
sudo systemctl start nginx
sudo systemctl enable nginx

echo ""
echo "6️⃣ Checking Nginx status..."
if sudo systemctl is-active --quiet nginx; then
    echo "✅ Nginx is running"
else
    echo "❌ Nginx failed to start"
    sudo systemctl status nginx --no-pager
    exit 1
fi

echo ""
echo "7️⃣ Checking if Nginx is listening on ports..."
sudo ss -tlnp | grep nginx

echo ""
echo "8️⃣ Testing local HTTPS connection..."
sleep 2
curl -k -I https://localhost 2>&1 | head -5

echo ""
echo "9️⃣ Testing external HTTPS connection..."
curl -I https://genvedha.com 2>&1 | head -10

echo ""
echo "============================================================================"
echo "✅ Nginx Fixed and Started!"
echo "============================================================================"
echo ""
echo "Test your site: https://genvedha.com"
echo ""
