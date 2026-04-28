# 🔄 RESTART SERVER - Quick Guide

**Issue**: Server needs to be restarted  
**Time Required**: 2-3 minutes

---

## 🚀 Quick Restart (Copy & Paste These Commands)

### Step 1: SSH into Your EC2 Server

```bash
ssh -i ~/path/to/your-key.pem ec2-user@3.11.178.44
```

**Replace** `~/path/to/your-key.pem` with your actual key file location.

Common key locations:
- `~/.ssh/genvedha-key.pem`
- `~/Downloads/genvedha-key.pem`
- `~/Desktop/genvedha-key.pem`

---

### Step 2: Restart the Application

Once connected to EC2, run these commands:

```bash
# Navigate to project directory
cd ~/genvedha-website

# Restart the application with PM2
pm2 restart genvedha-website

# Check status
pm2 status

# View logs to confirm it's working
pm2 logs genvedha-website --lines 20
```

---

## ✅ Verify It's Working

### Test 1: Check PM2 Status
```bash
pm2 status
```

**Expected Output:**
```
┌─────┬──────────────────────┬─────────┬─────────┐
│ id  │ name                 │ status  │ restart │
├─────┼──────────────────────┼─────────┼─────────┤
│ 0   │ genvedha-website     │ online  │ 1       │
└─────┴──────────────────────┴─────────┴─────────┘
```

### Test 2: Test Locally on EC2
```bash
curl http://localhost:3000
```

**Expected:** Should return HTML content

### Test 3: Test from Your Computer
Open a new terminal on your local machine and run:

```bash
curl http://3.11.178.44:3000
```

**Expected:** Should return HTML content

### Test 4: Test in Browser
Open your browser and go to:
- http://3.11.178.44:3000

---

## 🔧 If PM2 Restart Doesn't Work

### Option A: Delete and Restart
```bash
cd ~/genvedha-website
pm2 delete genvedha-website
pm2 start server.js --name genvedha-website
pm2 save
pm2 status
```

### Option B: Check for Errors
```bash
# View detailed logs
pm2 logs genvedha-website --lines 100

# Check if port 3000 is already in use
sudo netstat -tlnp | grep 3000

# If something else is using port 3000, kill it
sudo lsof -i :3000
# Then kill the process: sudo kill -9 <PID>
```

### Option C: Complete Restart
```bash
# Stop all PM2 processes
pm2 stop all

# Start fresh
cd ~/genvedha-website
pm2 start server.js --name genvedha-website
pm2 save

# Setup auto-restart on reboot
pm2 startup
pm2 save
```

---

## 🚨 If You Can't SSH

### Check 1: Is Your Key File Correct?
```bash
# Check if key file exists
ls -la ~/path/to/your-key.pem

# Set correct permissions
chmod 400 ~/path/to/your-key.pem
```

### Check 2: Is EC2 Instance Running?
1. Go to AWS Console: https://console.aws.amazon.com/ec2/
2. Click "Instances"
3. Find your instance (IP: 3.11.178.44)
4. Check status - should be "Running" (green)
5. If stopped, click "Instance State" → "Start Instance"

### Check 3: Is Port 22 Open?
1. AWS Console → EC2 → Instances
2. Select your instance
3. Click "Security" tab
4. Click on the Security Group name
5. Check "Inbound rules" - should have:
   - Type: SSH, Port: 22, Source: 0.0.0.0/0

---

## 🎯 One-Command Restart

If you're already SSH'd into EC2, run this single command:

```bash
cd ~/genvedha-website && pm2 restart genvedha-website && sleep 3 && pm2 status && echo "" && echo "Testing..." && curl -I http://localhost:3000
```

---

## 📊 Full Diagnostic & Restart

Run this comprehensive script:

```bash
cd ~/genvedha-website && \
echo "=== Current Status ===" && \
pm2 status && \
echo "" && \
echo "=== Restarting Application ===" && \
pm2 restart genvedha-website && \
sleep 5 && \
echo "" && \
echo "=== New Status ===" && \
pm2 status && \
echo "" && \
echo "=== Testing Local Connection ===" && \
curl -I http://localhost:3000 && \
echo "" && \
echo "=== Recent Logs ===" && \
pm2 logs genvedha-website --lines 10 --nostream && \
echo "" && \
echo "=== Port Check ===" && \
sudo netstat -tlnp | grep 3000 && \
echo "" && \
echo "✅ Restart Complete!"
```

---

## 🔄 Restart Nginx (If Using HTTPS)

If you're also using Nginx for HTTPS:

```bash
# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Check status
sudo systemctl status nginx

# View Nginx logs if there are issues
sudo tail -f /var/log/nginx/error.log
```

---

## 📱 Quick Reference

| Action | Command |
|--------|---------|
| **SSH into EC2** | `ssh -i key.pem ec2-user@3.11.178.44` |
| **Restart app** | `pm2 restart genvedha-website` |
| **Check status** | `pm2 status` |
| **View logs** | `pm2 logs genvedha-website` |
| **Test locally** | `curl http://localhost:3000` |
| **Stop app** | `pm2 stop genvedha-website` |
| **Start app** | `pm2 start server.js --name genvedha-website` |
| **Delete app** | `pm2 delete genvedha-website` |
| **Save PM2 config** | `pm2 save` |

---

## 🎯 Expected Timeline

| Step | Time |
|------|------|
| SSH into EC2 | 30 seconds |
| Restart application | 10 seconds |
| Verify it's working | 30 seconds |
| **Total** | **~2 minutes** |

---

## ✅ Success Checklist

After restart, verify:

- [ ] PM2 shows status "online"
- [ ] `curl http://localhost:3000` returns HTML
- [ ] `curl http://3.11.178.44:3000` returns HTML (from local machine)
- [ ] Browser loads http://3.11.178.44:3000
- [ ] No errors in `pm2 logs genvedha-website`

---

## 🆘 Still Not Working?

If restart doesn't fix it, the issue might be:

1. **Application Code Error**
   - Check logs: `pm2 logs genvedha-website --lines 200`
   - Look for error messages

2. **Missing .env File**
   - Check: `ls -la ~/genvedha-website/.env`
   - If missing, copy from example: `cp .env.example .env`
   - Edit with correct values: `nano .env`

3. **MongoDB Connection Issue**
   - Check .env has correct MONGODB_URI
   - Test MongoDB connection

4. **Port Already in Use**
   - Check: `sudo lsof -i :3000`
   - Kill conflicting process

5. **Out of Memory/Disk**
   - Check memory: `free -h`
   - Check disk: `df -h`

---

## 📞 Need More Help?

See these guides:
- **Full Diagnosis**: [`SITE-DOWN-DIAGNOSIS.md`](SITE-DOWN-DIAGNOSIS.md:1)
- **Immediate Fix Steps**: [`IMMEDIATE-FIX-STEPS.md`](IMMEDIATE-FIX-STEPS.md:1)
- **Emergency Fix Script**: [`emergency-fix.sh`](emergency-fix.sh:1)
- **Troubleshooting**: [`TROUBLESHOOTING-SITE-DOWN.md`](TROUBLESHOOTING-SITE-DOWN.md:1)

---

**Your EC2 IP**: 3.11.178.44  
**SSH Command**: `ssh -i your-key.pem ec2-user@3.11.178.44`  
**Restart Command**: `pm2 restart genvedha-website`  
**Created**: 2026-04-28 23:35 IST
