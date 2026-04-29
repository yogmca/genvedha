#!/bin/bash

echo "============================================================================"
echo "🔧 Fixing App Not Running Issue"
echo "============================================================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running on server
if [ ! -d "/home/ubuntu/genvedha-website" ]; then
    echo -e "${RED}❌ This script must be run on the EC2 server${NC}"
    echo ""
    echo "Run this command to execute on server:"
    echo "ssh -i your-key.pem ubuntu@genvedha.com 'bash -s' < fix-app-not-running.sh"
    exit 1
fi

cd /home/ubuntu/genvedha-website

echo "1️⃣ Stopping all services..."
pm2 stop all
sudo systemctl stop nginx

echo ""
echo "2️⃣ Checking if .env file exists..."
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating from .env.example...${NC}"
    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${GREEN}✅ Created .env file${NC}"
    else
        echo -e "${RED}❌ .env.example not found. Creating basic .env...${NC}"
        cat > .env << 'ENVEOF'
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://localhost:27017/genvedha
SESSION_SECRET=your-secret-key-change-this-in-production
ENVEOF
        echo -e "${GREEN}✅ Created basic .env file${NC}"
    fi
fi

echo ""
echo "3️⃣ Installing/updating dependencies..."
npm install --production

echo ""
echo "4️⃣ Creating optimized Nginx configuration..."
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
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name genvedha.com www.genvedha.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/genvedha.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/genvedha.com/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/genvedha.com/chain.pem;

    # Modern SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;
    
    # SSL session cache
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_session_tickets off;
    
    # OCSP Stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    resolver 8.8.8.8 8.8.4.4 valid=300s;
    resolver_timeout 5s;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

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

    # Static files caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
NGINXEOF

echo -e "${GREEN}✅ Nginx configuration created${NC}"

echo ""
echo "5️⃣ Testing Nginx configuration..."
if sudo nginx -t; then
    echo -e "${GREEN}✅ Nginx configuration is valid${NC}"
else
    echo -e "${RED}❌ Nginx configuration has errors${NC}"
    exit 1
fi

echo ""
echo "6️⃣ Reloading Nginx..."
sudo systemctl reload nginx
sudo systemctl enable nginx

echo ""
echo "7️⃣ Starting application with PM2..."
pm2 delete genvedha 2>/dev/null || true
pm2 start server.js --name genvedha --time
pm2 save
pm2 startup systemd -u ubuntu --hp /home/ubuntu

echo ""
echo "8️⃣ Waiting for app to start..."
sleep 5

echo ""
echo "9️⃣ Checking application status..."
pm2 list

echo ""
echo "🔟 Testing local connection..."
if curl -s http://localhost:3000 > /dev/null; then
    echo -e "${GREEN}✅ App is responding on port 3000${NC}"
else
    echo -e "${RED}❌ App is NOT responding on port 3000${NC}"
    echo "Checking PM2 logs:"
    pm2 logs genvedha --lines 20 --nostream
fi

echo ""
echo "1️⃣1️⃣ Testing HTTPS connection..."
sleep 2
curl -I https://genvedha.com 2>&1 | head -10

echo ""
echo "============================================================================"
echo "✅ Fix Complete!"
echo "============================================================================"
echo ""
echo "📋 Next Steps:"
echo "1. Test your site: https://genvedha.com"
echo "2. Check PM2 logs: pm2 logs genvedha"
echo "3. Check Nginx logs: sudo tail -f /var/log/nginx/genvedha_error.log"
echo ""
echo "If still not working, check:"
echo "- AWS Security Group has ports 80 and 443 open"
echo "- DNS is pointing to correct IP"
echo "- Run: pm2 logs genvedha --lines 50"
echo ""
