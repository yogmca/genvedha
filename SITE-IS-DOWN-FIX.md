# 🚨 SITE DOWN - IMMEDIATE FIX REQUIRED

## Current Status (as of 2026-04-29 03:13 UTC)

### ✅ What's Working
- ✅ DNS is resolving correctly to AWS IPs: 15.197.148.33, 3.33.130.190, 3.11.178.44
- ✅ HTTP (port 80) is responding (405 Method Not Allowed - server is running)
- ✅ Server is running on EC2

### ❌ What's NOT Working
- ❌ HTTPS (port 443) has SSL/TLS error: `tlsv1 unrecognized name`
- ❌ SSL certificate is either missing, misconfigured, or expired
- ❌ Users cannot access https://genvedha.com

## 🎯 Root Cause

The SSL certificate is not properly configured. The error `tlsv1 unrecognized name` indicates:
1. SSL certificate might not be installed
2. Nginx/web server might not be configured for SSL
3. Certificate might be for wrong domain
4. SNI (Server Name Indication) configuration issue

## 🔧 IMMEDIATE FIX - SSH to Server and Run These Commands

### Step 1: SSH to Your EC2 Server

```bash
# Use your EC2 key pair
ssh -i your-key.pem ubuntu@genvedha.com
# OR
ssh -i your-key.pem ubuntu@15.197.148.33
```

### Step 2: Check Current Status

```bash
# Check if Nginx is running
sudo systemctl status nginx

# Check if SSL certificates exist
sudo ls -la /etc/letsencrypt/live/genvedha.com/

# Check Nginx configuration
sudo nginx -t

# Check what's listening on port 443
sudo netstat -tlnp | grep :443
```

### Step 3: Fix SSL Certificate

```bash
# Stop Nginx temporarily
sudo systemctl stop nginx

# Stop your Node.js app temporarily
pm2 stop all

# Get fresh SSL certificate using standalone mode
sudo certbot certonly --standalone \
  --preferred-challenges http \
  --agree-tos \
  --email your-email@example.com \
  --domains genvedha.com,www.genvedha.com \
  --non-interactive

# If that fails, try with just the main domain
sudo certbot certonly --standalone \
  --preferred-challenges http \
  --agree-tos \
  --email your-email@example.com \
  --domains genvedha.com \
  --non-interactive
```

### Step 4: Configure Nginx for SSL

Create or update Nginx configuration:

```bash
sudo nano /etc/nginx/sites-available/genvedha
```

Paste this configuration:

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
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

# HTTPS Server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
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

    # Proxy to Node.js app
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

### Step 5: Enable Configuration and Restart Services

```bash
# Create symbolic link if it doesn't exist
sudo ln -sf /etc/nginx/sites-available/genvedha /etc/nginx/sites-enabled/

# Remove default configuration if it exists
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# If test passes, restart Nginx
sudo systemctl restart nginx

# Start your Node.js app
pm2 restart all

# Enable Nginx to start on boot
sudo systemctl enable nginx
```

### Step 6: Verify It's Working

```bash
# Check Nginx status
sudo systemctl status nginx

# Check SSL certificate
sudo certbot certificates

# Test from server
curl -I https://genvedha.com

# Check logs if there are issues
sudo tail -f /var/log/nginx/error.log
```

## 🔍 Alternative: If Certbot Fails

If certbot fails due to security group issues, you need to ensure ports 80 and 443 are open:

### Check AWS Security Group

1. Go to AWS Console: https://console.aws.amazon.com/ec2/v2/home#SecurityGroups:
2. Find security group: `sg-01b24f42694bc45f6` (launch-wizard-1)
3. Ensure these inbound rules exist:
   - **HTTP**: TCP port 80 from 0.0.0.0/0
   - **HTTPS**: TCP port 443 from 0.0.0.0/0
   - **SSH**: TCP port 22 from your IP
   - **Custom TCP**: TCP port 3000 from 0.0.0.0/0 (optional, for direct access)

### Add Missing Rules via AWS Console

1. Select the security group
2. Click "Edit inbound rules"
3. Click "Add rule"
4. Select "HTTP" (port 80 will auto-fill)
5. Source: 0.0.0.0/0
6. Click "Add rule" again
7. Select "HTTPS" (port 443 will auto-fill)
8. Source: 0.0.0.0/0
9. Click "Save rules"

Then retry the SSL certificate installation.

## 🚀 Quick One-Liner Fix (If Scripts Exist on Server)

If you have the fix scripts on your server:

```bash
# SSH to server
ssh -i your-key.pem ubuntu@genvedha.com

# Navigate to project
cd /home/ubuntu/genvedha-website

# Pull latest changes
git pull origin production

# Run the aggressive SSL fix
sudo ./fix-ssl-aggressive.sh
```

## 📊 Expected Timeline

- **Step 1-2**: 2 minutes (SSH and check status)
- **Step 3**: 2-3 minutes (Get SSL certificate)
- **Step 4-5**: 3-5 minutes (Configure and restart)
- **Step 6**: 1 minute (Verify)

**Total Time**: ~10-15 minutes

## ✅ Success Indicators

After completing the fix, you should see:

```bash
# From your local machine
curl -I https://genvedha.com
# Should return: HTTP/2 200 OK

# SSL test
openssl s_client -connect genvedha.com:443 -servername genvedha.com
# Should show valid certificate
```

## 🆘 If Still Not Working

1. **Check PM2 logs**:
   ```bash
   pm2 logs
   ```

2. **Check Nginx error logs**:
   ```bash
   sudo tail -100 /var/log/nginx/error.log
   ```

3. **Check if app is running**:
   ```bash
   pm2 status
   curl http://localhost:3000
   ```

4. **Restart everything**:
   ```bash
   pm2 restart all
   sudo systemctl restart nginx
   ```

## 📝 Important Notes

- The error `tlsv1 unrecognized name` means SSL is partially configured but not working correctly
- HTTP (port 80) is responding, which is good - server is running
- You just need to fix the SSL/HTTPS configuration
- Make sure to replace `your-email@example.com` with your actual email in certbot commands

## 🔗 Quick Links

- **AWS Security Groups**: https://console.aws.amazon.com/ec2/v2/home#SecurityGroups:group-id=sg-01b24f42694bc45f6
- **SSL Test**: https://www.ssllabs.com/ssltest/analyze.html?d=genvedha.com
- **DNS Check**: https://dnschecker.org/#A/genvedha.com

---

**Last Updated**: 2026-04-29 03:13 UTC  
**Status**: Site is down - SSL configuration issue  
**Priority**: 🔴 CRITICAL - Immediate action required
