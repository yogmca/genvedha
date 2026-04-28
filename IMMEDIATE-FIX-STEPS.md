# 🚨 IMMEDIATE FIX - GenVedha.com Not Opening

**Issue**: https://genvedha.com is not accessible  
**Previous State**: http://3.11.178.44:3000 was working  
**Current Time**: 2026-04-28 23:34 IST

---

## 🎯 Quick Diagnosis

The site has **TWO separate issues**:

### Issue 1: Port 3000 May Be Down ⚠️
- Direct IP access (http://3.11.178.44:3000) may have stopped working
- This means the Node.js application might have crashed

### Issue 2: Domain SSL/DNS Issues ❌
- https://genvedha.com has SSL errors
- Multiple DNS A records causing conflicts
- Nginx configuration issues

---

## ✅ IMMEDIATE FIX (Do This First)

### Step 1: SSH into Your EC2 Instance

```bash
# Replace with your actual key file path
ssh -i ~/path/to/your-key.pem ec2-user@3.11.178.44
```

### Step 2: Run Emergency Fix Script

```bash
# Navigate to project directory
cd ~/genvedha-website

# Download and run the emergency fix script
curl -o emergency-fix.sh https://raw.githubusercontent.com/yourusername/genvedha-website/main/emergency-fix.sh

# Or if you have the script locally, make it executable
chmod +x emergency-fix.sh

# Run it
./emergency-fix.sh
```

### Step 3: Manual Quick Fix (If Script Not Available)

```bash
# 1. Check PM2 status
pm2 status

# 2. If app is not running or errored, restart it
pm2 restart genvedha-website

# 3. If app doesn't exist in PM2, start it
cd ~/genvedha-website
pm2 start server.js --name genvedha-website
pm2 save

# 4. Check if it's working
curl http://localhost:3000

# 5. Check logs for errors
pm2 logs genvedha-website --lines 50

# 6. Verify port 3000 is listening
sudo netstat -tlnp | grep 3000

# 7. Test from outside
curl http://3.11.178.44:3000
```

---

## 🔍 Diagnostic Commands

Run these to understand what's wrong:

```bash
# Check if application is running
pm2 status

# Check application logs
pm2 logs genvedha-website --lines 100

# Check if port 3000 is listening
sudo netstat -tlnp | grep 3000

# Test local connection
curl -I http://localhost:3000

# Check Nginx status
sudo systemctl status nginx

# Check Nginx configuration
sudo nginx -t

# Check SSL certificates
sudo certbot certificates

# Check disk space (app might have crashed due to full disk)
df -h

# Check memory
free -h

# Check if .env file exists
ls -la ~/genvedha-website/.env
```

---

## 🚑 Common Issues & Quick Fixes

### Issue A: PM2 Shows "errored" or "stopped"

**Fix:**
```bash
cd ~/genvedha-website
pm2 delete genvedha-website
pm2 start server.js --name genvedha-website
pm2 save
pm2 logs genvedha-website
```

### Issue B: Port 3000 Already in Use

**Fix:**
```bash
# Find what's using port 3000
sudo lsof -i :3000

# Kill the process (replace PID with actual process ID)
sudo kill -9 PID

# Restart your app
pm2 restart genvedha-website
```

### Issue C: Application Crashes Immediately

**Fix:**
```bash
# Check logs for the error
pm2 logs genvedha-website --lines 200

# Common causes:
# 1. Missing .env file
ls -la ~/genvedha-website/.env

# 2. MongoDB connection error
# Check .env has correct MONGODB_URI

# 3. Port permission issue
# Try running on different port temporarily
PORT=8080 pm2 start server.js --name genvedha-website
```

### Issue D: Out of Memory

**Fix:**
```bash
# Check memory
free -h

# Restart PM2 with memory limit
pm2 delete genvedha-website
pm2 start server.js --name genvedha-website --max-memory-restart 500M
pm2 save
```

### Issue E: Disk Full

**Fix:**
```bash
# Check disk space
df -h

# Clear PM2 logs
pm2 flush

# Clear old logs
sudo journalctl --vacuum-time=3d

# Clear apt cache
sudo apt clean
```

---

## 🎯 Expected Results After Fix

### Test 1: Local Test (on EC2)
```bash
curl http://localhost:3000
# Expected: HTML content (200 OK)
```

### Test 2: Direct IP Test (from your computer)
```bash
curl http://3.11.178.44:3000
# Expected: HTML content (200 OK)
```

### Test 3: PM2 Status
```bash
pm2 status
# Expected: genvedha-website | online | 0 restarts
```

---

## 📊 Troubleshooting Decision Tree

```
Is PM2 showing "online"?
├─ NO → Restart: pm2 restart genvedha-website
│       Still failing? → Check logs: pm2 logs genvedha-website
│       
└─ YES → Is port 3000 listening?
         ├─ NO → Something else is wrong
         │       Check: sudo netstat -tlnp | grep 3000
         │       
         └─ YES → Does localhost:3000 work?
                  ├─ NO → Application error
                  │       Check: curl http://localhost:3000
                  │       
                  └─ YES → Does external IP work?
                           ├─ NO → AWS Security Group issue
                           │       Check: Port 3000 in Security Group
                           │       
                           └─ YES → Issue is with domain/SSL
                                    See: SITE-DOWN-DIAGNOSIS.md
```

---

## 🔧 Complete Restart Procedure

If nothing else works, do a complete restart:

```bash
# 1. Stop everything
pm2 stop all
sudo systemctl stop nginx

# 2. Navigate to project
cd ~/genvedha-website

# 3. Pull latest code (if needed)
git pull origin main

# 4. Install dependencies (if needed)
npm install

# 5. Check .env file exists
ls -la .env

# 6. Start application
pm2 start server.js --name genvedha-website
pm2 save

# 7. Wait 5 seconds
sleep 5

# 8. Check status
pm2 status

# 9. Test locally
curl http://localhost:3000

# 10. Start Nginx
sudo systemctl start nginx

# 11. Test everything
curl http://localhost:80
curl http://3.11.178.44:3000
```

---

## 📞 Emergency Checklist

Work through this checklist in order:

- [ ] Can you SSH into EC2? `ssh -i key.pem ec2-user@3.11.178.44`
- [ ] Is PM2 installed? `pm2 --version`
- [ ] Is app in PM2? `pm2 list`
- [ ] Is app status "online"? `pm2 status`
- [ ] Is port 3000 listening? `sudo netstat -tlnp | grep 3000`
- [ ] Does localhost:3000 work? `curl http://localhost:3000`
- [ ] Does external IP work? `curl http://3.11.178.44:3000`
- [ ] Any errors in logs? `pm2 logs genvedha-website`
- [ ] Is disk full? `df -h`
- [ ] Is memory full? `free -h`

---

## 🎯 Priority Actions

### Priority 1: Get Port 3000 Working (5 minutes)
```bash
ssh -i key.pem ec2-user@3.11.178.44
cd ~/genvedha-website
pm2 restart genvedha-website
pm2 logs genvedha-website
curl http://localhost:3000
```

### Priority 2: Fix Domain Access (30 minutes)
- See [`SITE-DOWN-DIAGNOSIS.md`](SITE-DOWN-DIAGNOSIS.md:1) for DNS/SSL fixes
- Main issue: Multiple DNS A records in GoDaddy
- Need to clean up DNS and regenerate SSL certificate

---

## 📱 Quick Status Check

Run this one-liner to get full status:

```bash
echo "=== PM2 Status ===" && pm2 status && echo "" && echo "=== Port 3000 ===" && sudo netstat -tlnp | grep 3000 && echo "" && echo "=== Local Test ===" && curl -I http://localhost:3000 && echo "" && echo "=== Nginx ===" && sudo systemctl status nginx --no-pager && echo "" && echo "=== Disk Space ===" && df -h / && echo "" && echo "=== Memory ===" && free -h
```

---

## 🆘 If Nothing Works

### Last Resort: Complete Redeployment

```bash
# 1. Backup current state
cd ~
tar -czf genvedha-backup-$(date +%Y%m%d-%H%M%S).tar.gz genvedha-website/

# 2. Stop everything
pm2 delete all
sudo systemctl stop nginx

# 3. Fresh clone
cd ~
rm -rf genvedha-website
git clone https://github.com/yourusername/genvedha-website.git
cd genvedha-website

# 4. Setup
npm install
cp .env.example .env
# Edit .env with your actual values
nano .env

# 5. Start
pm2 start server.js --name genvedha-website
pm2 save
pm2 startup

# 6. Test
curl http://localhost:3000
```

---

## 📚 Related Documentation

- **Full Diagnosis**: [`SITE-DOWN-DIAGNOSIS.md`](SITE-DOWN-DIAGNOSIS.md:1)
- **DNS Setup**: [`GODADDY-DOMAIN-SETUP.md`](GODADDY-DOMAIN-SETUP.md:1)
- **Deployment Guide**: [`EC2-REDEPLOY-GUIDE.md`](EC2-REDEPLOY-GUIDE.md:1)
- **Troubleshooting**: [`TROUBLESHOOTING-SITE-DOWN.md`](TROUBLESHOOTING-SITE-DOWN.md:1)

---

## 🎯 Success Criteria

Site is fixed when:

1. ✅ `pm2 status` shows "online"
2. ✅ `curl http://localhost:3000` returns HTML
3. ✅ `curl http://3.11.178.44:3000` returns HTML
4. ✅ `curl http://genvedha.com` returns response
5. ✅ `https://genvedha.com` loads in browser

---

**Your EC2 IP**: 3.11.178.44  
**Last Known Working**: http://3.11.178.44:3000  
**Target**: https://genvedha.com  
**Created**: 2026-04-28 23:34 IST
