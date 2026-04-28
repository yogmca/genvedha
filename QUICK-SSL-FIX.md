# Quick SSL Certificate Fix - 403 Error

## The Problem
Certbot is getting 403 Forbidden errors when trying to validate your domain ownership.

## The Solution (3 Commands)

SSH into your EC2 instance and run:

```bash
# 1. Pull the latest fix
git pull

# 2. Make script executable (if needed)
chmod +x fix-certbot-403.sh

# 3. Run the fix
sudo ./fix-certbot-403.sh
```

**That's it!** The script will:
- ✓ Clean up conflicting configurations
- ✓ Create proper webroot directories with correct permissions
- ✓ Set up Nginx to allow ACME challenge access
- ✓ Obtain SSL certificate using the reliable webroot method
- ✓ Configure HTTPS with automatic redirects
- ✓ Set up automatic certificate renewal

## What to Expect

The script will ask you for:
1. **Domain name** - Press Enter to use `genvedha.com`
2. **Email address** - Enter your email for SSL notifications

Then it will automatically:
- Stop and clean Nginx
- Create webroot directories
- Configure Nginx for HTTP
- Test ACME challenge accessibility
- Obtain SSL certificate from Let's Encrypt
- Update Nginx for HTTPS
- Set up auto-renewal cron job

## After Success

Your site will be accessible at:
- ✅ https://genvedha.com
- ✅ https://www.genvedha.com

HTTP traffic will automatically redirect to HTTPS.

## If You Get Errors

### Error: "Connection refused"
**Fix:** Make sure your Node.js app is running:
```bash
pm2 status
pm2 start server.js --name genvedha  # If not running
```

### Error: "Timeout during connect"
**Fix:** Check AWS Security Group allows HTTP traffic:
- Go to AWS Console → EC2 → Security Groups
- Find your instance's security group
- Ensure inbound rules allow:
  - HTTP (port 80) from 0.0.0.0/0
  - HTTPS (port 443) from 0.0.0.0/0

### Error: "Domain not pointing to this server"
**Fix:** Verify DNS settings in GoDaddy:
```bash
# Check DNS resolution
dig genvedha.com
dig www.genvedha.com
# Should show your EC2 Elastic IP
```

### Still Having Issues?
Check the detailed guide: [`CERTBOT-403-FIX.md`](CERTBOT-403-FIX.md)

## Verify It's Working

```bash
# Check certificate status
sudo certbot certificates

# Test HTTPS
curl -I https://genvedha.com

# Check Nginx status
sudo systemctl status nginx
```

## Why This Fixes the 403 Error

The original issue was that Nginx was blocking access to the `/.well-known/acme-challenge/` directory that Let's Encrypt needs to verify domain ownership.

The fix script:
1. **Creates the webroot directory** at `/var/www/html/.well-known/acme-challenge/`
2. **Sets proper permissions** (755) so it's readable by everyone
3. **Configures Nginx** to explicitly allow access to this directory
4. **Uses webroot authentication** instead of the nginx plugin (more reliable)
5. **Tests accessibility** before attempting certificate generation

This ensures Let's Encrypt can successfully access the challenge files and verify you own the domain.

## Maintenance

The certificate will automatically renew every 60 days via cron job.

To manually renew:
```bash
sudo certbot renew
sudo systemctl reload nginx
```

To check when renewal is due:
```bash
sudo certbot certificates
```
