# SSL 403 Error - Complete Solution

## Problem Summary

Your SSL certificate setup is failing with **403 Forbidden** errors during Let's Encrypt validation:

```
Domain: genvedha.com
Type: unauthorized
Detail: Invalid response from http://genvedha.com/.well-known/acme-challenge/...: 403
```

This happens **even with standalone mode**, which means:
- ✅ Port 80 is open in AWS Security Group
- ✅ Certbot is running correctly
- ❌ **AWS Network ACL or network layer is blocking ACME challenge requests**

## Root Cause

The issue is at the **AWS network layer**, not your application or Nginx:

1. **Security Group** allows port 80 ✅
2. **Network ACL** is likely blocking or filtering HTTP traffic ❌
3. Let's Encrypt's validation servers cannot reach your ACME challenge endpoint
4. This creates a 403 Forbidden response

## The Solution: DNS Validation

**Use DNS validation instead of HTTP validation** to completely bypass the network blocking issue.

### Why DNS Validation Works

- ✅ No port 80 access required
- ✅ Bypasses all network/firewall issues
- ✅ Proves domain ownership via DNS TXT records
- ✅ More secure (no temporary web server)
- ✅ Works with any network configuration

## Quick Start

### 1. Run the DNS Validation Script

On your EC2 instance:

```bash
cd ~/genvedha-website
git pull origin production
chmod +x fix-ssl-dns-validation.sh
sudo ./fix-ssl-dns-validation.sh
```

### 2. Follow the Interactive Prompts

The script will:
1. Ask for your domain (genvedha.com)
2. Ask for your email (support@genvedha.com)
3. Display instructions for adding DNS TXT records
4. Wait for you to add the records in GoDaddy
5. Validate and issue the certificate
6. Configure Nginx with SSL
7. Start your application

### 3. Add DNS TXT Records in GoDaddy

See detailed guide: [`GODADDY-DNS-TXT-RECORDS.md`](GODADDY-DNS-TXT-RECORDS.md)

**Quick steps:**
1. Go to https://dcc.godaddy.com/
2. My Products → DNS → Manage DNS
3. Add TXT record:
   - Name: `_acme-challenge`
   - Value: (from Certbot)
   - TTL: 600
4. Add second TXT record:
   - Name: `_acme-challenge.www`
   - Value: (from Certbot)
   - TTL: 600
5. Wait 2-3 minutes
6. Press Enter in Certbot

### 4. Done!

Your site will be live at:
- https://genvedha.com
- https://www.genvedha.com

## Documentation

| Document | Purpose |
|----------|---------|
| [`QUICK-FIX-403-ERROR.md`](QUICK-FIX-403-ERROR.md) | Quick reference guide |
| [`DNS-VALIDATION-GUIDE.md`](DNS-VALIDATION-GUIDE.md) | Complete DNS validation guide |
| [`GODADDY-DNS-TXT-RECORDS.md`](GODADDY-DNS-TXT-RECORDS.md) | Step-by-step GoDaddy instructions |
| [`fix-ssl-dns-validation.sh`](fix-ssl-dns-validation.sh) | Automated setup script |

## What Gets Configured

### 1. SSL Certificate
- Issued by Let's Encrypt
- Valid for 90 days
- Covers both genvedha.com and www.genvedha.com

### 2. Nginx Configuration
- HTTP (port 80) → HTTPS (port 443) redirect
- SSL/TLS with modern security settings
- Reverse proxy to Node.js app on port 3000
- Security headers (HSTS, X-Frame-Options, etc.)

### 3. Application
- Started with PM2
- Accessible via HTTPS
- Auto-restart on failure

## Certificate Renewal

### Manual Renewal (Every 90 Days)

Before certificate expires:

```bash
sudo certbot renew --manual
```

Then add new DNS TXT records as prompted.

### Automatic Renewal (Recommended)

Set up GoDaddy API for automatic renewal:

1. Get API credentials from https://developer.godaddy.com/keys

2. Install plugin:
   ```bash
   pip3 install certbot-dns-godaddy
   ```

3. Create credentials file:
   ```bash
   sudo mkdir -p /root/.secrets
   sudo nano /root/.secrets/godaddy.ini
   ```
   
   Add:
   ```ini
   dns_godaddy_key = YOUR_API_KEY
   dns_godaddy_secret = YOUR_API_SECRET
   ```

4. Secure the file:
   ```bash
   sudo chmod 600 /root/.secrets/godaddy.ini
   ```

5. Test renewal:
   ```bash
   sudo certbot renew --dry-run
   ```

6. Set up cron job:
   ```bash
   sudo crontab -e
   ```
   
   Add:
   ```
   0 0 * * 0 certbot renew --quiet --post-hook "systemctl reload nginx"
   ```

## Alternative: Fix Network Blocking

If you prefer to fix the underlying network issue instead:

### Check Network ACLs

1. Go to **AWS Console** → **VPC** → **Network ACLs**
2. Find the ACL for your subnet
3. Check **Inbound Rules**:
   - Rule 100: HTTP (80), TCP, 0.0.0.0/0, ALLOW
   - Rule 110: HTTPS (443), TCP, 0.0.0.0/0, ALLOW
4. Check **Outbound Rules**:
   - Rule 100: Custom TCP, 1024-65535, 0.0.0.0/0, ALLOW

### Run Diagnostics

```bash
sudo ./diagnose-ssl-issue.sh
```

This will check:
- DNS resolution
- Port accessibility
- Firewall rules
- AWS configuration
- Network connectivity

### Manual Security Group Fix

```bash
sudo ./fix-aws-security-group.sh
```

Or manually in AWS Console:
1. EC2 → Security Groups
2. Find your security group
3. Edit inbound rules
4. Ensure HTTP (80) and HTTPS (443) are open to 0.0.0.0/0

## Troubleshooting

### DNS Records Not Propagating

```bash
# Check DNS propagation
dig TXT _acme-challenge.genvedha.com @8.8.8.8

# Wait up to 10 minutes for GoDaddy
```

### Certificate Obtained But Site Not Working

```bash
# Check Nginx
sudo systemctl status nginx
sudo nginx -t
sudo tail -50 /var/log/nginx/error.log

# Check application
pm2 status
pm2 logs genvedha

# Restart services
sudo systemctl restart nginx
pm2 restart genvedha
```

### Certbot Validation Failed

```bash
# Check Certbot logs
sudo tail -100 /var/log/letsencrypt/letsencrypt.log

# Verify TXT records
dig TXT _acme-challenge.genvedha.com
dig TXT _acme-challenge.www.genvedha.com

# Ensure exact value match (no spaces, no line breaks)
```

### Port 80 Still Blocked

If you want to use HTTP validation:

1. Check Network ACLs (VPC → Network ACLs)
2. Check for AWS WAF rules
3. Check for CloudFlare/CDN proxy
4. Temporarily disable UFW: `sudo ufw disable`

## Testing Your SSL Setup

### Command Line Tests

```bash
# Test HTTPS
curl -I https://genvedha.com
curl -I https://www.genvedha.com

# Test HTTP redirect
curl -I http://genvedha.com

# Check certificate details
openssl s_client -connect genvedha.com:443 -servername genvedha.com
```

### Browser Tests

1. Visit https://genvedha.com
2. Check for green padlock icon
3. Click padlock → Certificate details
4. Verify issuer is "Let's Encrypt"

### SSL Labs Test

Check your SSL configuration:
https://www.ssllabs.com/ssltest/analyze.html?d=genvedha.com

Should get **A** or **A+** rating.

## Summary

| Method | Pros | Cons | Recommended |
|--------|------|------|-------------|
| **DNS Validation** | ✅ Bypasses network issues<br>✅ Works immediately<br>✅ More secure | ⚠️ Manual renewal<br>⚠️ Requires DNS access | ✅ **YES** |
| **HTTP Validation** | ✅ Auto-renewal<br>✅ Simpler setup | ❌ Requires port 80<br>❌ Network blocking issues | ❌ Not working |
| **Fix Network ACL** | ✅ Enables HTTP validation<br>✅ Auto-renewal | ⚠️ Requires AWS access<br>⚠️ Complex troubleshooting | ⚠️ Optional |

## Recommendation

**Use DNS validation** ([`fix-ssl-dns-validation.sh`](fix-ssl-dns-validation.sh)) - it's the fastest and most reliable solution for your current situation.

Once SSL is working, you can optionally:
1. Set up GoDaddy API for auto-renewal
2. Or investigate and fix the Network ACL issue for HTTP validation

## Next Steps

1. ✅ Run [`fix-ssl-dns-validation.sh`](fix-ssl-dns-validation.sh)
2. ✅ Add DNS TXT records in GoDaddy
3. ✅ Verify HTTPS works
4. ✅ Set up monitoring for certificate expiration
5. ✅ Consider GoDaddy API for auto-renewal

## Support

- **Quick Reference**: [`QUICK-FIX-403-ERROR.md`](QUICK-FIX-403-ERROR.md)
- **Full Guide**: [`DNS-VALIDATION-GUIDE.md`](DNS-VALIDATION-GUIDE.md)
- **GoDaddy Steps**: [`GODADDY-DNS-TXT-RECORDS.md`](GODADDY-DNS-TXT-RECORDS.md)
- **Diagnostics**: Run `sudo ./diagnose-ssl-issue.sh`

## Files Created

- ✅ [`fix-ssl-dns-validation.sh`](fix-ssl-dns-validation.sh) - Main setup script
- ✅ [`DNS-VALIDATION-GUIDE.md`](DNS-VALIDATION-GUIDE.md) - Complete guide
- ✅ [`QUICK-FIX-403-ERROR.md`](QUICK-FIX-403-ERROR.md) - Quick reference
- ✅ [`GODADDY-DNS-TXT-RECORDS.md`](GODADDY-DNS-TXT-RECORDS.md) - GoDaddy instructions
- ✅ [`SSL-403-ERROR-SOLUTION.md`](SSL-403-ERROR-SOLUTION.md) - This document

All files are ready to use on your EC2 instance after `git pull origin production`.
