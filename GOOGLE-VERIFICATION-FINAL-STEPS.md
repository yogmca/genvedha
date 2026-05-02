# Google Search Console Verification - Final Steps

## ✅ What's Been Done

1. ✅ Added Google verification meta tag to [`public/index-template.html`](public/index-template.html:7)
2. ✅ Rebuilt the React application with `npm run build`
3. ✅ Verification tag is now in [`dist/index.html`](dist/index.html:1)
4. ✅ Changes committed and pushed to GitHub

## 🎯 Final Step: Restart PM2 on EC2

Since you're working directly on EC2, you just need to restart the PM2 applications to serve the new build:

### Option 1: Quick Restart (Recommended)
```bash
pm2 restart all
```

### Option 2: Using the deployment script
```bash
cd ~/genvedha-website
bash deploy.sh
```

## 🔍 Verify It's Working

After restarting PM2, check if the tag is live:

```bash
curl -s https://genvedha.com/ | grep google-site-verification
```

You should see:
```html
<meta name="google-site-verification" content="oR0JwEy5DaydMshoHuWqIH7EycMYHPOf_QsQ1z_EBEQ"/>
```

## 🎉 Complete Verification in Google Search Console

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Select your property (genvedha.com)
3. Click the **Verify** button
4. Google will check for the meta tag and verify your site ✅

## 📋 Verification Tag Details

**Method:** HTML meta tag  
**Tag Location:** In the `<head>` section  
**Content:** `oR0JwEy5DaydMshoHuWqIH7EycMYHPOf_QsQ1z_EBEQ`

The tag is now in:
- ✅ [`public/index-template.html`](public/index-template.html:7) (source template)
- ✅ [`dist/index.html`](dist/index.html:1) (built file)
- ⏳ Needs PM2 restart to serve the new build

## 🔧 Troubleshooting

### If verification still fails after PM2 restart:

1. **Clear Nginx cache:**
   ```bash
   sudo systemctl reload nginx
   ```

2. **Check what's being served:**
   ```bash
   curl -s https://genvedha.com/ | head -5
   ```

3. **Verify dist folder is being served:**
   ```bash
   ls -la ~/genvedha-website/dist/
   ```

4. **Check PM2 logs:**
   ```bash
   pm2 logs --lines 50
   ```

### Alternative: Use HTML File Verification

If the meta tag method continues to have issues, you can use the HTML file method:

1. The file [`public/googled2aa9717f21f7609.html`](public/googled2aa9717f21f7609.html:1) already exists
2. Copy it to the dist folder:
   ```bash
   cp public/googled2aa9717f21f7609.html dist/
   ```
3. Restart PM2: `pm2 restart all`
4. Verify it's accessible: https://genvedha.com/googled2aa9717f21f7609.html
5. In Google Search Console, choose "HTML file" verification method

## 📝 Summary

The Google Search Console verification meta tag has been successfully added to your React application template and the app has been rebuilt. The final step is to restart PM2 on your EC2 server to serve the updated build with the verification tag.

**Command to run on EC2:**
```bash
pm2 restart all
```

Then verify in Google Search Console!
