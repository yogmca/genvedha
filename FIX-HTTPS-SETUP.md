# Fix HTTPS Setup - Remove Old Configuration

## Problem
The old Nginx configuration file with HTTPS settings still exists on your EC2 instance, causing the setup script to fail because it references SSL certificates that don't exist yet.

## Solution

Run these commands on your EC2 instance:

```bash
# 1. Remove the old Nginx configuration
sudo rm -f /etc/nginx/conf.d/genvedha.conf

# 2. Stop Nginx (if running)
sudo systemctl stop nginx

# 3. Pull the latest changes
git pull

# 4. Run the setup script again
sudo ./setup-https.sh
```

## What This Does

1. **Removes old config**: Deletes the problematic configuration file that references non-existent SSL certificates
2. **Stops Nginx**: Ensures a clean state
3. **Updates code**: Gets the latest fixed setup script
4. **Runs setup**: The new script will:
   - Create HTTP-only configuration first
   - Start Nginx successfully
   - Obtain SSL certificates from Let's Encrypt
   - Let Certbot configure HTTPS automatically
   - Fix deprecated http2 warnings

## Alternative: One-Line Fix

If you want to do it all at once:

```bash
sudo rm -f /etc/nginx/conf.d/genvedha.conf && sudo systemctl stop nginx && git pull && sudo ./setup-https.sh
```

## After Success

Once the script completes successfully, your site will be accessible at:
- https://genvedha.com
- https://www.genvedha.com

The SSL certificate will automatically renew via a cron job.
