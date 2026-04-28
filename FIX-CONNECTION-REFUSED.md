# Fix "Connection Refused" Error for SSL Certificate

## The Problem
Certbot is getting "Connection refused" when trying to validate your domain. This means Let's Encrypt cannot reach your server on port 80.

## Root Cause
The error shows:
```
3.11.178.44: Fetching http://genvedha.com/.well-known/acme-challenge/...
Connection refused
```

This happens because:
1. **AWS Security Group is blocking port 80**, OR
2. **Firewall (ufw) is blocking port 80**, OR
3. **Nothing is listening on port 80**

## Solution Steps

### Step 1: Fix AWS Security Group (MOST LIKELY ISSUE)

1. Go to AWS Console: https://console.aws.amazon.com/ec2/
2. Click on **Security Groups** in the left menu
3. Find your instance's security group
4. Click **Edit inbound rules**
5. Make sure you have these rules:

```
Type        Protocol    Port Range    Source          Description
HTTP        TCP         80            0.0.0.0/0       Allow HTTP
HTTP        TCP         80            ::/0            Allow HTTP IPv6
HTTPS       TCP         443           0.0.0.0/0       Allow HTTPS
HTTPS       TCP         443           ::/0            Allow HTTPS IPv6
SSH         TCP         22            0.0.0.0/0       Allow SSH
Custom TCP  TCP         3000          0.0.0.0/0       Node.js app (optional)
```

6. Click **Save rules**

### Step 2: Check and Fix Firewall on EC2

Run these commands on your EC2 instance:

```bash
# Check firewall status
sudo ufw status

# If active, allow ports 80 and 443
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp

# Or disable firewall temporarily for testing
sudo ufw disable
```

### Step 3: Verify Port 80 is Reachable

From your EC2 instance, test if port 80 is reachable:

```bash
# Check your public IP
curl ifconfig.me

# Test from outside (use a different computer or online tool)
# Visit: http://genvedha.com
# Or use: telnet genvedha.com 80
```

### Step 4: Use the Standalone Method

Once ports are open, run this script:

```bash
cd ~/genvedha-website
chmod +x fix-ssl-standalone-proper.sh
sudo ./fix-ssl-standalone-proper.sh
```

This script will:
1. Stop all services using port 80
2. Get the SSL certificate using standalone mode
3. Configure Nginx properly
4. Start everything back up

## Manual Method (If Script Fails)

### 1. Stop all web services
```bash
sudo systemctl stop nginx
sudo systemctl stop apache2 2>/dev/null || true
```

### 2. Verify ports are free
```bash
sudo lsof -i:80
sudo lsof -i:443
```

### 3. Get certificate
```bash
sudo certbot certonly \
  --standalone \
  --preferred-challenges http \
  -d genvedha.com \
  -d www.genvedha.com \
  --email your-email@example.com \
  --agree-tos \
  --non-interactive
```

### 4. Configure Nginx
```bash
sudo nano /etc/nginx/sites-available/genvedha
```

Paste this configuration:

```nginx
server {
    listen 80;
    server_name genvedha.com www.genvedha.com;
    
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name genvedha.com www.genvedha.com;

    ssl_certificate /etc/letsencrypt/live/genvedha.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/genvedha.com/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    root /var/www/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

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

### 5. Enable and start Nginx
```bash
sudo ln -sf /etc/nginx/sites-available/genvedha /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl start nginx
sudo systemctl enable nginx
```

## Verification Steps

### 1. Check DNS
```bash
dig genvedha.com
dig www.genvedha.com
```
Both should show your EC2 public IP.

### 2. Test HTTP access
```bash
curl -I http://genvedha.com
```
Should return a redirect to HTTPS.

### 3. Test HTTPS access
```bash
curl -I https://genvedha.com
```
Should return 200 OK.

### 4. Check certificate
```bash
sudo certbot certificates
```

### 5. Test in browser
Visit: https://genvedha.com

## Common Errors and Fixes

### Error: "Connection refused"
**Fix:** Check AWS Security Group allows port 80 from 0.0.0.0/0

### Error: "Timeout"
**Fix:** DNS not pointing to your server. Update A records in GoDaddy.

### Error: "Port 80 already in use"
**Fix:** 
```bash
sudo lsof -i:80
sudo systemctl stop nginx
sudo systemctl stop apache2
```

### Error: "Certificate already exists"
**Fix:**
```bash
sudo certbot delete --cert-name genvedha.com
```

## Quick Checklist

- [ ] AWS Security Group allows port 80 (0.0.0.0/0)
- [ ] AWS Security Group allows port 443 (0.0.0.0/0)
- [ ] Firewall (ufw) allows ports 80 and 443
- [ ] DNS A record: genvedha.com → Your EC2 IP
- [ ] DNS A record: www.genvedha.com → Your EC2 IP
- [ ] No services running on port 80 before Certbot
- [ ] Waited 5-10 minutes after DNS changes

## Need Help?

If you're still stuck, run this diagnostic:

```bash
echo "=== Server IP ==="
curl -s ifconfig.me

echo -e "\n=== DNS Resolution ==="
dig +short genvedha.com
dig +short www.genvedha.com

echo -e "\n=== Port 80 Status ==="
sudo lsof -i:80 || echo "Port 80 is free"

echo -e "\n=== Port 443 Status ==="
sudo lsof -i:443 || echo "Port 443 is free"

echo -e "\n=== Firewall Status ==="
sudo ufw status

echo -e "\n=== Nginx Status ==="
sudo systemctl status nginx --no-pager
```

Share the output for further troubleshooting.
