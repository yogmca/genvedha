# Quick Deploy SEO Updates - GenVedha

## 🚀 Fast Deployment Guide

Since you don't have a PEM file, here are the easiest ways to deploy your SEO updates:

---

## Option 1: Using Git (Recommended - Easiest)

If your server has Git access to your repository:

```bash
# SSH into your server
ssh ubuntu@your-server-ip

# Navigate to project
cd /home/ubuntu/genvedha-website

# Pull latest changes
git pull origin main

# Restart server
pm2 restart genvedha-server

# Test
curl http://localhost:3000/sitemap.xml
curl http://localhost:3000/robots.txt
```

**Advantages:**
- ✅ Fastest method
- ✅ No file transfers needed
- ✅ Version controlled
- ✅ Easy to rollback

---

## Option 2: Using the Deployment Script

Run the interactive deployment script:

```bash
# Make script executable (already done)
chmod +x deploy-seo-updates.sh

# Run the script
./deploy-seo-updates.sh
```

**The script will ask you:**
1. Your server IP address
2. Authentication method:
   - SSH Key (if you have one)
   - Password (will prompt during upload)
   - SSH config (if already set up)

**Then it will:**
- Upload all SEO files
- Restart your server
- Test the endpoints
- Show you next steps

---

## Option 3: Manual SCP Upload (No PEM needed)

Upload files using password authentication:

```bash
# Upload sitemap
scp public/sitemap.xml ubuntu@your-server-ip:/home/ubuntu/genvedha-website/public/

# Upload robots.txt
scp public/robots.txt ubuntu@your-server-ip:/home/ubuntu/genvedha-website/public/

# Upload updated index.html
scp public/index.html ubuntu@your-server-ip:/home/ubuntu/genvedha-website/public/

# Upload .htaccess
scp public/.htaccess ubuntu@your-server-ip:/home/ubuntu/genvedha-website/public/

# Upload server.js
scp server.js ubuntu@your-server-ip:/home/ubuntu/genvedha-website/

# SSH and restart
ssh ubuntu@your-server-ip
cd /home/ubuntu/genvedha-website
pm2 restart genvedha-server
```

You'll be prompted for your password for each command.

---

## Option 4: Using SFTP Client (GUI Method)

If you prefer a graphical interface:

### Using FileZilla (Free)
1. Download FileZilla: https://filezilla-project.org/
2. Connect to your server:
   - Host: `sftp://your-server-ip`
   - Username: `ubuntu`
   - Password: your password
   - Port: `22`
3. Navigate to: `/home/ubuntu/genvedha-website/`
4. Upload these files:
   - `public/sitemap.xml`
   - `public/robots.txt`
   - `public/index.html`
   - `public/.htaccess`
   - `server.js`
5. SSH and restart server

### Using Cyberduck (Mac)
1. Download Cyberduck: https://cyberduck.io/
2. Click "Open Connection"
3. Select "SFTP"
4. Enter server details
5. Upload files
6. SSH and restart server

---

## Option 5: Copy-Paste Method (For Small Files)

For files like sitemap.xml and robots.txt:

```bash
# SSH into server
ssh ubuntu@your-server-ip

# Create/edit sitemap.xml
nano /home/ubuntu/genvedha-website/public/sitemap.xml
# Paste the content, save with Ctrl+X, Y, Enter

# Create/edit robots.txt
nano /home/ubuntu/genvedha-website/public/robots.txt
# Paste the content, save with Ctrl+X, Y, Enter

# Restart server
pm2 restart genvedha-server
```

---

## 📋 Files to Deploy

Make sure these files are uploaded:

### 1. `public/sitemap.xml`
- Contains all your website URLs
- Helps Google discover your pages

### 2. `public/robots.txt`
- Tells search engines what to crawl
- Points to your sitemap

### 3. `public/index.html`
- Updated with SEO meta tags
- Includes structured data
- Optimized title and description

### 4. `public/.htaccess`
- Performance optimizations
- Security headers
- HTTPS enforcement

### 5. `server.js`
- Routes for sitemap.xml
- Routes for robots.txt
- Proper content-type headers

---

## ✅ Verify Deployment

After deploying, test these URLs:

```bash
# Test sitemap
curl https://genvedha.com/sitemap.xml

# Test robots.txt
curl https://genvedha.com/robots.txt

# Test homepage (check for meta tags)
curl https://genvedha.com/ | grep "meta name"
```

Or visit in browser:
- https://genvedha.com/sitemap.xml
- https://genvedha.com/robots.txt
- https://genvedha.com/ (view source to see meta tags)

---

## 🔧 Troubleshooting

### "Permission denied" error
```bash
# Make sure you have write permissions
ssh ubuntu@your-server-ip
ls -la /home/ubuntu/genvedha-website/public/
# If needed, fix permissions:
sudo chown -R ubuntu:ubuntu /home/ubuntu/genvedha-website/
```

### "Connection refused"
```bash
# Check if SSH is running
ssh ubuntu@your-server-ip
# If this fails, check:
# 1. Server IP is correct
# 2. Port 22 is open in security group
# 3. Server is running
```

### "File not found" after upload
```bash
# Check if files were uploaded
ssh ubuntu@your-server-ip
ls -la /home/ubuntu/genvedha-website/public/
# Should see: sitemap.xml, robots.txt, index.html, .htaccess
```

### Sitemap returns 404
```bash
# Make sure server.js was updated and restarted
ssh ubuntu@your-server-ip
cd /home/ubuntu/genvedha-website
pm2 restart genvedha-server
pm2 logs genvedha-server
```

---

## 🎯 After Deployment

### 1. Verify Files Are Accessible
- ✅ https://genvedha.com/sitemap.xml
- ✅ https://genvedha.com/robots.txt

### 2. Submit to Google Search Console
1. Go to: https://search.google.com/search-console
2. Add property: `https://genvedha.com`
3. Verify ownership (see GOOGLE-SEARCH-CONSOLE-SETUP.md)
4. Submit sitemap: `https://genvedha.com/sitemap.xml`
5. Request indexing for homepage

### 3. Check Meta Tags
1. Visit: https://genvedha.com
2. Right-click → "View Page Source"
3. Look for:
   - `<title>GenVedha - Global AI & Software Development...`
   - `<meta name="description" content="Leading AI-based...`
   - `<script type="application/ld+json">` (structured data)

### 4. Validate Structured Data
1. Go to: https://validator.schema.org/
2. Enter: `https://genvedha.com`
3. Should show: Organization, ProfessionalService, ItemList schemas
4. No errors should appear

---

## 📞 Need Help?

### Common Issues

**Q: I don't know my server IP**
```bash
# Check your EC2 dashboard or run:
# Look in your deployment guides for the IP
grep -r "server-ip" *.md
```

**Q: I don't have SSH access**
- Check your AWS EC2 security group
- Ensure port 22 is open
- Verify you have the correct username (usually `ubuntu` or `ec2-user`)

**Q: Password authentication not working**
- Your server might require key-based auth only
- Check if you have a PEM file in your AWS account
- Download it from EC2 → Key Pairs

**Q: Files uploaded but sitemap still 404**
- Make sure you restarted the server
- Check if server.js was updated
- Verify the routes are correct

---

## 🚀 Recommended: Use Git

**Set up Git deployment (one-time setup):**

```bash
# On your local machine
git init
git add .
git commit -m "Add SEO optimization"
git remote add origin your-git-repo-url
git push origin main

# On your server
ssh ubuntu@your-server-ip
cd /home/ubuntu/genvedha-website
git init
git remote add origin your-git-repo-url
git pull origin main
pm2 restart genvedha-server
```

**Future deployments:**
```bash
# Local
git add .
git commit -m "Update SEO"
git push origin main

# Server
ssh ubuntu@your-server-ip
cd /home/ubuntu/genvedha-website
git pull origin main
pm2 restart genvedha-server
```

---

## 📚 Related Documentation

- **SEO-SETUP-GUIDE.md** - Complete SEO documentation
- **GOOGLE-SEARCH-CONSOLE-SETUP.md** - Google verification steps
- **SEO-IMPLEMENTATION-SUMMARY.md** - What was implemented
- **deploy-seo-updates.sh** - Automated deployment script

---

**Choose the method that works best for you and deploy your SEO updates!**

*Last Updated: April 30, 2026*
