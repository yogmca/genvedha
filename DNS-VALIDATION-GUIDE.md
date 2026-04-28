# SSL Certificate Setup - DNS Validation Method

## Why DNS Validation?

Your server is experiencing **network-level blocking** that prevents Let's Encrypt from accessing port 80 via HTTP validation. The 403 error even with standalone mode indicates:

- ✅ Port 80 is open in Security Group
- ❌ Network ACL or other AWS network layer is blocking ACME challenges
- ❌ Possible WAF or security filtering

**DNS validation bypasses this completely** by using DNS TXT records instead of HTTP.

## Step-by-Step Guide

### Step 1: Run the DNS Validation Script

On your EC2 instance:

```bash
cd ~/genvedha-website
git pull origin production
chmod +x fix-ssl-dns-validation.sh
sudo ./fix-ssl-dns-validation.sh
```

### Step 2: Enter Your Details

```
Enter your domain name: genvedha.com
Enter your email: support@genvedha.com
```

### Step 3: Add DNS TXT Records

Certbot will display something like:

```
Please deploy a DNS TXT record under the name:
_acme-challenge.genvedha.com

with the following value:
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

Before continuing, verify the TXT record has been deployed.
Press Enter to Continue
```

**Do NOT press Enter yet!**

### Step 4: Go to GoDaddy DNS Management

1. Log in to GoDaddy: https://dcc.godaddy.com/
2. Go to **My Products** → **DNS** → **Manage DNS** for genvedha.com
3. Scroll to **DNS Records** section
4. Click **Add** button

### Step 5: Add First TXT Record

Add the following record:

| Field | Value |
|-------|-------|
| Type | TXT |
| Name | `_acme-challenge` |
| Value | (paste the value Certbot provided) |
| TTL | 600 seconds |

Click **Save**

### Step 6: Add Second TXT Record (for www)

Certbot will ask for a second TXT record for www.genvedha.com:

```
Please deploy a DNS TXT record under the name:
_acme-challenge.www.genvedha.com

with the following value:
yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy
```

Add another TXT record:

| Field | Value |
|-------|-------|
| Type | TXT |
| Name | `_acme-challenge.www` |
| Value | (paste the second value Certbot provided) |
| TTL | 600 seconds |

Click **Save**

### Step 7: Wait for DNS Propagation

Wait **2-3 minutes** for DNS changes to propagate.

You can verify using:

```bash
# From your local machine or EC2
dig TXT _acme-challenge.genvedha.com
dig TXT _acme-challenge.www.genvedha.com
```

You should see the TXT records you added.

### Step 8: Complete Validation

Once DNS records are propagated:
1. Go back to your EC2 terminal
2. Press **Enter** to continue
3. Certbot will verify the DNS records
4. Certificate will be issued!

### Step 9: Verify HTTPS Works

```bash
# Test from EC2 or your local machine
curl -I https://genvedha.com
curl -I https://www.genvedha.com
```

Visit in browser:
- https://genvedha.com
- https://www.genvedha.com

## What This Script Does

1. ✅ Installs Certbot if needed
2. ✅ Stops conflicting services
3. ✅ Obtains SSL certificate via DNS validation
4. ✅ Creates Nginx configuration with SSL
5. ✅ Configures HTTP → HTTPS redirect
6. ✅ Starts Nginx and your application
7. ✅ Tests the HTTPS connection

## Certificate Renewal

**Important:** DNS validation requires manual intervention for renewal.

### Option 1: Manual Renewal (Every 90 Days)

Before certificate expires:

```bash
sudo certbot renew --manual
```

Then repeat the DNS TXT record process.

### Option 2: Automatic Renewal with GoDaddy API

For automatic renewal, you need to:

1. Get GoDaddy API credentials:
   - Go to https://developer.godaddy.com/keys
   - Create API Key and Secret

2. Install certbot-dns-godaddy plugin:
   ```bash
   pip3 install certbot-dns-godaddy
   ```

3. Create credentials file:
   ```bash
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

5. Obtain certificate with automatic DNS:
   ```bash
   sudo certbot certonly \
     --dns-godaddy \
     --dns-godaddy-credentials /root/.secrets/godaddy.ini \
     -d genvedha.com \
     -d www.genvedha.com
   ```

6. Set up auto-renewal:
   ```bash
   sudo certbot renew --dry-run
   ```

## Troubleshooting

### DNS Records Not Propagating

```bash
# Check DNS propagation
dig TXT _acme-challenge.genvedha.com @8.8.8.8
dig TXT _acme-challenge.www.genvedha.com @8.8.8.8

# Wait longer (up to 10 minutes)
# GoDaddy DNS can be slow to propagate
```

### Certbot Validation Failed

```bash
# Check Certbot logs
sudo tail -50 /var/log/letsencrypt/letsencrypt.log

# Verify TXT records are correct
# Make sure you copied the EXACT value (no spaces, no line breaks)
```

### Certificate Obtained But Site Not Working

```bash
# Check Nginx status
sudo systemctl status nginx

# Check Nginx error logs
sudo tail -50 /var/log/nginx/error.log

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### Application Not Starting

```bash
# Check PM2 status
pm2 status

# Check application logs
pm2 logs genvedha

# Restart application
pm2 restart genvedha
```

## Advantages of DNS Validation

✅ **No port 80 required** - Bypasses network blocking issues
✅ **Works with firewalls** - No inbound HTTP traffic needed
✅ **More secure** - No temporary web server exposure
✅ **Wildcard certificates** - Can issue *.genvedha.com certificates

## Disadvantages

⚠️ **Manual process** - Need to add DNS records each time
⚠️ **Renewal complexity** - Requires manual intervention or API setup
⚠️ **DNS propagation delay** - Must wait 2-10 minutes

## Next Steps After SSL Setup

1. ✅ Test HTTPS access: https://genvedha.com
2. ✅ Verify HTTP redirects to HTTPS
3. ✅ Check SSL certificate: https://www.ssllabs.com/ssltest/
4. ✅ Set up monitoring for certificate expiration
5. ✅ Consider setting up GoDaddy API for auto-renewal

## Alternative: Fix Network Blocking

If you want to use HTTP validation instead (for auto-renewal), you need to fix the network blocking:

1. **Check Network ACLs** in AWS Console:
   - VPC → Network ACLs
   - Ensure inbound rule allows port 80 from 0.0.0.0/0
   - Ensure outbound rule allows ephemeral ports (1024-65535)

2. **Check for AWS WAF**:
   - WAF & Shield → Web ACLs
   - Check if any rules are blocking ACME challenges

3. **Check for CloudFlare/CDN**:
   - If using CloudFlare, temporarily set to "DNS only" (gray cloud)
   - Disable any CDN/proxy during SSL setup

4. **Run diagnostic script**:
   ```bash
   sudo ./diagnose-ssl-issue.sh
   ```

## Support

If you encounter issues:

1. Check the logs: `/var/log/letsencrypt/letsencrypt.log`
2. Verify DNS records: `dig TXT _acme-challenge.genvedha.com`
3. Test Nginx: `sudo nginx -t`
4. Check application: `pm2 logs genvedha`

## Summary

DNS validation is the **recommended solution** for your current network blocking issue. It's reliable, secure, and bypasses all port 80 blocking problems. The only trade-off is manual renewal every 90 days, which can be automated with GoDaddy API credentials.
