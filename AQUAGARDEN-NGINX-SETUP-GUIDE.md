# AquaGarden Paradise - Nginx Configuration Guide

Complete step-by-step guide to configure Nginx for the AquaGarden Paradise app on EC2.

---

## 📋 Prerequisites

- AquaGarden app running on **port 5006** (backend)
- Frontend built and located at: `/home/ec2-user/genvedha-website/genvedha-llm-service/generated-apps/aquagarden-paradise-6f21e588/frontend/build`
- Domain: **aquagarden.com** (purchased from GoDaddy)
- DNS already pointing to your EC2 Elastic IP

---

## 🚀 Step-by-Step Configuration

### Step 1: SSH into EC2

```bash
ssh -i your-key.pem ec2-user@your-ec2-ip
```

### Step 2: Create Nginx Configuration File

```bash
sudo nano /etc/nginx/conf.d/aquagarden.conf
```

### Step 3: Add Configuration

Copy and paste this configuration:

```nginx
# AquaGarden Paradise - HTTP Configuration
server {
    listen 80;
    listen [::]:80;
    server_name aquagarden.com www.aquagarden.com;

    # Let's Encrypt SSL validation
    location ^~ /.well-known/acme-challenge/ {
        allow all;
        root /var/www/certbot;
        default_type "text/plain";
        try_files $uri =404;
    }

    # Serve React frontend from build folder
    root /home/ec2-user/genvedha-website/genvedha-llm-service/generated-apps/aquagarden-paradise-6f21e588/frontend/build;
    index index.html index.htm;

    # Handle React Router - all routes go to index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to backend on port 5006
    location /api {
        proxy_pass http://localhost:5006;
        proxy_http_version 1.1;
        
        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        
        # Standard proxy headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Don't cache API responses
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static files caching (images, CSS, JS, fonts)
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot|webp)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Logging
    access_log /var/log/nginx/aquagarden_access.log;
    error_log /var/log/nginx/aquagarden_error.log;
}
```

**Save and exit**: Press `Ctrl+X`, then `Y`, then `Enter`

---

## 🔍 Configuration Breakdown

### Key Components Explained

#### 1. **Server Block**
```nginx
server {
    listen 80;
    server_name aquagarden.com www.aquagarden.com;
```
- Listens on port 80 (HTTP)
- Responds to requests for `aquagarden.com` and `www.aquagarden.com`

#### 2. **Frontend Serving**
```nginx
root /home/ec2-user/genvedha-website/genvedha-llm-service/generated-apps/aquagarden-paradise-6f21e588/frontend/build;

location / {
    try_files $uri $uri/ /index.html;
}
```
- Serves static React files from the `build` folder
- All routes redirect to `index.html` (for React Router)

#### 3. **API Proxy**
```nginx
location /api {
    proxy_pass http://localhost:5006;
}
```
- Routes all `/api/*` requests to backend on port 5006
- Example: `https://aquagarden.com/api/products` → `http://localhost:5006/api/products`

#### 4. **Static File Caching**
```nginx
location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot|webp)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```
- Caches images, CSS, JS, fonts for 1 year
- Improves performance

---

## ✅ Step 4: Test Nginx Configuration

```bash
sudo nginx -t
```

**Expected output:**
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

If you see errors, check:
- File paths are correct
- No typos in domain name
- Port 5006 is correct

---

## 🔄 Step 5: Reload Nginx

```bash
sudo systemctl reload nginx
```

Or restart if reload doesn't work:
```bash
sudo systemctl restart nginx
```

Check Nginx status:
```bash
sudo systemctl status nginx
```

---

## 🌐 Step 6: Configure GoDaddy DNS

### Login to GoDaddy
1. Go to [https://www.godaddy.com](https://www.godaddy.com)
2. Sign in
3. Go to **My Products** → Find **aquagarden.com**
4. Click **DNS** or **Manage DNS**

### Add DNS Records

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | `YOUR_EC2_ELASTIC_IP` | 600 |
| CNAME | www | @ | 600 |

**Example:**
- If your EC2 IP is `54.123.45.67`
- A record: `@` → `54.123.45.67`
- CNAME: `www` → `@`

### Wait for DNS Propagation (10-30 minutes)

Check DNS:
```bash
nslookup aquagarden.com
```

Should return your EC2 IP address.

---

## 🔒 Step 7: Setup SSL Certificate (HTTPS)

Once DNS is propagated:

```bash
sudo certbot --nginx -d aquagarden.com -d www.aquagarden.com
```

**Follow the prompts:**
1. Enter email: `admin@genvedha.com`
2. Agree to terms: `Y`
3. Share email: `N` (optional)
4. Redirect HTTP to HTTPS: `2` (recommended)

**Certbot will:**
- ✅ Verify domain ownership
- ✅ Obtain SSL certificate
- ✅ Update Nginx configuration automatically
- ✅ Enable HTTPS
- ✅ Setup HTTP → HTTPS redirect

---

## 🧪 Step 8: Test Your App

### Test HTTP (before SSL)
```bash
curl http://aquagarden.com
```

### Test HTTPS (after SSL)
```bash
curl https://aquagarden.com
```

### Test in Browser
1. Open browser
2. Go to: `https://aquagarden.com`
3. Should see AquaGarden Paradise app
4. Check SSL certificate (padlock icon)

### Test API Endpoint
```bash
curl https://aquagarden.com/api/health
curl https://aquagarden.com/api/products
```

---

## 📊 Verify Everything is Working

### Check Backend is Running
```bash
pm2 status
```

Should show `aquagarden-backend` running on port 5006.

### Check Nginx Logs
```bash
# Access logs
sudo tail -f /var/log/nginx/aquagarden_access.log

# Error logs
sudo tail -f /var/log/nginx/aquagarden_error.log
```

### Check SSL Certificate
```bash
sudo certbot certificates
```

Should show certificate for `aquagarden.com`.

---

## 🔧 Troubleshooting

### Issue 1: 502 Bad Gateway

**Cause:** Backend not running on port 5006

**Solution:**
```bash
# Check if backend is running
pm2 status

# If not running, start it
cd ~/genvedha-website/genvedha-llm-service/generated-apps/aquagarden-paradise-6f21e588/backend
PORT=5006 pm2 start server.js --name aquagarden-backend

# Check logs
pm2 logs aquagarden-backend
```

### Issue 2: 404 Not Found

**Cause:** Frontend build folder doesn't exist

**Solution:**
```bash
# Build frontend
cd ~/genvedha-website/genvedha-llm-service/generated-apps/aquagarden-paradise-6f21e588/frontend
npm install
npm run build

# Verify build folder exists
ls -la build/
```

### Issue 3: DNS Not Resolving

**Cause:** DNS not propagated yet

**Solution:**
```bash
# Wait 10-30 minutes
# Check DNS propagation
nslookup aquagarden.com

# Use online tool
# https://www.whatsmydns.net
```

### Issue 4: SSL Certificate Fails

**Cause:** DNS not pointing to EC2 or ports not open

**Solution:**
```bash
# 1. Verify DNS
nslookup aquagarden.com
# Must return your EC2 IP

# 2. Check AWS Security Group
# Ensure ports 80 and 443 are open

# 3. Try manual certificate
sudo certbot --nginx -d aquagarden.com -d www.aquagarden.com --dry-run
```

### Issue 5: Nginx Configuration Error

**Cause:** Syntax error in config file

**Solution:**
```bash
# Test configuration
sudo nginx -t

# Check for typos in:
# - Domain name
# - File paths
# - Port numbers

# Edit configuration
sudo nano /etc/nginx/conf.d/aquagarden.conf

# Reload after fixing
sudo systemctl reload nginx
```

---

## 📝 Complete Configuration Flow

```
User Request: https://aquagarden.com
         ↓
    GoDaddy DNS
         ↓
  Resolves to: 54.123.45.67 (EC2 IP)
         ↓
    AWS EC2 Instance
         ↓
    Nginx (Port 80/443)
         ↓
  Checks server_name: aquagarden.com
         ↓
    ┌─────────────────────────────┐
    │                             │
    ├─ / (root path)              │
    │  → Serves React frontend    │
    │     from build folder       │
    │                             │
    ├─ /api/* (API requests)      │
    │  → Proxies to localhost:5006│
    │     (Backend Node.js app)   │
    │                             │
    └─────────────────────────────┘
```

---

## 🎯 Quick Command Reference

| Task | Command |
|------|---------|
| **Create config** | `sudo nano /etc/nginx/conf.d/aquagarden.conf` |
| **Test config** | `sudo nginx -t` |
| **Reload Nginx** | `sudo systemctl reload nginx` |
| **Restart Nginx** | `sudo systemctl restart nginx` |
| **Check Nginx status** | `sudo systemctl status nginx` |
| **View access logs** | `sudo tail -f /var/log/nginx/aquagarden_access.log` |
| **View error logs** | `sudo tail -f /var/log/nginx/aquagarden_error.log` |
| **Get SSL cert** | `sudo certbot --nginx -d aquagarden.com -d www.aquagarden.com` |
| **Check SSL certs** | `sudo certbot certificates` |
| **Check DNS** | `nslookup aquagarden.com` |
| **Check backend** | `pm2 status` |
| **View backend logs** | `pm2 logs aquagarden-backend` |

---

## 📚 Related Files

- **Nginx Config Example**: [`nginx-config-aquagarden-example.conf`](nginx-config-aquagarden-example.conf:1)
- **Full Deployment Guide**: [`DEPLOY-GENERATED-APPS-TO-EC2.md`](DEPLOY-GENERATED-APPS-TO-EC2.md:1)
- **GoDaddy DNS Setup**: [`GODADDY-DOMAIN-SETUP.md`](GODADDY-DOMAIN-SETUP.md:1)

---

## ✅ Deployment Checklist

- [ ] Backend running on port 5006 (`pm2 status`)
- [ ] Frontend built (`npm run build`)
- [ ] Nginx config created (`/etc/nginx/conf.d/aquagarden.conf`)
- [ ] Nginx config tested (`sudo nginx -t`)
- [ ] Nginx reloaded (`sudo systemctl reload nginx`)
- [ ] GoDaddy DNS configured (A record + CNAME)
- [ ] DNS propagated (`nslookup aquagarden.com`)
- [ ] SSL certificate obtained (`sudo certbot --nginx`)
- [ ] HTTPS working (`https://aquagarden.com`)
- [ ] API endpoints working (`https://aquagarden.com/api/products`)

---

**Your AquaGarden Paradise app is now live at https://aquagarden.com!** 🎉
