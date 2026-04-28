# Fix Certbot 403 Forbidden Error

## Problem

Certbot is failing to authenticate your domains with this error:

```
Domain: genvedha.com
Type:   unauthorized
Detail: Invalid response from http://genvedha.com/.well-known/acme-challenge/...: 403

Domain: www.genvedha.com
Type:   unauthorized
Detail: Invalid response from http://www.genvedha.com/.well-known/acme-challenge/...: 403
```

## Root Cause

The 403 Forbidden error occurs when Let's Encrypt's servers cannot access the ACME challenge files that Certbot creates. This is typically caused by:

1. **Nginx configuration blocking access** to `/.well-known/acme-challenge/` directory
2. **Incorrect file permissions** on the webroot directory
3. **Missing or misconfigured webroot** directory
4. **Conflicting Nginx configurations** that override the ACME challenge location

## Solution

I've created a comprehensive fix script that addresses all these issues.

### Quick Fix (Recommended)

Run this on your EC2 instance:

```bash
# 1. Pull the latest changes
git pull

# 2. Make the fix script executable
chmod +x fix-certbot-403.sh

# 3. Run the fix script
sudo ./fix-certbot-403.sh
```

The script will prompt you for:
- Domain name (default: genvedha.com)
- Email address for SSL notifications

### What the Fix Script Does

1. **Stops Nginx** to ensure clean state
2. **Removes all conflicting configurations** that might block ACME challenges
3. **Creates proper webroot directories** with correct permissions:
   - `/var/www/html/.well-known/acme-challenge/`
   - Sets 755 permissions (readable by everyone)
   - Sets correct ownership (www-data or nginx user)
4. **Creates minimal HTTP-only Nginx config** that explicitly allows ACME challenge access
5. **Tests ACME challenge accessibility** before attempting certificate generation
6. **Uses webroot authentication method** (more reliable than nginx plugin)
7. **Obtains SSL certificate** from Let's Encrypt
8. **Updates Nginx configuration** to use HTTPS with proper redirects
9. **Sets up automatic renewal** via cron job

### Manual Fix (If Script Fails)

If the automated script fails, follow these steps manually:

#### Step 1: Clean Up Existing Configuration

```bash
# Stop Nginx
sudo systemctl stop nginx

# Remove all Nginx configurations
sudo rm -f /etc/nginx/conf.d/genvedha.conf
sudo rm -f /etc/nginx/sites-enabled/default
sudo rm -f /etc/nginx/sites-available/genvedha*

# Remove any failed certificate attempts
sudo certbot delete --cert-name genvedha.com
```

#### Step 2: Create Webroot Directory

```bash
# Create directory structure
sudo mkdir -p /var/www/html/.well-known/acme-challenge

# Set permissions (755 = readable by everyone)
sudo chmod -R 755 /var/www/html

# Set ownership (use www-data for Ubuntu/Debian, nginx for Amazon Linux)
sudo chown -R nginx:nginx /var/www/html  # Amazon Linux
# OR
sudo chown -R www-data:www-data /var/www/html  # Ubuntu/Debian
```

#### Step 3: Create Minimal Nginx Configuration

```bash
sudo tee /etc/nginx/conf.d/genvedha.conf > /dev/null << 'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name genvedha.com www.genvedha.com;

    root /var/www/html;

    # ACME challenge - MUST be accessible
    location ^~ /.well-known/acme-challenge/ {
        allow all;
        root /var/www/html;
        default_type "text/plain";
        try_files $uri =404;
    }

    # Proxy to your app
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF
```

#### Step 4: Start Nginx and Test

```bash
# Test configuration
sudo nginx -t

# Start Nginx
sudo systemctl start nginx

# Test ACME challenge directory
echo "test" | sudo tee /var/www/html/.well-known/acme-challenge/test.txt
curl http://genvedha.com/.well-known/acme-challenge/test.txt
# Should return "test"

# Clean up test file
sudo rm /var/www/html/.well-known/acme-challenge/test.txt
```

#### Step 5: Obtain Certificate Using Webroot Method

```bash
sudo certbot certonly \
    --webroot \
    --webroot-path /var/www/html \
    -d genvedha.com \
    -d www.genvedha.com \
    --non-interactive \
    --agree-tos \
    --email your-email@example.com
```

#### Step 6: Update Nginx for HTTPS

After certificate is obtained, update your Nginx configuration to use HTTPS:

```bash
sudo tee /etc/nginx/conf.d/genvedha.conf > /dev/null << 'EOF'
# HTTP - Redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name genvedha.com www.genvedha.com;

    location ^~ /.well-known/acme-challenge/ {
        allow all;
        root /var/www/html;
        default_type "text/plain";
        try_files $uri =404;
    }

    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS
server {
    listen 443 ssl;
    listen [::]:443 ssl;
    http2 on;
    
    server_name genvedha.com www.genvedha.com;

    ssl_certificate /etc/letsencrypt/live/genvedha.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/genvedha.com/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

## Verification

After running the fix:

1. **Check certificate status:**
   ```bash
   sudo certbot certificates
   ```

2. **Test HTTPS access:**
   ```bash
   curl -I https://genvedha.com
   curl -I https://www.genvedha.com
   ```

3. **Check Nginx logs if issues persist:**
   ```bash
   sudo tail -f /var/log/nginx/genvedha_error.log
   ```

4. **Verify ACME challenge accessibility:**
   ```bash
   echo "test" | sudo tee /var/www/html/.well-known/acme-challenge/test.txt
   curl http://genvedha.com/.well-known/acme-challenge/test.txt
   sudo rm /var/www/html/.well-known/acme-challenge/test.txt
   ```

## Common Issues and Solutions

### Issue: "Connection refused" when testing ACME challenge

**Solution:** Make sure your Node.js app is running on port 3000:
```bash
pm2 status
# If not running:
pm2 start server.js --name genvedha
```

### Issue: "nginx: [emerg] bind() to 0.0.0.0:80 failed"

**Solution:** Another process is using port 80:
```bash
sudo lsof -i :80
sudo systemctl stop apache2  # If Apache is running
```

### Issue: Certificate obtained but site still shows "Not Secure"

**Solution:** Check if Nginx is using the correct certificate:
```bash
sudo nginx -t
sudo systemctl reload nginx
# Clear browser cache and try again
```

### Issue: "Timeout during connect" from Let's Encrypt

**Solution:** Check AWS Security Group allows HTTP (port 80):
```bash
# In AWS Console:
# EC2 → Security Groups → Your SG → Inbound Rules
# Ensure: HTTP (80) from 0.0.0.0/0
# Ensure: HTTPS (443) from 0.0.0.0/0
```

## Automatic Renewal

The fix script sets up automatic renewal via cron. To verify:

```bash
# Check cron job
sudo crontab -l | grep certbot

# Test renewal (dry run)
sudo certbot renew --dry-run

# Manual renewal if needed
sudo certbot renew
sudo systemctl reload nginx
```

## Prevention

To prevent this issue in the future:

1. **Always use webroot method** for certificate generation instead of nginx plugin
2. **Keep ACME challenge location** in your Nginx config even after HTTPS is set up
3. **Don't block** `/.well-known/` directory in your Nginx configuration
4. **Maintain proper permissions** on webroot directory (755)
5. **Test ACME accessibility** before running Certbot

## Need Help?

If you're still experiencing issues:

1. Check the detailed logs:
   ```bash
   sudo tail -100 /var/log/letsencrypt/letsencrypt.log
   sudo tail -100 /var/log/nginx/genvedha_error.log
   ```

2. Verify DNS is pointing to your EC2 instance:
   ```bash
   dig genvedha.com
   dig www.genvedha.com
   ```

3. Test from outside your network:
   ```bash
   curl -v http://genvedha.com/.well-known/acme-challenge/test
   ```

## References

- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Certbot Documentation](https://certbot.eff.org/docs/)
- [Nginx Configuration Guide](https://nginx.org/en/docs/)
