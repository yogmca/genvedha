# Deploy Scripts to EC2 and Fix SSL

## Quick Deploy Commands

Run these commands on your **EC2 instance** (SSH into it first):

```bash
# Navigate to your project directory
cd /path/to/genvedha-website

# Pull latest changes
git pull origin production

# Make scripts executable
chmod +x fix-ssl-dns-validation-simple.sh
chmod +x fix-network-and-ssl.sh

# Choose one option below
```

---

## Option 1: DNS Validation (RECOMMENDED - Always Works)

This bypasses all network blocking issues. Use this if you're tired of fighting with AWS Security Groups.

```bash
sudo ./fix-ssl-dns-validation-simple.sh
```

**What it does:**
- Requests SSL certificate using DNS validation
- You'll need to add TXT records to GoDaddy
- Works even if port 80 is blocked
- Takes 5-10 minutes (including DNS propagation wait)

**Steps:**
1. Run the script
2. When prompted, add TXT records to GoDaddy DNS
3. Wait 2-3 minutes for DNS propagation
4. Press Enter to continue
5. Done!

**Pros:**
- ✅ Always works, no network issues
- ✅ No need to debug AWS
- ✅ More secure

**Cons:**
- ⚠️ Manual renewal every 60-90 days
- ⚠️ Need to add DNS records each time

---

## Option 2: HTTP Validation (Automatic Renewal)

This fixes network issues and uses HTTP validation for automatic renewal.

```bash
sudo ./fix-network-and-ssl.sh
```

**What it does:**
- Diagnoses network issues
- Removes Apache2 if interfering
- Fixes firewall rules
- Requests SSL certificate using HTTP validation
- Sets up automatic renewal

**Prerequisites:**
- AWS Security Group must allow port 80 from 0.0.0.0/0
- No CloudFlare/CDN blocking requests
- Port 80 must be accessible from internet

**Pros:**
- ✅ Automatic renewal (no manual work)
- ✅ Standard approach

**Cons:**
- ⚠️ Requires network to be configured correctly
- ⚠️ May fail if AWS is blocking

---

## If Scripts Fail

### DNS Validation Failed?

**Check DNS records:**
```bash
dig TXT _acme-challenge.genvedha.com +short
dig TXT _acme-challenge.www.genvedha.com +short
```

Should show the values Certbot gave you. If not:
- Wait longer (DNS can take 5-10 minutes)
- Check you added records correctly in GoDaddy
- Make sure TTL is 600 (10 minutes)

### HTTP Validation Failed?

**Test port 80 from outside:**
```bash
# From your local machine (not EC2)
curl -I http://genvedha.com
```

If you get 403 or connection refused:
1. Check AWS Security Group (must allow 0.0.0.0/0 on port 80)
2. Check AWS Network ACL
3. Use DNS validation instead

---

## After SSL is Working

### Deploy Your Application

```bash
# Build your React app
npm run build

# Copy to web root
sudo cp -r dist/* /var/www/html/

# Set permissions
sudo chown -R www-data:www-data /var/www/html
sudo chmod -R 755 /var/www/html

# Restart Nginx
sudo systemctl restart nginx
```

### Start Your Node.js Backend

```bash
# Install PM2 if not already installed
sudo npm install -g pm2

# Start your server
pm2 start server.js --name genvedha-api

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

### Test Everything

```bash
# Test HTTPS
curl -I https://genvedha.com

# Test API
curl https://genvedha.com/api/health

# Check Nginx
sudo systemctl status nginx

# Check PM2
pm2 status

# View logs
sudo tail -f /var/log/nginx/genvedha-error.log
pm2 logs genvedha-api
```

---

## Troubleshooting

### Certificate Renewal

**For DNS validation:**
```bash
# Manual renewal (every 60-90 days)
sudo certbot renew --manual --preferred-challenges dns
```

**For HTTP validation:**
```bash
# Test renewal
sudo certbot renew --dry-run

# Manual renewal
sudo certbot renew
```

### Nginx Issues

```bash
# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# View logs
sudo tail -f /var/log/nginx/genvedha-error.log
```

### Port Issues

```bash
# Check what's using port 80
sudo lsof -i:80

# Check what's using port 443
sudo lsof -i:443

# Kill process on port 80
sudo kill -9 $(sudo lsof -ti:80)
```

---

## AWS Security Group Configuration

If you want HTTP validation to work, configure AWS Security Group:

1. Go to **AWS Console** → **EC2** → **Instances**
2. Select your instance
3. Click **Security** tab
4. Click on Security Group name
5. Click **Edit inbound rules**
6. Add these rules:

```
Type: HTTP
Protocol: TCP
Port: 80
Source: 0.0.0.0/0
Description: Allow HTTP from anywhere

Type: HTTP
Protocol: TCP
Port: 80
Source: ::/0
Description: Allow HTTP from anywhere IPv6

Type: HTTPS
Protocol: TCP
Port: 443
Source: 0.0.0.0/0
Description: Allow HTTPS from anywhere

Type: HTTPS
Protocol: TCP
Port: 443
Source: ::/0
Description: Allow HTTPS from anywhere IPv6

Type: Custom TCP
Protocol: TCP
Port: 3000
Source: 0.0.0.0/0
Description: Node.js API (if needed)
```

7. Click **Save rules**

---

## Complete Deployment Checklist

- [ ] SSH into EC2 instance
- [ ] Pull latest code: `git pull origin production`
- [ ] Make scripts executable: `chmod +x *.sh`
- [ ] Run SSL setup script (DNS or HTTP validation)
- [ ] Build React app: `npm run build`
- [ ] Copy to web root: `sudo cp -r dist/* /var/www/html/`
- [ ] Start Node.js backend: `pm2 start server.js`
- [ ] Test HTTPS: `curl -I https://genvedha.com`
- [ ] Test API: `curl https://genvedha.com/api/health`
- [ ] Visit site in browser: https://genvedha.com
- [ ] Test SSL rating: https://www.ssllabs.com/ssltest/

---

## Need Help?

See [`ULTIMATE-SSL-FIX.md`](ULTIMATE-SSL-FIX.md) for detailed troubleshooting.

**Quick reference:**
- DNS validation: Always works, manual renewal
- HTTP validation: Auto renewal, needs network config
- When in doubt: Use DNS validation
