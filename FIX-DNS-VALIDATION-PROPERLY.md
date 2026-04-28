# Fix DNS Validation Properly

## The Problem
Your TXT record shows `"from Certbot"` instead of the actual validation token. Certbot generates a unique token each time, and you need to add that exact token to your DNS.

## Solution: Use HTTP-01 Challenge Instead

DNS-01 validation is complex because:
1. Certbot generates a new token each time
2. You need to manually add it to GoDaddy
3. DNS propagation takes time
4. The token expires quickly

**HTTP-01 validation is much simpler and automatic!**

## Step 1: Remove Old TXT Records
Go to GoDaddy DNS Management and **DELETE** the TXT record:
- Type: TXT
- Name: _acme-challenge
- Value: "from Certbot"

## Step 2: Use HTTP-01 Validation (Recommended)

Run this command on your EC2 instance:

```bash
sudo certbot certonly \
  --webroot \
  --webroot-path=/var/www/html \
  -d genvedha.com \
  -d www.genvedha.com \
  --email your-email@example.com \
  --agree-tos \
  --non-interactive
```

### If webroot doesn't work, use standalone:

```bash
# Stop nginx temporarily
sudo systemctl stop nginx

# Get certificate
sudo certbot certonly \
  --standalone \
  -d genvedha.com \
  -d www.genvedha.com \
  --email your-email@example.com \
  --agree-tos \
  --non-interactive

# Start nginx again
sudo systemctl start nginx
```

## Step 3: Configure Nginx with SSL

After getting the certificate, update your Nginx config:

```bash
sudo nano /etc/nginx/sites-available/genvedha
```

Add this configuration:

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name genvedha.com www.genvedha.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name genvedha.com www.genvedha.com;

    ssl_certificate /etc/letsencrypt/live/genvedha.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/genvedha.com/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    root /var/www/html;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }

    # Proxy to Node.js app if needed
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Step 4: Test and Reload

```bash
# Test nginx configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx

# Check certificate
sudo certbot certificates
```

## Step 5: Set Up Auto-Renewal

```bash
# Test renewal
sudo certbot renew --dry-run

# Certbot automatically sets up a cron job for renewal
```

## Why HTTP-01 is Better

1. **Automatic**: No manual DNS changes needed
2. **Fast**: No waiting for DNS propagation
3. **Reliable**: Works immediately
4. **Simple**: Certbot handles everything

## Troubleshooting

### If port 80 is blocked:
```bash
# Check AWS Security Group allows port 80
# Inbound rules should have:
# - Port 80 (HTTP) from 0.0.0.0/0
# - Port 443 (HTTPS) from 0.0.0.0/0
```

### If standalone fails:
```bash
# Check what's using port 80
sudo lsof -i :80

# Stop the service
sudo systemctl stop nginx
# or
sudo systemctl stop apache2
```

### Verify DNS is pointing correctly:
```bash
dig genvedha.com
dig www.genvedha.com
```

Both should show your EC2 instance's public IP.

## Quick Command Summary

```bash
# Stop nginx
sudo systemctl stop nginx

# Get certificate with standalone
sudo certbot certonly --standalone -d genvedha.com -d www.genvedha.com --email your-email@example.com --agree-tos --non-interactive

# Update nginx config (see above)
sudo nano /etc/nginx/sites-available/genvedha

# Test and start nginx
sudo nginx -t
sudo systemctl start nginx

# Verify
curl -I https://genvedha.com
```

## Next Steps

1. Delete the TXT record from GoDaddy
2. Use HTTP-01 validation (standalone method)
3. Configure Nginx with SSL
4. Test your site at https://genvedha.com

This approach is much simpler and more reliable than DNS validation!
