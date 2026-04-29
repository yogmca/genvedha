# 🔧 Fix: App Not Running After SSL Setup

## Problem
SSL certificate is installed but the app shows TLS connection error:
```
curl: (35) TLS connect error: error:0A000126:SSL routines::unexpected eof while reading
```

## Root Causes
1. **App not running on port 3000** - PM2 may have crashed or not started
2. **Missing .env file** - App can't start without environment variables
3. **Nginx misconfiguration** - SSL settings may be incomplete
4. **Port not listening** - Nothing responding on port 3000

## Solution

### Option 1: Quick Fix (Recommended)
Run the automated fix script on your EC2 server:

```bash
# SSH into your server
ssh -i your-key.pem ubuntu@genvedha.com

# Download and run the fix script
cd /home/ubuntu/genvedha-website
wget https://raw.githubusercontent.com/yourusername/genvedha-website/main/fix-app-not-running.sh
chmod +x fix-app-not-running.sh
./fix-app-not-running.sh
```

Or run directly from your local machine:
```bash
ssh -i your-key.pem ubuntu@genvedha.com 'bash -s' < fix-app-not-running.sh
```

### Option 2: Manual Fix

#### Step 1: Check Current Status
```bash
# SSH into server
ssh -i your-key.pem ubuntu@genvedha.com

# Check PM2 status
pm2 list

# Check if port 3000 is listening
sudo netstat -tlnp | grep :3000

# Check PM2 logs
pm2 logs genvedha --lines 50
```

#### Step 2: Ensure .env File Exists
```bash
cd /home/ubuntu/genvedha-website

# Check if .env exists
ls -la .env

# If not, create it
cat > .env << 'EOF'
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://localhost:27017/genvedha
SESSION_SECRET=your-secret-key-change-this
EOF
```

#### Step 3: Restart Application
```bash
# Stop everything
pm2 stop all
sudo systemctl stop nginx

# Install dependencies
npm install --production

# Start app
pm2 delete genvedha
pm2 start server.js --name genvedha --time
pm2 save

# Start Nginx
sudo systemctl start nginx
```

#### Step 4: Verify Nginx Configuration
```bash
# Test configuration
sudo nginx -t

# If errors, recreate config
sudo nano /etc/nginx/sites-available/genvedha.com
```

Use this configuration:
```nginx
# HTTP - Redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name genvedha.com www.genvedha.com;
    
    location /.well-known/acme-challenge/ {
        root /var/www/html;
        allow all;
    }
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS - Main configuration
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name genvedha.com www.genvedha.com;

    ssl_certificate /etc/letsencrypt/live/genvedha.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/genvedha.com/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/genvedha.com/chain.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;
    
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    access_log /var/log/nginx/genvedha_access.log;
    error_log /var/log/nginx/genvedha_error.log;

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

Then reload:
```bash
sudo systemctl reload nginx
```

#### Step 5: Test Everything
```bash
# Test local connection
curl http://localhost:3000

# Test HTTPS
curl -I https://genvedha.com

# Check PM2 status
pm2 status

# Check logs
pm2 logs genvedha --lines 20
sudo tail -20 /var/log/nginx/genvedha_error.log
```

## Verification Checklist

- [ ] PM2 shows app as "online"
- [ ] Port 3000 is listening: `sudo netstat -tlnp | grep :3000`
- [ ] Local curl works: `curl http://localhost:3000`
- [ ] HTTPS works: `curl -I https://genvedha.com`
- [ ] Browser shows site at https://genvedha.com
- [ ] No errors in PM2 logs: `pm2 logs genvedha`
- [ ] No errors in Nginx logs: `sudo tail /var/log/nginx/genvedha_error.log`

## Common Issues

### Issue 1: PM2 App Keeps Crashing
```bash
# Check logs for errors
pm2 logs genvedha --lines 100

# Common causes:
# - Missing .env file
# - Wrong MongoDB URI
# - Port already in use
# - Missing dependencies
```

### Issue 2: Port 3000 Already in Use
```bash
# Find what's using port 3000
sudo lsof -i :3000

# Kill the process
sudo kill -9 <PID>

# Restart app
pm2 restart genvedha
```

### Issue 3: Nginx Can't Connect to Backend
```bash
# Check if app is running
pm2 list

# Check if port 3000 is listening
sudo netstat -tlnp | grep :3000

# Test local connection
curl http://localhost:3000
```

### Issue 4: SSL Certificate Issues
```bash
# Check certificate files exist
sudo ls -la /etc/letsencrypt/live/genvedha.com/

# Test SSL
echo | openssl s_client -connect genvedha.com:443 -servername genvedha.com

# If certificate is invalid, renew it
sudo certbot renew --force-renewal
```

## Diagnostic Script

Run this to diagnose issues:
```bash
./diagnose-app-not-running.sh
```

## Still Not Working?

1. **Check AWS Security Group**
   - Ensure ports 80 and 443 are open
   - Inbound rules should allow HTTP and HTTPS from 0.0.0.0/0

2. **Check DNS**
   - Verify DNS is pointing to correct IP: `dig genvedha.com`
   - Check propagation: https://dnschecker.org/#A/genvedha.com

3. **Check Firewall**
   ```bash
   sudo ufw status
   # Should show 80/tcp and 443/tcp as ALLOW
   ```

4. **Check Server Resources**
   ```bash
   # Check disk space
   df -h
   
   # Check memory
   free -h
   
   # Check CPU
   top
   ```

5. **Restart Everything**
   ```bash
   pm2 restart all
   sudo systemctl restart nginx
   ```

## Support

If you're still having issues:
1. Run the diagnostic script: `./diagnose-app-not-running.sh`
2. Check PM2 logs: `pm2 logs genvedha --lines 100`
3. Check Nginx logs: `sudo tail -50 /var/log/nginx/genvedha_error.log`
4. Share the output for further assistance

## Quick Commands Reference

```bash
# Check status
pm2 status
sudo systemctl status nginx

# View logs
pm2 logs genvedha
sudo tail -f /var/log/nginx/genvedha_error.log

# Restart services
pm2 restart genvedha
sudo systemctl restart nginx

# Test connections
curl http://localhost:3000
curl -I https://genvedha.com

# Check ports
sudo netstat -tlnp | grep -E ':(80|443|3000)'
```
