# Quick Fix for 403 SSL Error

## The Problem

You're getting **403 Forbidden** errors when trying to obtain SSL certificates, even with Certbot's standalone mode. This means:

- ✅ Your Security Group has port 80 open
- ❌ AWS Network ACL or other network layer is blocking the traffic
- ❌ Let's Encrypt cannot reach your server to validate domain ownership

## The Solution: DNS Validation

Use DNS validation instead of HTTP validation to bypass the network blocking.

## Quick Steps

### 1. On Your EC2 Instance

```bash
cd ~/genvedha-website
git pull origin production
chmod +x fix-ssl-dns-validation.sh
sudo ./fix-ssl-dns-validation.sh
```

Enter your domain and email when prompted.

### 2. When Certbot Shows TXT Record

**DO NOT PRESS ENTER YET!**

Certbot will show something like:
```
Please deploy a DNS TXT record under the name:
_acme-challenge.genvedha.com

with the following value:
abc123xyz789...
```

### 3. Add TXT Record in GoDaddy

1. Go to: https://dcc.godaddy.com/
2. **My Products** → **DNS** → **Manage DNS**
3. Click **Add** button
4. Add TXT record:
   - **Type**: TXT
   - **Name**: `_acme-challenge`
   - **Value**: (paste the value from Certbot)
   - **TTL**: 600

5. Click **Save**

### 4. Add Second TXT Record for www

Certbot will ask for another record for www.genvedha.com:

1. Click **Add** again
2. Add TXT record:
   - **Type**: TXT
   - **Name**: `_acme-challenge.www`
   - **Value**: (paste the second value from Certbot)
   - **TTL**: 600

3. Click **Save**

### 5. Wait and Verify

Wait **2-3 minutes** for DNS propagation.

Verify (optional):
```bash
dig TXT _acme-challenge.genvedha.com
```

### 6. Complete in Certbot

Go back to your EC2 terminal and press **Enter**.

Certbot will verify the DNS records and issue your certificate!

### 7. Test Your Site

```bash
curl -I https://genvedha.com
```

Visit: https://genvedha.com

## Done! 🎉

Your site should now be accessible via HTTPS with a valid SSL certificate.

## Important Notes

- **Certificate expires in 90 days**
- **Renewal requires repeating the DNS TXT record process**
- For automatic renewal, set up GoDaddy API (see DNS-VALIDATION-GUIDE.md)

## If Something Goes Wrong

### DNS Records Not Working

```bash
# Check if records are visible
dig TXT _acme-challenge.genvedha.com @8.8.8.8

# Wait longer (up to 10 minutes for GoDaddy)
```

### Certificate Obtained But Site Not Loading

```bash
# Check Nginx
sudo systemctl status nginx
sudo nginx -t

# Check application
pm2 status
pm2 logs genvedha

# Restart everything
sudo systemctl restart nginx
pm2 restart genvedha
```

### Need More Help

See detailed guide: [`DNS-VALIDATION-GUIDE.md`](DNS-VALIDATION-GUIDE.md)

## Why This Works

DNS validation doesn't require port 80 to be accessible from the internet. It only requires you to prove domain ownership by adding TXT records to your DNS, which completely bypasses the network blocking issue you're experiencing.

## Alternative: Fix the Network Blocking

If you want to fix the underlying network issue instead:

1. Check **Network ACLs** in AWS Console (VPC → Network ACLs)
2. Ensure inbound rule allows port 80 from 0.0.0.0/0
3. Ensure outbound rule allows ephemeral ports (1024-65535)
4. Run diagnostic: `sudo ./diagnose-ssl-issue.sh`

But DNS validation is **faster and more reliable** for your current situation.
