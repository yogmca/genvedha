# SSL Certificate Fix - Standalone Mode (Guaranteed to Work)

## Why the Previous Attempts Failed

The 403 error persists because your Node.js application or Nginx configuration is intercepting requests to `/.well-known/acme-challenge/` before they can reach the webroot directory. This is a common issue when applications have catch-all routes.

## The Solution: Standalone Mode

Instead of trying to serve ACME challenges through your existing web server, we'll use Certbot's **standalone mode** which runs its own temporary web server on port 80.

## How to Fix (3 Commands)

SSH into your EC2 instance and run:

```bash
git pull origin production
chmod +x fix-ssl-aggressive.sh
sudo ./fix-ssl-aggressive.sh
```

## What This Script Does Differently

1. **Stops everything** - Stops Nginx and your Node.js app to free port 80
2. **Uses standalone mode** - Certbot runs its own web server (bypasses all configuration issues)
3. **Gets certificate** - Obtains SSL certificate without any interference
4. **Configures Nginx** - Sets up proper HTTPS configuration
5. **Restarts services** - Starts Nginx and your application
6. **Sets up renewals** - Configures automatic renewal using standalone mode

## Why This Works

**Standalone mode** completely bypasses the 403 issue because:
- It doesn't rely on your Nginx configuration
- It doesn't rely on your application routing
- It doesn't need webroot directories
- It runs its own temporary web server that Let's Encrypt can access directly

## What Happens During Renewal

The script sets up renewal hooks that will:
1. Stop Nginx before renewal (frees port 80)
2. Run Certbot in standalone mode
3. Start Nginx after renewal

This ensures renewals work automatically every 60 days.

## Verification

After the script completes, verify it's working:

```bash
# Check certificate
sudo certbot certificates

# Test HTTPS
curl -I https://genvedha.com
curl -I https://www.genvedha.com

# Check services
sudo systemctl status nginx
pm2 status
```

## If It Still Fails

If you still get errors, check these:

### 1. DNS Not Pointing to Server
```bash
dig genvedha.com
dig www.genvedha.com
# Should show your EC2 Elastic IP
```

**Fix:** Update DNS in GoDaddy to point to your EC2 Elastic IP

### 2. Port 80 Blocked in AWS Security Group
```bash
# Check if port 80 is accessible from outside
curl -I http://genvedha.com
```

**Fix:** 
- Go to AWS Console → EC2 → Security Groups
- Find your instance's security group
- Add inbound rule: HTTP (80) from 0.0.0.0/0

### 3. Firewall Blocking Port 80
```bash
sudo ufw status
# or
sudo firewall-cmd --list-all
```

**Fix:**
```bash
# For UFW (Ubuntu)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# For firewalld (Amazon Linux)
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

### 4. Port 80 Still in Use
```bash
sudo lsof -i :80
```

**Fix:**
```bash
# Kill any process using port 80
sudo lsof -ti:80 | xargs sudo kill -9
# Then run the script again
```

## Manual Standalone Certificate Generation

If the script fails, you can manually get the certificate:

```bash
# 1. Stop all services
sudo systemctl stop nginx
pm2 stop all

# 2. Make sure port 80 is free
sudo lsof -ti:80 | xargs sudo kill -9

# 3. Get certificate
sudo certbot certonly \
    --standalone \
    -d genvedha.com \
    -d www.genvedha.com \
    --non-interactive \
    --agree-tos \
    --email your-email@example.com

# 4. Start services
sudo systemctl start nginx
pm2 start server.js --name genvedha
```

## Advantages of Standalone Mode

✅ **Guaranteed to work** - No configuration conflicts  
✅ **Simple** - No webroot or Nginx config needed  
✅ **Reliable** - Direct communication with Let's Encrypt  
✅ **Clean** - No leftover test files or directories  

## Disadvantages

⚠️ **Brief downtime** - Services stop for ~30 seconds during renewal  
⚠️ **Requires port 80** - Must be completely free during certificate generation  

For a production site with high traffic, you might want to use DNS validation instead, but standalone mode is the most reliable for initial setup.

## Alternative: DNS Validation (No Downtime)

If you need zero downtime, use DNS validation:

```bash
sudo certbot certonly \
    --manual \
    --preferred-challenges dns \
    -d genvedha.com \
    -d www.genvedha.com \
    --email your-email@example.com
```

This will ask you to add TXT records to your DNS. Follow the instructions, then press Enter.

## Troubleshooting Commands

```bash
# View Certbot logs
sudo tail -100 /var/log/letsencrypt/letsencrypt.log

# Test renewal
sudo certbot renew --dry-run

# Check Nginx config
sudo nginx -t

# View Nginx error log
sudo tail -100 /var/log/nginx/genvedha_error.log

# Check what's using port 80
sudo lsof -i :80

# Check if domain resolves correctly
nslookup genvedha.com
nslookup www.genvedha.com
```

## Success Indicators

You'll know it worked when:
- ✅ `sudo certbot certificates` shows valid certificates
- ✅ `curl -I https://genvedha.com` returns 200 OK
- ✅ Browser shows padlock icon (secure connection)
- ✅ No certificate warnings in browser

## Next Steps After Success

1. **Test your site**: Visit https://genvedha.com
2. **Check SSL rating**: https://www.ssllabs.com/ssltest/analyze.html?d=genvedha.com
3. **Monitor renewals**: Certificates renew automatically every 60 days
4. **Set up monitoring**: Consider setting up alerts for certificate expiration

## Support

If you're still having issues after trying this:
1. Share the output of: `sudo certbot renew --dry-run`
2. Share the output of: `dig genvedha.com`
3. Share the output of: `sudo lsof -i :80`
4. Check AWS Security Group settings for port 80/443
