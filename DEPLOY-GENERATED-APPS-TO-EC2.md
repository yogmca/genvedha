# Deploy Generated Apps to AWS EC2 - Complete Guide

## 📋 Overview

This guide explains how to deploy multiple generated e-commerce apps on the **same AWS EC2 instance** that hosts GenVedha, reusing the existing HTTPS configuration and mapping new GoDaddy domains.

---

## 🎯 Architecture

```
Internet → GoDaddy DNS → AWS EC2 Instance → Nginx → Multiple Apps
                                              ├── genvedha.com (Main site - Port 3000)
                                              ├── freshproduce.com (Generated App 1 - Port 5003)
                                              ├── bookstore.com (Generated App 2 - Port 5004)
                                              └── aquagarden.com (Generated App 3 - Port 5006)
```

**Key Benefits:**
- ✅ Reuse existing EC2 infrastructure
- ✅ Share Nginx reverse proxy
- ✅ Reuse SSL/HTTPS setup process
- ✅ Cost-effective (one server for multiple apps)
- ✅ Centralized management with PM2

---

## ⏱️ Effort Estimation

### Time Required

| Task | Estimated Time | Complexity |
|------|---------------|------------|
| **First App Deployment** | 2-3 hours | Medium |
| **Additional Apps** | 30-45 min each | Low |
| **GoDaddy Domain Setup** | 15-20 min per domain | Low |
| **SSL Certificate Setup** | 10-15 min per domain | Low |
| **Testing & Verification** | 30 min per app | Low |

**Total for 3 Apps**: ~4-5 hours (including learning curve)

### Skill Level Required
- **Basic**: Linux command line, SSH
- **Intermediate**: Nginx configuration, PM2 process management
- **No coding required**: Just configuration

---

## 📝 Prerequisites

### What You Need

1. **AWS EC2 Instance** (Already running GenVedha)
   - Instance type: t2.small or larger recommended
   - OS: Amazon Linux 2 or Ubuntu
   - Elastic IP assigned
   - Security Group configured (ports 80, 443, 22)

2. **GoDaddy Domains** (One per generated app)
   - Domain purchased and active
   - Access to DNS management

3. **Generated Apps** (Already created locally)
   - Located in: `genvedha-llm-service/generated-apps/`
   - Each app has backend and frontend folders

4. **Existing Setup** (Already configured)
   - Nginx installed
   - Certbot installed
   - PM2 installed
   - Node.js installed

---

## 🚀 Step-by-Step Deployment Process

### Phase 1: Prepare Generated App for Deployment

#### Step 1.1: Identify Your Generated Apps

```bash
# On your local machine
cd genvedha-llm-service/generated-apps/
ls -la

# You should see folders like:
# - fresh-organic-produce-afc74cd9/
# - page-turner-books-10653c21/
# - aquagarden-paradise-6f21e588/
```

#### Step 1.2: Choose Port Numbers

Assign unique ports for each app (avoid conflicts):

| App | Backend Port | Frontend Port (Dev) | Domain |
|-----|-------------|---------------------|---------|
| GenVedha Main | 3000 | - | genvedha.com |
| GenVedha LLM Service | 3001 | - | - |
| Fresh Produce | 5003 | 3001 | freshproduce.com |
| Page Turner Books | 5004 | 3002 | bookstore.com |
| AquaGarden | 5006 | 3003 | aquagarden.com |

**Port Strategy:**
- Main site: 3000
- LLM Service: 3001
- Generated app backends: 5003, 5004, 5005, 5006...
- Frontend dev ports: 3002, 3003, 3004... (only for local testing)

#### Step 1.3: Update Backend Configuration

For each generated app, update the backend `.env` file:

```bash
# Example for fresh-organic-produce app
cd genvedha-llm-service/generated-apps/fresh-organic-produce-afc74cd9/backend

# Create/edit .env file
cat > .env << EOF
PORT=5003
NODE_ENV=production
MONGODB_URI=mongodb://localhost:27017/fresh-organic-produce
JWT_SECRET=your-secure-jwt-secret-here
FRONTEND_URL=https://freshproduce.com
EOF
```

#### Step 1.4: Build Frontend for Production

```bash
# For each app's frontend
cd genvedha-llm-service/generated-apps/fresh-organic-produce-afc74cd9/frontend

# Update API endpoint in .env or config
echo "REACT_APP_API_URL=https://freshproduce.com/api" > .env.production

# Build for production
npm install
npm run build

# This creates a 'build' folder with optimized static files
```

---

### Phase 2: Push to GitHub

#### Step 2.1: Commit Generated Apps

```bash
# From project root
cd /Users/avydiya/Desktop/genvedha-website

# Add generated apps to git
git add genvedha-llm-service/generated-apps/

# Commit
git commit -m "Add generated apps for deployment"

# Push to production branch
git push origin production
```

---

### Phase 3: Deploy to EC2

#### Step 3.1: SSH into EC2

```bash
# From your local machine
ssh -i your-key.pem ec2-user@your-ec2-ip

# Or if using Ubuntu
ssh -i your-key.pem ubuntu@your-ec2-ip
```

#### Step 3.2: Pull Latest Code

```bash
# Navigate to project directory
cd ~/genvedha-website

# Pull latest code with generated apps
git pull origin production

# Navigate to generated apps
cd genvedha-llm-service/generated-apps/
ls -la
```

#### Step 3.3: Install Dependencies for Each App

```bash
# For Fresh Organic Produce app
cd fresh-organic-produce-afc74cd9/backend
npm install

cd ../frontend
npm install
npm run build

# Repeat for other apps
cd ../../page-turner-books-10653c21/backend
npm install

cd ../frontend
npm install
npm run build

# And so on...
```

#### Step 3.4: Setup Environment Variables

```bash
# For each app backend
cd ~/genvedha-website/genvedha-llm-service/generated-apps/fresh-organic-produce-afc74cd9/backend

# Create .env file
nano .env

# Add:
PORT=5003
NODE_ENV=production
MONGODB_URI=mongodb://localhost:27017/fresh-organic-produce
JWT_SECRET=generate-a-secure-random-string-here
FRONTEND_URL=https://freshproduce.com

# Save and exit (Ctrl+X, Y, Enter)
```

---

### Phase 4: Configure PM2 Process Manager

#### Step 4.1: Create PM2 Ecosystem File

```bash
# Navigate to project root
cd ~/genvedha-website

# Create or update ecosystem.config.js
nano ecosystem.config.js
```

Add configuration for all apps:

```javascript
module.exports = {
  apps: [
    // Main GenVedha Website
    {
      name: 'genvedha-main',
      cwd: '/home/ec2-user/genvedha-website',
      script: 'server.js',
      env: {
        PORT: 3000,
        NODE_ENV: 'production'
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M'
    },
    
    // GenVedha LLM Service
    {
      name: 'genvedha-llm-service',
      cwd: '/home/ec2-user/genvedha-website/genvedha-llm-service',
      script: 'index.js',
      env: {
        PORT: 3001,
        NODE_ENV: 'production'
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M'
    },
    
    // Generated App 1: Fresh Organic Produce
    {
      name: 'fresh-produce-backend',
      cwd: '/home/ec2-user/genvedha-website/genvedha-llm-service/generated-apps/fresh-organic-produce-afc74cd9/backend',
      script: 'server.js',
      env: {
        PORT: 5003,
        NODE_ENV: 'production'
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M'
    },
    
    // Generated App 2: Page Turner Books
    {
      name: 'page-turner-backend',
      cwd: '/home/ec2-user/genvedha-website/genvedha-llm-service/generated-apps/page-turner-books-10653c21/backend',
      script: 'server.js',
      env: {
        PORT: 5004,
        NODE_ENV: 'production'
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M'
    },
    
    // Generated App 3: AquaGarden Paradise
    {
      name: 'aquagarden-backend',
      cwd: '/home/ec2-user/genvedha-website/genvedha-llm-service/generated-apps/aquagarden-paradise-6f21e588/backend',
      script: 'server.js',
      env: {
        PORT: 5006,
        NODE_ENV: 'production'
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M'
    }
  ]
};
```

#### Step 4.2: Start All Apps with PM2

```bash
# Stop any existing PM2 processes
pm2 delete all

# Start all apps from ecosystem file
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Enable PM2 to start on system boot
pm2 startup
# Follow the command it outputs

# Check status
pm2 status

# View logs
pm2 logs
```

---

### Phase 5: Configure Nginx for Multiple Domains

#### Step 5.1: Create Nginx Configuration for Each App

```bash
# Create configuration for Fresh Produce app
sudo nano /etc/nginx/conf.d/freshproduce.conf
```

Add this configuration:

```nginx
# Fresh Organic Produce - HTTP (will be upgraded to HTTPS by Certbot)
server {
    listen 80;
    server_name freshproduce.com www.freshproduce.com;

    # Let's Encrypt validation
    location ^~ /.well-known/acme-challenge/ {
        allow all;
        root /var/www/certbot;
        default_type "text/plain";
        try_files $uri =404;
    }

    # Serve React frontend from build folder
    root /home/ec2-user/genvedha-website/genvedha-llm-service/generated-apps/fresh-organic-produce-afc74cd9/frontend/build;
    index index.html;

    # Handle React routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to backend
    location /api {
        proxy_pass http://localhost:5003;
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
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Logging
    access_log /var/log/nginx/freshproduce_access.log;
    error_log /var/log/nginx/freshproduce_error.log;
}
```

**Repeat for other apps** (change domain, port, and paths):

```bash
# Page Turner Books
sudo nano /etc/nginx/conf.d/bookstore.conf
# Use port 5004, domain bookstore.com

# AquaGarden Paradise
sudo nano /etc/nginx/conf.d/aquagarden.conf
# Use port 5006, domain aquagarden.com
```

#### Step 5.2: Test and Reload Nginx

```bash
# Test Nginx configuration
sudo nginx -t

# If test passes, reload Nginx
sudo systemctl reload nginx

# Check Nginx status
sudo systemctl status nginx
```

---

### Phase 6: Configure GoDaddy DNS

For **each domain** you want to map:

#### Step 6.1: Login to GoDaddy

1. Go to [https://www.godaddy.com](https://www.godaddy.com)
2. Sign in to your account
3. Go to **My Products**
4. Find your domain (e.g., freshproduce.com)
5. Click **DNS** or **Manage DNS**

#### Step 6.2: Add DNS Records

Add these DNS records:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | `YOUR_EC2_ELASTIC_IP` | 600 |
| CNAME | www | @ | 600 |

**Example:**
- If your EC2 Elastic IP is `54.123.45.67`
- A record: `@` → `54.123.45.67`
- CNAME record: `www` → `@`

#### Step 6.3: Wait for DNS Propagation

```bash
# Check DNS propagation (from your local machine)
nslookup freshproduce.com

# Should return your EC2 IP address
# May take 10-30 minutes
```

**Verify with online tools:**
- [https://www.whatsmydns.net](https://www.whatsmydns.net)
- [https://dnschecker.org](https://dnschecker.org)

---

### Phase 7: Setup SSL Certificates (HTTPS)

#### Step 7.1: Obtain SSL Certificate for Each Domain

Once DNS is propagated, run Certbot for each domain:

```bash
# For Fresh Produce
sudo certbot --nginx -d freshproduce.com -d www.freshproduce.com

# For Page Turner Books
sudo certbot --nginx -d bookstore.com -d www.bookstore.com

# For AquaGarden
sudo certbot --nginx -d aquagarden.com -d www.aquagarden.com
```

**Certbot will:**
- ✅ Verify domain ownership
- ✅ Obtain SSL certificate from Let's Encrypt
- ✅ Automatically update Nginx configuration
- ✅ Enable HTTPS
- ✅ Setup HTTP → HTTPS redirect

#### Step 7.2: Verify SSL Certificates

```bash
# Check all certificates
sudo certbot certificates

# Should show certificates for:
# - genvedha.com
# - freshproduce.com
# - bookstore.com
# - aquagarden.com
```

#### Step 7.3: Test Auto-Renewal

```bash
# Test certificate renewal (dry run)
sudo certbot renew --dry-run

# If successful, certificates will auto-renew before expiry
```

---

### Phase 8: Testing & Verification

#### Step 8.1: Check All Services

```bash
# Check PM2 status
pm2 status

# Should show all apps running:
# - genvedha-main
# - genvedha-llm-service
# - fresh-produce-backend
# - page-turner-backend
# - aquagarden-backend

# Check logs for any errors
pm2 logs --lines 50
```

#### Step 8.2: Test Each App in Browser

Visit each domain:

1. **https://freshproduce.com**
   - Should load the Fresh Organic Produce app
   - Check SSL certificate (padlock icon)
   - Test navigation and features

2. **https://bookstore.com**
   - Should load the Page Turner Books app
   - Verify all pages work

3. **https://aquagarden.com**
   - Should load the AquaGarden Paradise app
   - Test product listings and cart

#### Step 8.3: Test API Endpoints

```bash
# From your local machine or EC2
curl https://freshproduce.com/api/health
curl https://bookstore.com/api/products
curl https://aquagarden.com/api/categories
```

---

## 🔄 Automated Deployment Script

Create a script to automate future deployments:

```bash
# Create deployment script
nano ~/genvedha-website/deploy-generated-app.sh
```

```bash
#!/bin/bash

# Deploy Generated App Script
# Usage: ./deploy-generated-app.sh <app-folder> <domain> <backend-port>

set -e

APP_FOLDER=$1
DOMAIN=$2
BACKEND_PORT=$3

if [ -z "$APP_FOLDER" ] || [ -z "$DOMAIN" ] || [ -z "$BACKEND_PORT" ]; then
    echo "Usage: ./deploy-generated-app.sh <app-folder> <domain> <backend-port>"
    echo "Example: ./deploy-generated-app.sh fresh-organic-produce-afc74cd9 freshproduce.com 5003"
    exit 1
fi

APP_PATH="/home/ec2-user/genvedha-website/genvedha-llm-service/generated-apps/$APP_FOLDER"
APP_NAME=$(echo $DOMAIN | cut -d'.' -f1)

echo "🚀 Deploying $APP_FOLDER to $DOMAIN on port $BACKEND_PORT"

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd "$APP_PATH/backend"
npm install

# Install and build frontend
echo "📦 Building frontend..."
cd "$APP_PATH/frontend"
npm install
npm run build

# Add to PM2
echo "⚙️  Starting backend with PM2..."
pm2 start "$APP_PATH/backend/server.js" --name "$APP_NAME-backend" -- --port=$BACKEND_PORT
pm2 save

# Create Nginx configuration
echo "🌐 Configuring Nginx..."
sudo tee "/etc/nginx/conf.d/$APP_NAME.conf" > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    location ^~ /.well-known/acme-challenge/ {
        allow all;
        root /var/www/certbot;
        default_type "text/plain";
        try_files \$uri =404;
    }

    root $APP_PATH/frontend/build;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:$BACKEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    access_log /var/log/nginx/${APP_NAME}_access.log;
    error_log /var/log/nginx/${APP_NAME}_error.log;
}
EOF

# Test and reload Nginx
sudo nginx -t && sudo systemctl reload nginx

# Get SSL certificate
echo "🔒 Obtaining SSL certificate..."
echo "Make sure DNS for $DOMAIN points to this server!"
read -p "Press Enter to continue..."
sudo certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos --email admin@genvedha.com

echo "✅ Deployment complete!"
echo "🌐 App available at: https://$DOMAIN"
echo "📊 Check status: pm2 status"
echo "📝 View logs: pm2 logs $APP_NAME-backend"
```

Make it executable:

```bash
chmod +x ~/genvedha-website/deploy-generated-app.sh
```

**Usage:**

```bash
./deploy-generated-app.sh fresh-organic-produce-afc74cd9 freshproduce.com 5003
./deploy-generated-app.sh page-turner-books-10653c21 bookstore.com 5004
./deploy-generated-app.sh aquagarden-paradise-6f21e588 aquagarden.com 5006
```

---

## 📊 Resource Management

### Monitor Server Resources

```bash
# Check CPU and memory usage
pm2 monit

# Check disk space
df -h

# Check memory
free -h

# Check running processes
pm2 list
```

### Recommended EC2 Instance Sizes

| Apps Running | Instance Type | vCPU | RAM | Cost/Month |
|--------------|---------------|------|-----|------------|
| 1-2 apps | t2.small | 1 | 2 GB | ~$17 |
| 3-4 apps | t2.medium | 2 | 4 GB | ~$34 |
| 5-8 apps | t2.large | 2 | 8 GB | ~$68 |
| 8+ apps | t2.xlarge | 4 | 16 GB | ~$135 |

---

## 🔧 Troubleshooting

### Issue 1: Port Already in Use

```bash
# Find process using port
sudo lsof -i :5003

# Kill process
sudo kill -9 <PID>

# Or restart PM2
pm2 restart fresh-produce-backend
```

### Issue 2: App Not Accessible

```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs fresh-produce-backend --lines 100

# Check Nginx
sudo nginx -t
sudo systemctl status nginx

# Check DNS
nslookup freshproduce.com
```

### Issue 3: SSL Certificate Fails

```bash
# Verify DNS is propagated
nslookup freshproduce.com
# Must return your EC2 IP

# Check ports 80 and 443 are open in AWS Security Group

# Try manual certificate
sudo certbot --nginx -d freshproduce.com -d www.freshproduce.com
```

### Issue 4: Out of Memory

```bash
# Check memory usage
free -h

# Restart apps to free memory
pm2 restart all

# Consider upgrading EC2 instance
```

---

## 💰 Cost Analysis

### Monthly Costs (Approximate)

| Item | Cost |
|------|------|
| **EC2 Instance (t2.medium)** | $34/month |
| **Elastic IP** | Free (if attached) |
| **Data Transfer** | ~$5-10/month |
| **GoDaddy Domains (3)** | ~$36/year ($3/month) |
| **SSL Certificates** | Free (Let's Encrypt) |
| **Total** | ~$42-47/month |

**Cost per App**: ~$14-16/month (when running 3 apps)

---

## 📈 Scaling Strategy

### When to Scale Up

**Signs you need a larger instance:**
- CPU usage consistently > 70%
- Memory usage > 80%
- Apps becoming slow
- PM2 apps restarting frequently

### Vertical Scaling (Upgrade Instance)

```bash
# Stop apps
pm2 stop all

# In AWS Console:
# 1. Stop EC2 instance
# 2. Change instance type (e.g., t2.small → t2.medium)
# 3. Start instance

# Restart apps
pm2 restart all
```

### Horizontal Scaling (Multiple Servers)

For high traffic, consider:
- Load balancer (AWS ELB)
- Multiple EC2 instances
- Separate database server (MongoDB Atlas)
- CDN for static assets (CloudFront)

---

## ✅ Deployment Checklist

### Before Deployment

- [ ] Generated apps tested locally
- [ ] Port numbers assigned (no conflicts)
- [ ] GoDaddy domains purchased
- [ ] EC2 instance has sufficient resources
- [ ] Code pushed to GitHub production branch

### During Deployment

- [ ] SSH access to EC2 working
- [ ] Code pulled from GitHub
- [ ] Dependencies installed for all apps
- [ ] Environment variables configured
- [ ] PM2 ecosystem file updated
- [ ] All apps started with PM2
- [ ] Nginx configurations created
- [ ] Nginx tested and reloaded

### After Deployment

- [ ] DNS records added in GoDaddy
- [ ] DNS propagation verified
- [ ] SSL certificates obtained
- [ ] All domains accessible via HTTPS
- [ ] Apps tested in browser
- [ ] API endpoints working
- [ ] PM2 auto-startup enabled
- [ ] Monitoring setup

---

## 🎯 Summary

### What You Accomplished

✅ **Deployed multiple generated apps** on same EC2 instance  
✅ **Reused existing infrastructure** (Nginx, PM2, Certbot)  
✅ **Mapped GoDaddy domains** to each app  
✅ **Configured HTTPS** for all domains  
✅ **Setup automated process management** with PM2  
✅ **Optimized costs** by sharing resources  

### Effort Required

- **First app**: 2-3 hours (learning + setup)
- **Additional apps**: 30-45 minutes each
- **Maintenance**: ~1 hour/month

### Skills Gained

- Multi-app deployment on single server
- Nginx reverse proxy configuration
- SSL certificate management
- PM2 process management
- DNS configuration
- Production deployment best practices

---

## 📞 Quick Command Reference

| Task | Command |
|------|---------|
| **Check PM2 status** | `pm2 status` |
| **View logs** | `pm2 logs` |
| **Restart app** | `pm2 restart app-name` |
| **Restart all** | `pm2 restart all` |
| **Check Nginx** | `sudo nginx -t` |
| **Reload Nginx** | `sudo systemctl reload nginx` |
| **Check SSL certs** | `sudo certbot certificates` |
| **Renew SSL** | `sudo certbot renew` |
| **Check DNS** | `nslookup domain.com` |
| **Monitor resources** | `pm2 monit` |

---

## 📚 Related Documentation

- [`DEPLOY-GENERATED-APPS-GUIDE.md`](DEPLOY-GENERATED-APPS-GUIDE.md:1) - Local deployment guide
- [`EC2-REDEPLOY-GUIDE.md`](EC2-REDEPLOY-GUIDE.md:1) - EC2 deployment basics
- [`GODADDY-DOMAIN-SETUP.md`](GODADDY-DOMAIN-SETUP.md:1) - GoDaddy DNS configuration
- [`setup-https.sh`](setup-https.sh:1) - HTTPS setup script

---

**Last Updated**: 2026-05-13  
**Contact**: admin@genvedha.com  
**Repository**: https://github.com/yogmca/genvedha
