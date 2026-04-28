# 🚨 GenVedha.com Site Down - Diagnosis & Fix

**Date**: 2026-04-28 23:32 IST  
**Status**: ❌ Site Not Accessible

---

## 🔍 Current Issues Identified

### 1. **HTTPS (Port 443) - SSL/TLS Error** ❌
```
Error: SSL routines:ST_CONNECT:tlsv1 unrecognized name
```
- SSL certificate is misconfigured or expired
- Certificate may not match the domain name

### 2. **HTTP (Port 80) - 405 Method Not Allowed** ⚠️
```
HTTP/1.1 405 Method Not Allowed
```
- Server is responding but rejecting HEAD requests
- Nginx is running but misconfigured

### 3. **Direct IP Access Works** ✅
```
http://3.11.178.44 → Returns 200 OK
http://3.11.178.44:3000 → Application running
```
- Node.js app is running on port 3000
- Nginx is proxying on port 80
- **The application itself is working fine!**

### 4. **DNS Configuration Issue** ⚠️
```
genvedha.com resolves to 3 IPs:
- 3.33.130.190
- 15.197.148.33
- 3.11.178.44 (your EC2)
```
- Domain has multiple A records (GoDaddy parking/forwarding)
- This is causing SSL certificate validation issues

---

## 🎯 Root Cause

**The main issue is DNS configuration in GoDaddy:**
- GoDaddy's default parking/forwarding IPs are still active
- Your domain resolves to multiple IPs, confusing SSL certificate validation
- The 405 error suggests Nginx is blocking certain HTTP methods

---

## ✅ Step-by-Step Fix

### **Step 1: Fix GoDaddy DNS Records** (CRITICAL)

1. **Login to GoDaddy**:
   - Go to: https://www.godaddy.com
   - Sign in to your account

2. **Access DNS Management**:
   - Click "My Products"
   - Find `genvedha.com`
   - Click "DNS" or "Manage DNS"

3. **Remove Old A Records**:
   - Look for A records pointing to:
     - `3.33.130.190` ❌ DELETE
     - `15.197.148.33` ❌ DELETE
   - These are GoDaddy parking IPs

4. **Keep/Update Only Your EC2 IP**:
   ```
   Type: A
   Name: @
   Value: 3.11.178.44
   TTL: 600
   ```

5. **Add WWW Record** (if not exists):
   ```
   Type: CNAME
   Name: www
   Value: @
   TTL: 600
   ```

6. **Remove Domain Forwarding**:
   - In GoDaddy, check "Domain Settings"
   - If "Forwarding" is enabled, **disable it**
   - Forwarding conflicts with direct DNS

7. **Save Changes** and wait 10-30 minutes for DNS propagation

---

### **Step 2: SSH into EC2 and Fix SSL Certificate**

Once DNS is fixed (only shows 3.11.178.44), run these commands:

```bash
# SSH into your EC2 instance
ssh -i ~/path/to/your-key.pem ec2-user@3.11.178.44

# Navigate to project directory
cd ~/genvedha-website

# Check current Nginx configuration
sudo nginx -t

# Check current SSL certificates
sudo certbot certificates

# Remove old/invalid certificates
sudo certbot delete --cert-name genvedha.com

# Stop Nginx temporarily
sudo systemctl stop nginx

# Obtain fresh SSL certificate (standalone mode)
sudo certbot certonly --standalone -d genvedha.com -d www.genvedha.com --email admin@genvedha.com --agree-tos --non-interactive

# Update Nginx configuration
sudo nano /etc/nginx/conf.d/genvedha.conf
```

**Nginx Configuration** (`/etc/nginx/conf.d/genvedha.conf`):
```nginx
# HTTP - Redirect to HTTPS
server {
    listen 80;
    server_name genvedha.com www.genvedha.com;
    
    # Allow Let's Encrypt validation
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    # Redirect all other traffic to HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS
server {
    listen 443 ssl http2;
    server_name genvedha.com www.genvedha.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/genvedha.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/genvedha.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
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
    }
}
```

**Continue with:**
```bash
# Test Nginx configuration
sudo nginx -t

# Start Nginx
sudo systemctl start nginx

# Enable Nginx auto-start
sudo systemctl enable nginx

# Check status
sudo systemctl status nginx

# Verify PM2 is running
pm2 status

# If app not running, start it
pm2 start server.js --name genvedha-website
pm2 save

# Setup auto-renewal for SSL
sudo certbot renew --dry-run
```

---

### **Step 3: Verify AWS Security Group**

Ensure these ports are open in AWS Console:

1. Go to: **AWS Console → EC2 → Security Groups**
2. Select your instance's security group
3. **Inbound Rules** should have:

| Type | Protocol | Port | Source | Description |
|------|----------|------|--------|-------------|
| SSH | TCP | 22 | 0.0.0.0/0 | SSH access |
| HTTP | TCP | 80 | 0.0.0.0/0 | HTTP |
| HTTPS | TCP | 443 | 0.0.0.0/0 | HTTPS |
| Custom TCP | TCP | 3000 | 0.0.0.0/0 | Node.js (optional) |

---

## 🧪 Testing & Verification

### Test 1: DNS Resolution
```bash
# From your local machine
nslookup genvedha.com

# Should return ONLY:
# Address: 3.11.178.44
```

### Test 2: HTTP Access
```bash
curl -I http://genvedha.com
# Should return: 301 Moved Permanently (redirect to HTTPS)
```

### Test 3: HTTPS Access
```bash
curl -I https://genvedha.com
# Should return: 200 OK
```

### Test 4: Browser Test
1. Open browser
2. Go to: https://genvedha.com
3. Should load without SSL warnings
4. Check certificate (click padlock icon)

### Test 5: WWW Subdomain
```bash
curl -I https://www.genvedha.com
# Should return: 200 OK
```

---

## 📊 Expected Timeline

| Step | Time Required |
|------|---------------|
| Fix GoDaddy DNS | 5 minutes |
| DNS Propagation | 10-30 minutes |
| SSH & Fix SSL | 10 minutes |
| Verification | 5 minutes |
| **Total** | **30-50 minutes** |

---

## 🔧 Quick Fix Script

Save this as `fix-site-now.sh` on EC2:

```bash
#!/bin/bash

echo "🔧 Fixing GenVedha.com SSL and Nginx..."

# Stop Nginx
echo "Stopping Nginx..."
sudo systemctl stop nginx

# Remove old certificates
echo "Removing old SSL certificates..."
sudo certbot delete --cert-name genvedha.com --non-interactive || true

# Get fresh certificate
echo "Obtaining new SSL certificate..."
sudo certbot certonly --standalone \
  -d genvedha.com \
  -d www.genvedha.com \
  --email admin@genvedha.com \
  --agree-tos \
  --non-interactive

# Create Nginx config
echo "Creating Nginx configuration..."
sudo tee /etc/nginx/conf.d/genvedha.conf > /dev/null <<'EOF'
server {
    listen 80;
    server_name genvedha.com www.genvedha.com;
    
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name genvedha.com www.genvedha.com;

    ssl_certificate /etc/letsencrypt/live/genvedha.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/genvedha.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

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
    }
}
EOF

# Test Nginx config
echo "Testing Nginx configuration..."
sudo nginx -t

# Start Nginx
echo "Starting Nginx..."
sudo systemctl start nginx
sudo systemctl enable nginx

# Check PM2
echo "Checking application status..."
pm2 status

echo "✅ Done! Test your site: https://genvedha.com"
```

**Usage:**
```bash
chmod +x fix-site-now.sh
./fix-site-now.sh
```

---

## 🚨 Important Notes

1. **DNS MUST be fixed first** - Remove GoDaddy parking IPs
2. **Wait for DNS propagation** - Don't rush to fix SSL before DNS is clean
3. **Backup before changes**:
   ```bash
   sudo cp /etc/nginx/conf.d/genvedha.conf /etc/nginx/conf.d/genvedha.conf.backup
   ```

---

## 📞 Troubleshooting

### Issue: DNS still shows multiple IPs
**Solution**: 
- Clear local DNS cache
- Wait longer (up to 2 hours)
- Check on https://www.whatsmydns.net

### Issue: SSL certificate fails
**Solution**:
```bash
# Check DNS first
nslookup genvedha.com

# Must show only 3.11.178.44
# If not, wait for DNS propagation

# Check ports are open
sudo netstat -tlnp | grep -E ':(80|443)'

# Check firewall
sudo ufw status
```

### Issue: 502 Bad Gateway
**Solution**:
```bash
# Check if app is running
pm2 status

# Restart app
pm2 restart genvedha-website

# Check logs
pm2 logs genvedha-website
```

---

## 📋 Checklist

Before declaring site fixed:

- [ ] DNS shows only 3.11.178.44 (no parking IPs)
- [ ] `curl -I http://genvedha.com` returns 301 redirect
- [ ] `curl -I https://genvedha.com` returns 200 OK
- [ ] Browser loads https://genvedha.com without warnings
- [ ] SSL certificate is valid (check in browser)
- [ ] WWW subdomain works: https://www.genvedha.com
- [ ] PM2 shows app is online
- [ ] Nginx status is active

---

## 🎯 Summary

**Current State**: Site down due to DNS + SSL issues  
**Root Cause**: Multiple DNS A records + SSL certificate mismatch  
**Fix Priority**: 
1. Clean up GoDaddy DNS (remove parking IPs)
2. Wait for DNS propagation
3. Regenerate SSL certificate
4. Update Nginx configuration

**ETA to Fix**: 30-50 minutes (including DNS propagation)

---

**Last Updated**: 2026-04-28 23:32 IST  
**Your EC2 IP**: 3.11.178.44  
**Domain**: genvedha.com
