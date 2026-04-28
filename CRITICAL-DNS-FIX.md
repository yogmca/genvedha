# 🚨 CRITICAL: DNS Points to Wrong IP Address

## The Real Problem

Your diagnostic shows:
- **Your server's IP**: 3.11.178.44
- **DNS currently points to**: Different IP (old server)

This is why you're getting 403 errors - Let's Encrypt is trying to validate a **different server**, not your current one!

## Immediate Fix Required

### Step 1: Update DNS in GoDaddy

1. **Go to GoDaddy DNS Management:**
   - Login to GoDaddy
   - Go to: My Products → Domains → genvedha.com → DNS

2. **Update A Records:**

   Find and edit these records:

   **Record 1:**
   - Type: A
   - Name: @ (or genvedha.com)
   - Value: **3.11.178.44** ← Your current server IP
   - TTL: 600 (10 minutes)

   **Record 2:**
   - Type: A
   - Name: www
   - Value: **3.11.178.44** ← Your current server IP
   - TTL: 600 (10 minutes)

3. **Save Changes**

4. **Wait 5-10 minutes** for DNS propagation

### Step 2: Verify DNS Update

From your local machine (not EC2), run:

```bash
# Check if DNS is updated
dig genvedha.com +short
dig www.genvedha.com +short

# Both should return: 3.11.178.44
```

Or use online tool: https://dnschecker.org/#A/genvedha.com

### Step 3: Start Nginx

On your EC2 instance:

```bash
# Start Nginx
sudo systemctl start nginx

# Verify it's running
sudo systemctl status nginx

# Check if port 80 is listening
sudo netstat -tlnp | grep :80
```

### Step 4: Run SSL Setup

Once DNS is updated and Nginx is running:

```bash
cd ~/genvedha-website
git pull origin production
sudo ./fix-ssl-aggressive.sh
```

## Why This Happened

You likely:
1. Created a new EC2 instance with a new Elastic IP (3.11.178.44)
2. But forgot to update DNS records in GoDaddy
3. DNS still points to your old server/IP
4. Let's Encrypt validates the old server, which returns 403

## Quick Verification Checklist

Before running SSL setup, verify:

```bash
# 1. Check your server's public IP
curl ifconfig.me
# Should show: 3.11.178.44

# 2. Check DNS resolution
dig genvedha.com +short
# Should show: 3.11.178.44

# 3. Check Nginx is running
sudo systemctl status nginx
# Should show: active (running)

# 4. Check port 80 is listening
sudo netstat -tlnp | grep :80
# Should show nginx listening on port 80

# 5. Test local access
curl -I http://localhost
# Should return HTTP response (not connection refused)
```

## If DNS Takes Too Long to Propagate

You can use DNS validation instead of HTTP validation:

```bash
sudo certbot certonly \
    --manual \
    --preferred-challenges dns \
    -d genvedha.com \
    -d www.genvedha.com \
    --email your-email@example.com
```

This will ask you to add TXT records to DNS, which works regardless of A record propagation.

## Current Status Summary

❌ **DNS**: Points to wrong IP (old server)  
❌ **Nginx**: Not running  
✅ **Security Group**: Ports 80/443 are open  
✅ **Server**: Running and accessible  

## Action Plan

1. **NOW**: Update DNS in GoDaddy to point to 3.11.178.44
2. **NOW**: Start Nginx: `sudo systemctl start nginx`
3. **Wait 10 minutes**: For DNS propagation
4. **Verify**: Run `dig genvedha.com +short` (should show 3.11.178.44)
5. **Then**: Run `sudo ./fix-ssl-aggressive.sh`

## Alternative: Use Current IP Temporarily

If you want to test SSL setup while waiting for DNS:

```bash
# Edit /etc/hosts on your EC2 instance
echo "3.11.178.44 genvedha.com www.genvedha.com" | sudo tee -a /etc/hosts

# This won't help with Let's Encrypt validation, but you can test Nginx config
```

## Need Help with GoDaddy DNS?

See the detailed guide: [`GODADDY-DOMAIN-SETUP.md`](GODADDY-DOMAIN-SETUP.md)

Or follow this quick guide:
1. Login: https://dcc.godaddy.com/
2. Click on your domain: genvedha.com
3. Click "DNS" or "Manage DNS"
4. Find A records for @ and www
5. Click edit (pencil icon)
6. Change IP to: 3.11.178.44
7. Save
8. Wait 10 minutes
