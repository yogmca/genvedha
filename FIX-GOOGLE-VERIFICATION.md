# Fix Google Search Console Verification Error

## Problem
Google Search Console says: "We couldn't find your verification meta tag"

## Root Cause
The verification meta tag exists in your local `public/index.html` file but you're working directly on EC2, so you need to restart the application on the server.

## Solution

### Step 1: Verify the tag is in your index.html
The tag is already present in your file at line 8:
```html
<meta name="google-site-verification" content="oR0JwEy5DaydMshoHuWqIH7EycMYHPOf_QsQ1z_EBEQ" />
```

### Step 2: Run the deployment script on EC2

Since you're working directly on EC2, run this command in your terminal:

```bash
cd ~/genvedha-website && bash deploy-verification-now.sh
```

**OR** if you prefer manual commands:

```bash
cd ~/genvedha-website
pm2 restart genvedha-website
```

### Step 3: Verify the tag is live

After restarting, check if the tag is visible on your live site:

```bash
curl -s https://genvedha.com/ | grep google-site-verification
```

You should see:
```html
<meta name="google-site-verification" content="oR0JwEy5DaydMshoHuWqIH7EycMYHPOf_QsQ1z_EBEQ" />
```

### Step 4: Verify in Google Search Console

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Click the **Verify** button
3. It should now successfully verify! ✅

## If It Still Doesn't Work

### Option A: Check if Nginx is caching
```bash
sudo systemctl reload nginx
```

### Option B: Check PM2 status
```bash
pm2 list
pm2 logs genvedha-website --lines 50
```

### Option C: Try the HTML file verification method instead

1. The file `public/googled2aa9717f21f7609.html` already exists with the correct content
2. Make sure it's accessible at: https://genvedha.com/googled2aa9717f21f7609.html
3. In Google Search Console, choose "HTML file" verification method
4. Click Verify

### Option D: Full restart
```bash
cd ~/genvedha-website
pm2 stop genvedha-website
pm2 start server.js --name genvedha-website
pm2 save
```

## Quick Commands Summary

```bash
# Navigate to project
cd ~/genvedha-website

# Restart application
pm2 restart genvedha-website

# Verify tag is live
curl -s https://genvedha.com/ | grep google-site-verification

# Check PM2 status
pm2 list

# View logs if needed
pm2 logs genvedha-website
```

## Current Status
✅ Verification tag is in `public/index.html` (line 8)
✅ Verification file `googled2aa9717f21f7609.html` exists
✅ Deployment script created: `deploy-verification-now.sh`
🎯 **Next step**: Run the script or restart PM2 on your EC2 server
