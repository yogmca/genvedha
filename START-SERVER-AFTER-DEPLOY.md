# Start Server After SEO Deployment

## ⚠️ Issue: PM2 Process Not Found

You pulled the latest changes but got this error:
```
[PM2][ERROR] Process or Namespace genvedha-server not found
```

This means the server isn't running under PM2 yet.

---

## ✅ Solution: Start the Server

### Option 1: Start with PM2 (Recommended)

```bash
# You're already in the directory, so just start it
pm2 start server.js --name genvedha-server

# Save PM2 configuration
pm2 save

# Set PM2 to start on system boot
pm2 startup
```

### Option 2: Check if it's running under a different name

```bash
# List all PM2 processes
pm2 list

# If you see a process, restart it
pm2 restart <process-name-or-id>
```

### Option 3: Start with Node directly (if PM2 doesn't work)

```bash
# Start in background
nohup node server.js > server.log 2>&1 &

# Check if it's running
ps aux | grep node
```

---

## ✅ Verify Server is Running

### Test locally on server:
```bash
# Test sitemap
curl http://localhost:3000/sitemap.xml

# Test robots.txt
curl http://localhost:3000/robots.txt

# Test homepage
curl http://localhost:3000/
```

### Test from browser:
- https://genvedha.com/sitemap.xml
- https://genvedha.com/robots.txt
- https://genvedha.com/

---

## 🔧 Complete Server Setup Commands

Run these commands on your server:

```bash
# Navigate to project
cd /home/ubuntu/genvedha-website

# Start server with PM2
pm2 start server.js --name genvedha-server

# Save PM2 process list
pm2 save

# Setup PM2 to start on boot
pm2 startup

# Check status
pm2 status

# View logs
pm2 logs genvedha-server

# Test endpoints
curl http://localhost:3000/sitemap.xml
curl http://localhost:3000/robots.txt
```

---

## 📊 Expected Output

After running `pm2 start server.js --name genvedha-server`, you should see:

```
[PM2] Starting server.js in fork_mode (1 instance)
[PM2] Done.
┌─────┬──────────────────┬─────────────┬─────────┬─────────┬──────────┐
│ id  │ name             │ mode        │ ↺       │ status  │ cpu      │
├─────┼──────────────────┼─────────────┼─────────┼─────────┼──────────┤
│ 0   │ genvedha-server  │ fork        │ 0       │ online  │ 0%       │
└─────┴──────────────────┴─────────────┴─────────┴─────────┴──────────┘
```

And in the logs:
```
✅ Connected to MongoDB successfully!
✅ Email transporter configured successfully!
🚀 Server is running on http://localhost:3000
📦 Serving React app from /dist
🔌 API endpoints available at /api/*
```

---

## 🎯 After Server Starts

### 1. Test SEO Files
```bash
# Should return XML content
curl https://genvedha.com/sitemap.xml

# Should return robots.txt content
curl https://genvedha.com/robots.txt
```

### 2. Check Meta Tags
Visit https://genvedha.com and view page source (Ctrl+U):
- Look for `<title>GenVedha - Global AI & Software Development...`
- Look for `<meta name="description"...`
- Look for `<script type="application/ld+json">` (structured data)

### 3. Submit to Google Search Console
Follow: [`GOOGLE-SEARCH-CONSOLE-SETUP.md`](GOOGLE-SEARCH-CONSOLE-SETUP.md)

---

## 🔧 Troubleshooting

### Server won't start
```bash
# Check if port 3000 is already in use
sudo lsof -i :3000

# If something is using it, kill it
sudo kill -9 <PID>

# Then start server again
pm2 start server.js --name genvedha-server
```

### MongoDB connection error
```bash
# Check .env file exists
ls -la /home/ubuntu/genvedha-website/.env

# If missing, create it from example
cp .env.example .env
nano .env
# Add your MongoDB credentials

# Restart server
pm2 restart genvedha-server
```

### Permission errors
```bash
# Fix ownership
sudo chown -R ubuntu:ubuntu /home/ubuntu/genvedha-website

# Try starting again
pm2 start server.js --name genvedha-server
```

---

## 📝 Quick Reference

```bash
# Start server
pm2 start server.js --name genvedha-server

# Restart server
pm2 restart genvedha-server

# Stop server
pm2 stop genvedha-server

# View logs
pm2 logs genvedha-server

# Check status
pm2 status

# Save PM2 config
pm2 save

# Test endpoints
curl http://localhost:3000/sitemap.xml
curl http://localhost:3000/robots.txt
```

---

**Your SEO files are deployed! Just start the server and you're good to go.**

*Last Updated: April 30, 2026*
