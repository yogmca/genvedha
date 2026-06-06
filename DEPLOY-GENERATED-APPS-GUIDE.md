# Deploy Generated Apps - Complete Guide

## 🎯 Overview

This guide explains how to deploy generated e-commerce apps on the same domain using subdomains or paths, both locally and on EC2.

## 📋 Deployment Options

### Option 1: Subdomain-based (Recommended)
- Main site: `genvedha.com`
- Generated apps: `app1.genvedha.com`, `app2.genvedha.com`

### Option 2: Path-based
- Main site: `genvedha.com`
- Generated apps: `genvedha.com/apps/app1`, `genvedha.com/apps/app2`

---

## 🏠 Local Deployment (Development)

### Option 1: Different Ports with Nginx Proxy

#### Step 1: Install Nginx (if not installed)

```bash
# macOS
brew install nginx

# Ubuntu/Debian
sudo apt-get install nginx

# Start Nginx
sudo nginx
# or on macOS
brew services start nginx
```

#### Step 2: Configure Nginx for Multiple Apps

Create Nginx configuration:

```bash
sudo nano /usr/local/etc/nginx/nginx.conf
# or on Linux: sudo nano /etc/nginx/nginx.conf
```

Add this configuration:

```nginx
http {
    # Main GenVedha website
    server {
        listen 80;
        server_name localhost;

        location / {
            proxy_pass http://localhost:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }
    }

    # Generated App 1 - Organic Spice Bazaar
    server {
        listen 80;
        server_name spices.localhost;

        location / {
            proxy_pass http://localhost:3001;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }
    }

    # Generated App 2 - StyleVista
    server {
        listen 80;
        server_name stylevista.localhost;

        location / {
            proxy_pass http://localhost:3002;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }
    }

    # GenVedha LLM Service
    server {
        listen 80;
        server_name api.localhost;

        location / {
            proxy_pass http://localhost:3001;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }
    }
}
```

#### Step 3: Update /etc/hosts

```bash
sudo nano /etc/hosts
```

Add these lines:

```
127.0.0.1 localhost
127.0.0.1 spices.localhost
127.0.0.1 stylevista.localhost
127.0.0.1 api.localhost
```

#### Step 4: Start Generated Apps on Different Ports

```bash
# Terminal 1: Main GenVedha site
cd /Users/avydiya/Desktop/genvedha-website
npm start  # Runs on port 3000

# Terminal 2: Organic Spice Bazaar
cd genvedha-llm-service/generated-apps/organic-spice-bazaar-140e8a66/backend
PORT=3001 npm start

# Terminal 3: StyleVista
cd genvedha-llm-service/generated-apps/stylevista-77626dcc/backend
PORT=3002 npm start

# Terminal 4: GenVedha LLM Service
cd genvedha-llm-service
npm start  # Runs on port 3001
```

#### Step 5: Reload Nginx

```bash
sudo nginx -s reload
# or on macOS
brew services restart nginx
```

#### Step 6: Access Your Apps

- Main site: http://localhost
- Spice Bazaar: http://spices.localhost
- StyleVista: http://stylevista.localhost
- LLM Service: http://api.localhost

---

## ☁️ EC2 Deployment (Production)

### Architecture Overview

```
Internet → Route53 (DNS) → EC2 Instance → Nginx → Apps
                                           ├── genvedha.com (port 3000)
                                           ├── app1.genvedha.com (port 3001)
                                           ├── app2.genvedha.com (port 3002)
                                           └── api.genvedha.com (port 3003)
```

### Step 1: Prepare EC2 Instance

```bash
# SSH into your EC2 instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Nginx
sudo apt install nginx -y

# Install PM2 for process management
sudo npm install -g pm2

# Install MongoDB (if not using MongoDB Atlas)
# Follow: https://docs.mongodb.com/manual/tutorial/install-mongodb-on-ubuntu/
```

### Step 2: Clone and Setup Apps

```bash
# Clone your repository
cd /home/ubuntu
git clone -b production https://github.com/yogmca/genvedha.git
cd genvedha

# Install main site dependencies
npm install

# Setup GenVedha LLM Service
cd genvedha-llm-service
npm install
cp .env.example .env
nano .env  # Add Claude API key

# Generate apps will be in generated-apps folder
# For each generated app:
cd generated-apps/organic-spice-bazaar-140e8a66/backend
npm install
cd ../frontend
npm install
npm run build  # Build React app for production
```

### Step 3: Configure Nginx on EC2

```bash
sudo nano /etc/nginx/sites-available/genvedha
```

Add this configuration:

```nginx
# Main GenVedha Website
server {
    listen 80;
    server_name genvedha.com www.genvedha.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Generated App 1 - Organic Spice Bazaar
server {
    listen 80;
    server_name spices.genvedha.com;

    # Serve React frontend
    root /home/ubuntu/genvedha/genvedha-llm-service/generated-apps/organic-spice-bazaar-140e8a66/frontend/build;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to backend
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Generated App 2 - StyleVista
server {
    listen 80;
    server_name stylevista.genvedha.com;

    root /home/ubuntu/genvedha/genvedha-llm-service/generated-apps/stylevista-77626dcc/frontend/build;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# GenVedha LLM Service API
server {
    listen 80;
    server_name api.genvedha.com;

    location / {
        proxy_pass http://localhost:3003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/genvedha /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl restart nginx
```

### Step 4: Setup PM2 for Process Management

Create PM2 ecosystem file:

```bash
nano /home/ubuntu/genvedha/ecosystem.config.js
```

```javascript
module.exports = {
  apps: [
    {
      name: 'genvedha-main',
      cwd: '/home/ubuntu/genvedha',
      script: 'server.js',
      env: {
        PORT: 3000,
        NODE_ENV: 'production'
      }
    },
    {
      name: 'genvedha-llm-service',
      cwd: '/home/ubuntu/genvedha/genvedha-llm-service',
      script: 'index.js',
      env: {
        PORT: 3003,
        NODE_ENV: 'production'
      }
    },
    {
      name: 'spice-bazaar-backend',
      cwd: '/home/ubuntu/genvedha/genvedha-llm-service/generated-apps/organic-spice-bazaar-140e8a66/backend',
      script: 'server.js',
      env: {
        PORT: 3001,
        NODE_ENV: 'production'
      }
    },
    {
      name: 'stylevista-backend',
      cwd: '/home/ubuntu/genvedha/genvedha-llm-service/generated-apps/stylevista-77626dcc/backend',
      script: 'server.js',
      env: {
        PORT: 3002,
        NODE_ENV: 'production'
      }
    }
  ]
};
```

Start all apps:

```bash
cd /home/ubuntu/genvedha
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Enable auto-start on reboot
```

### Step 5: Configure DNS (GoDaddy/Route53)

Add these DNS records in your domain provider:

```
Type    Name        Value               TTL
A       @           your-ec2-ip         600
A       www         your-ec2-ip         600
A       spices      your-ec2-ip         600
A       stylevista  your-ec2-ip         600
A       api         your-ec2-ip         600
```

### Step 6: Setup SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificates for all domains
sudo certbot --nginx -d genvedha.com -d www.genvedha.com -d spices.genvedha.com -d stylevista.genvedha.com -d api.genvedha.com

# Auto-renewal is configured automatically
# Test renewal:
sudo certbot renew --dry-run
```

Certbot will automatically update your Nginx configuration to use HTTPS.

### Step 7: Configure Firewall

```bash
# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp  # SSH
sudo ufw enable
```

---

## 🔄 Automated Deployment Script

Create a deployment script for new generated apps:

```bash
nano /home/ubuntu/genvedha/deploy-generated-app.sh
```

```bash
#!/bin/bash

# Deploy Generated App Script
# Usage: ./deploy-generated-app.sh <app-folder-name> <subdomain> <port>

APP_FOLDER=$1
SUBDOMAIN=$2
PORT=$3
DOMAIN="genvedha.com"

if [ -z "$APP_FOLDER" ] || [ -z "$SUBDOMAIN" ] || [ -z "$PORT" ]; then
    echo "Usage: ./deploy-generated-app.sh <app-folder-name> <subdomain> <port>"
    echo "Example: ./deploy-generated-app.sh fashion-store-abc123 fashion 3004"
    exit 1
fi

APP_PATH="/home/ubuntu/genvedha/genvedha-llm-service/generated-apps/$APP_FOLDER"

echo "🚀 Deploying $APP_FOLDER to $SUBDOMAIN.$DOMAIN on port $PORT"

# Install dependencies
echo "📦 Installing backend dependencies..."
cd "$APP_PATH/backend"
npm install

echo "📦 Installing frontend dependencies..."
cd "$APP_PATH/frontend"
npm install

echo "🏗️  Building frontend..."
npm run build

# Add to PM2
echo "⚙️  Adding to PM2..."
pm2 start "$APP_PATH/backend/server.js" --name "$SUBDOMAIN-backend" -- --port=$PORT
pm2 save

# Add Nginx configuration
echo "🌐 Configuring Nginx..."
sudo tee "/etc/nginx/sites-available/$SUBDOMAIN" > /dev/null <<EOF
server {
    listen 80;
    server_name $SUBDOMAIN.$DOMAIN;

    root $APP_PATH/frontend/build;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

sudo ln -sf "/etc/nginx/sites-available/$SUBDOMAIN" "/etc/nginx/sites-enabled/"
sudo nginx -t && sudo systemctl reload nginx

# Get SSL certificate
echo "🔒 Getting SSL certificate..."
sudo certbot --nginx -d "$SUBDOMAIN.$DOMAIN" --non-interactive --agree-tos --email admin@genvedha.com

echo "✅ Deployment complete!"
echo "🌐 App available at: https://$SUBDOMAIN.$DOMAIN"
echo "📊 Check status: pm2 status"
echo "📝 View logs: pm2 logs $SUBDOMAIN-backend"
```

Make it executable:

```bash
chmod +x /home/ubuntu/genvedha/deploy-generated-app.sh
```

Usage:

```bash
./deploy-generated-app.sh fashion-store-abc123 fashion 3004
```

---

## 📊 Monitoring & Management

### PM2 Commands

```bash
# View all apps
pm2 list

# View logs
pm2 logs
pm2 logs genvedha-main
pm2 logs spice-bazaar-backend

# Restart apps
pm2 restart all
pm2 restart genvedha-main

# Stop apps
pm2 stop all
pm2 stop spice-bazaar-backend

# Delete app
pm2 delete spice-bazaar-backend

# Monitor
pm2 monit
```

### Nginx Commands

```bash
# Test configuration
sudo nginx -t

# Reload
sudo systemctl reload nginx

# Restart
sudo systemctl restart nginx

# View logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

---

## 🔧 Troubleshooting

### Issue: Port already in use

```bash
# Find process using port
sudo lsof -i :3001

# Kill process
sudo kill -9 <PID>
```

### Issue: Nginx configuration error

```bash
# Test configuration
sudo nginx -t

# Check syntax
sudo nginx -c /etc/nginx/nginx.conf -t
```

### Issue: SSL certificate renewal fails

```bash
# Manual renewal
sudo certbot renew --force-renewal

# Check certificate status
sudo certbot certificates
```

### Issue: App not accessible

```bash
# Check if app is running
pm2 list

# Check Nginx status
sudo systemctl status nginx

# Check firewall
sudo ufw status

# Check DNS
nslookup spices.genvedha.com
```

---

## 📈 Scaling Strategy

### For Multiple Generated Apps:

1. **Port Management**: Assign ports dynamically (3001, 3002, 3003, ...)
2. **Subdomain Creation**: Auto-create DNS records via API
3. **SSL Automation**: Use Certbot with DNS challenge for wildcard certs
4. **Load Balancing**: Use Nginx upstream for high-traffic apps
5. **Database**: Use MongoDB Atlas with separate databases per app

### Wildcard SSL Certificate:

```bash
# Get wildcard certificate
sudo certbot certonly --manual --preferred-challenges dns -d "*.genvedha.com" -d genvedha.com

# Add TXT record in DNS as instructed
# Then complete the process
```

---

## 🎯 Best Practices

1. **Use PM2** for process management
2. **Enable auto-restart** on crashes
3. **Setup monitoring** (PM2 Plus, New Relic, or Datadog)
4. **Regular backups** of generated apps
5. **Use environment variables** for sensitive data
6. **Implement rate limiting** at Nginx level
7. **Setup log rotation** to prevent disk space issues
8. **Use CDN** (CloudFlare) for static assets
9. **Monitor resource usage** (CPU, RAM, Disk)
10. **Implement health checks** for all apps

---

## 📞 Support

For issues or questions:
- Check logs: `pm2 logs`
- Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
- Contact GenVedha support

---

**Your generated apps are now deployed and accessible on subdomains!** 🎉
